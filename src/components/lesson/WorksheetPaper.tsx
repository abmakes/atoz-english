'use client'

import { useRef, useState } from 'react'
import { isRealPicture, type WorksheetActivity, type WorksheetItem } from '@/lib/lesson/assess'
import { EXERCISE_ORDER, EXERCISE_TITLE, exerciseInstruction, worksheetLineNumbers } from '@/lib/lesson/worksheet-practice'

const WRITE_ON_LINE = new Set<WorksheetActivity>(['question', 'rewrite'])

function activityOf(item: WorksheetItem): WorksheetActivity {
  if (item.activity) return item.activity
  if (item.line.includes('______')) return 'gap'
  if (item.choices.length > 0) return 'choice'
  if (item.line.trim().endsWith('?')) return 'question'
  return 'practice'
}

function groupExercises(items: WorksheetItem[]) {
  const groups: { title: string; activity: WorksheetActivity; instruction: string; items: { item: WorksheetItem; index: number }[] }[] = []
  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (EXERCISE_ORDER[activityOf(a.item)] ?? 9) - (EXERCISE_ORDER[activityOf(b.item)] ?? 9))
  for (const entry of ordered) {
    const activity = activityOf(entry.item)
    const title = entry.item.exercise || (activity in EXERCISE_TITLE ? EXERCISE_TITLE[activity as keyof typeof EXERCISE_TITLE] : activity)
    const last = groups[groups.length - 1]
    if (last && last.title === title) last.items.push(entry)
    else groups.push({ title, activity, instruction: entry.item.instruction || exerciseInstruction(activity), items: [entry] })
  }
  return groups
}

function wordBank(items: WorksheetItem[]): string[] {
  return items
    .map((item) => item.bank?.trim() ?? '')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function PrintedLine({ line, activity }: { line: string; activity: string }) {
  if (activity !== 'gap' || !line.includes('______')) return <>{line}</>
  const parts = line.split('______')
  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? <span className="worksheet-blank" /> : null}
        </span>
      ))}
    </>
  )
}

function LineEditor({
  line,
  activity,
  label,
  onCommit,
}: {
  line: string
  activity: string
  label: string
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const cancel = useRef(false)
  if (draft === null) {
    return (
      <button type="button" className="worksheet-editable" onClick={() => setDraft(line)}>
        <PrintedLine line={line} activity={activity} />
      </button>
    )
  }
  return (
    <input
      className="worksheet-field"
      aria-label={label}
      value={draft}
      autoFocus
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.trim()
        const skipped = cancel.current
        cancel.current = false
        setDraft(null)
        if (!skipped && next && next !== line) onCommit(next)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          cancel.current = true
          setDraft(null)
        }
      }}
    />
  )
}

export default function WorksheetPaper({
  title,
  items,
  withKey,
  busy = false,
  onChange,
  onReplace,
}: {
  title: string
  items: WorksheetItem[]
  withKey: boolean
  busy?: boolean
  onChange: (next: WorksheetItem[]) => void
  onReplace?: (index: number) => void
}) {
  const update = (index: number, patch: Partial<WorksheetItem>) => {
    onChange(items.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  }

  return (
    <div className="worksheet rounded border bg-white shadow-sm">
      <p className="worksheet-edit-hint no-print">Click a line to change it.</p>
      <div className="worksheet-head">
        <h1 className="grandstander">{title}</h1>
        <div className="worksheet-meta">Name: ________________ &nbsp; Date: __________</div>
      </div>
      {groupExercises(items).map((group) => {
        const numbers = worksheetLineNumbers(group.items.map((entry) => Boolean(entry.item.held)))
        return (
          <section key={group.title} className={`worksheet-exercise is-${group.activity}`}>
            <h2>{group.title}</h2>
            {group.instruction ? <p className="worksheet-instruction">{group.instruction}</p> : null}
            {group.activity === 'gap' && wordBank(group.items.map((entry) => entry.item)).length > 0 ? (
              <ul className="worksheet-bank">
                {wordBank(group.items.map((entry) => entry.item)).map((word, index) => (
                  <li key={`${word}-${index}`}>{word}</li>
                ))}
              </ul>
            ) : null}
            <ol className="worksheet-items">
              {group.items.map(({ item, index }, position) => (
                <li
                  key={`${item.questionId ?? group.activity}-${index}`}
                  className={`worksheet-item is-${group.activity}${item.held ? ' is-held' : ''}${item.example ? ' is-example' : ''}`}
                >
                  <span className="worksheet-num">{numbers[position] ?? ''}</span>
                  {group.activity === 'choice' && isRealPicture(item.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="worksheet-photo" />
                  ) : null}
                  <div className="worksheet-body">
                    <p className="worksheet-line">
                      <LineEditor
                        line={item.line}
                        activity={group.activity}
                        label={`Question ${numbers[position] ?? ''}`}
                        onCommit={(line) => update(index, { line })}
                      />
                      {item.example && item.answer ? <span className="worksheet-example-answer"> {item.answer}</span> : null}
                    </p>
                    {WRITE_ON_LINE.has(group.activity) && !item.example ? <div className="worksheet-write" /> : null}
                    {group.activity === 'choice' && item.choices.length > 0 ? (
                      <ul className={`worksheet-choices${item.choices.length === 3 ? ' is-three' : ''}`}>
                        {item.choices.map((choice, choiceIndex) => (
                          <li key={`${choice}-${choiceIndex}`} className={item.example && choice === item.answer ? 'is-key' : ''}>
                            <span className="worksheet-circle" />
                            <LineEditor
                              line={choice}
                              activity="choice"
                              label={`Answer ${choiceIndex + 1}`}
                              onCommit={(next) => {
                                const choices = item.choices.map((value, valueIndex) => (valueIndex === choiceIndex ? next : value))
                                update(index, { choices, answer: item.answer === choice ? next : item.answer })
                              }}
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.warning ? <p className="worksheet-warning no-print">{item.warning}</p> : null}
                    <div className="worksheet-row-actions no-print">
                      <button type="button" onClick={() => update(index, { held: !item.held })}>
                        {item.held ? 'Put back' : 'Leave off the page'}
                      </button>
                      {onReplace ? (
                        <button type="button" disabled={busy} onClick={() => onReplace(index)}>
                          Replace
                        </button>
                      ) : null}
                      <button type="button" onClick={() => onChange(items.filter((_, rowIndex) => rowIndex !== index))}>
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
      {withKey ? (
        <section className="worksheet-key">
          <h2>Answer key</h2>
          {groupExercises(items).map((group) => {
            const numbers = worksheetLineNumbers(group.items.map((entry) => Boolean(entry.item.held)))
            const answers = group.items.flatMap((entry, position) => {
              const number = numbers[position]
              if (entry.item.held || entry.item.example || !entry.item.answer || number === null) return []
              return [{ number, answer: entry.item.answer, line: entry.item.line }]
            })
            if (answers.length === 0) return null
            return (
              <div key={`${group.title}-key`}>
                <h3>{group.title}</h3>
                <ol>
                  {answers.map((entry) => (
                    <li key={`${entry.line}-${entry.number}`} value={entry.number}>
                      {entry.answer}
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </section>
      ) : null}
      <style jsx global>{`
        .worksheet {
          width: 186mm;
          max-width: 100%;
          padding: 2mm 4mm 1mm;
        }
        .worksheet-edit-hint {
          margin: 0 0 2mm;
          font-size: 12px;
          color: #64748b;
        }
        .worksheet-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1.5px solid #0f172a;
          padding-top: 2mm;
          padding-bottom: 2.5mm;
          margin-bottom: 3mm;
        }
        .worksheet-head h1 {
          margin: 0;
          font-size: 16px;
          line-height: 1.15;
          font-weight: 700;
          color: #0f172a;
        }
        .worksheet-meta {
          margin: 0;
          font-size: 11px;
          line-height: 1.2;
          color: #334155;
          white-space: nowrap;
        }
        .worksheet-bank {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1mm 6mm;
          margin: 1.2mm 0 0;
          padding: 1.2mm 3mm;
          list-style: none;
          border: 1px solid #0f172a;
          border-radius: 2px;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 600;
          color: #0f172a;
        }
        .worksheet-exercise + .worksheet-exercise {
          margin-top: 4mm;
          padding-top: 2.4mm;
          border-top: 1px solid #94a3b8;
        }
        .worksheet-exercise h2 {
          margin: 1.2mm 0 0.4mm;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 700;
          color: #0f172a;
        }
        .worksheet-exercise + .worksheet-exercise h2 {
          margin-top: 0;
        }
        .worksheet-instruction {
          margin: 0;
          font-size: 11px;
          line-height: 1.3;
          color: #334155;
        }
        .worksheet-items {
          display: flex;
          flex-direction: column;
          gap: 1.3mm;
          margin: 1.2mm 0 0;
          padding: 0;
          list-style: none;
        }
        .worksheet-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 0.45mm 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .worksheet-item.is-rewrite .worksheet-body,
        .worksheet-item.is-question .worksheet-body {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .worksheet-item.is-rewrite .worksheet-line,
        .worksheet-item.is-question .worksheet-line {
          flex: none;
          max-width: 62%;
        }
        .worksheet-item.is-question .worksheet-body {
          display: block;
        }
        .worksheet-item.is-question .worksheet-line {
          max-width: none;
        }
        .worksheet-item.is-question .worksheet-write {
          display: block;
          width: 100%;
          min-width: 0;
          margin-top: 3mm;
        }
        .worksheet-item.is-choice {
          align-items: center;
          min-height: 14.8mm;
          padding: 0.5mm 0;
        }
        .worksheet-num {
          width: 1.1rem;
          flex: none;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          color: #0f172a;
        }
        .worksheet-photo {
          width: 18mm;
          height: 13mm;
          flex: none;
          object-fit: cover;
          border: 1px solid #cbd5e1;
          border-radius: 2px;
          background: #f8fafc;
        }
        .worksheet-blank {
          display: inline-block;
          width: 28mm;
          margin: 0 1mm;
          border-bottom: 1px solid #0f172a;
          line-height: 1;
          vertical-align: baseline;
        }
        .worksheet-write {
          flex: 1;
          min-width: 45mm;
          height: 0;
          margin: 0;
          border-bottom: 1px solid #0f172a;
        }
        .worksheet-item.is-rewrite .worksheet-write {
          border-bottom-style: dashed;
        }
        .worksheet-body {
          min-width: 0;
          flex: 1;
        }
        .worksheet-line {
          margin: 0;
          font-size: 13px;
          line-height: 1.35;
          color: #0f172a;
        }
        .worksheet-editable,
        .worksheet-field {
          margin: 0;
          padding: 0;
          border: 0;
          background: none;
          font: inherit;
          color: inherit;
          text-align: left;
        }
        .worksheet-editable {
          cursor: text;
        }
        .worksheet-field {
          width: 100%;
          border-bottom: 1px dashed #94a3b8;
        }
        .worksheet-choices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px 10px;
          margin: 2px 0 0;
          padding: 0;
          list-style: none;
        }
        .worksheet-choices.is-three {
          grid-template-columns: 1fr 1fr 1fr;
        }
        .worksheet-choices li {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          font-size: 12px;
          line-height: 1.35;
          color: #1e293b;
        }
        .worksheet-circle {
          width: 11px;
          height: 11px;
          flex: none;
          border: 1.5px solid #0f172a;
          border-radius: 999px;
        }
        .worksheet-choices li.is-key .worksheet-circle {
          background: #0f172a;
        }
        .worksheet-example-answer {
          font-weight: 700;
        }
        .worksheet-warning {
          margin: 1mm 0 0;
          font-size: 11px;
          line-height: 1.3;
          color: #9a3412;
        }
        .worksheet-row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 1mm;
        }
        .worksheet-row-actions button {
          padding: 0;
          border: 0;
          background: none;
          font-size: 11px;
          text-decoration: underline;
          color: #334155;
          cursor: pointer;
        }
        .worksheet-item.is-held {
          opacity: 0.45;
        }
        .worksheet-key {
          margin-top: 8mm;
          padding-top: 3mm;
          border-top: 1.5px solid #0f172a;
        }
        .worksheet-key h2,
        .worksheet-key h3 {
          margin: 2mm 0 1mm;
          font-size: 13px;
          font-weight: 700;
        }
        .worksheet-key ol {
          margin: 0;
          padding-left: 1.2rem;
          font-size: 12px;
          line-height: 1.4;
          columns: 2;
        }
        @media print {
          nav,
          .no-print,
          .is-held {
            display: none !important;
          }
          .worksheet-field,
          .worksheet-editable {
            border: none !important;
          }
          body {
            min-height: 0 !important;
            background: white !important;
          }
          .print-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .worksheet {
            width: auto;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}
