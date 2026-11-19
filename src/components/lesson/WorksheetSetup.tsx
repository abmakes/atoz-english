'use client'

import { useState } from 'react'
import { AlignLeft, CircleDot, Files, FileText, ListChecks, PenLine, Shuffle, TextCursorInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export type WorksheetPick = 'choice' | 'gap' | 'circle' | 'unjumble' | 'write' | 'long'

const CARDS: { id: WorksheetPick; title: string; detail: string; icon: typeof ListChecks }[] = [
  { id: 'choice', title: 'Multiple choice', detail: 'Look and circle the answer.', icon: ListChecks },
  { id: 'gap', title: 'Fill in the blank', detail: 'One word missing, with room to write it.', icon: TextCursorInput },
  { id: 'circle', title: 'Circle the word', detail: 'Three words. Circle the one that fits.', icon: CircleDot },
  { id: 'unjumble', title: 'Unjumble the sentence', detail: 'Put the words in order.', icon: Shuffle },
  { id: 'write', title: 'Write the sentence', detail: 'Key words to turn into a full sentence.', icon: PenLine },
  { id: 'long', title: 'Long answers', detail: 'A short question and a line to write on.', icon: AlignLeft },
]

export function defaultWorksheetSections(level: string, hasPictures: boolean): WorksheetPick[] {
  const sentence: WorksheetPick = level === 'A2' || level === 'B1' ? 'write' : 'unjumble'
  return [...(hasPictures ? (['choice'] as const) : []), 'gap', 'circle', sentence]
}

export default function WorksheetSetup({
  level,
  hasPictures,
  busy,
  onBack,
  onWrite,
}: {
  level: string
  hasPictures: boolean
  busy: boolean
  onBack: () => void
  onWrite: (choice: { pages: 1 | 2; sections: WorksheetPick[] }) => void
}) {
  const [pages, setPages] = useState<1 | 2>(1)
  const [sections, setSections] = useState<WorksheetPick[]>(() => defaultWorksheetSections(level, hasPictures))

  const toggle = (id: WorksheetPick) => {
    setSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h3 className="text-xl font-bold">What should the worksheet include?</h3>
        <p className="mt-1 text-sm text-slate-600">Pick one page or two, then the kinds of questions. You can change any line after it is written.</p>
      </div>
      <div>
        <p className="text-sm font-semibold">Length</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {([1, 2] as const).map((count) => {
            const selected = pages === count
            const Icon = count === 1 ? FileText : Files
            return (
              <button
                key={count}
                type="button"
                aria-pressed={selected}
                onClick={() => setPages(count)}
                className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left ${selected ? 'border-[--primary-accent] bg-[--primary-light]' : 'border-[--border-dark] bg-white'}`}
              >
                <Icon size={20} />
                <span className="font-semibold">{count === 1 ? '1 page' : '2 pages'}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">Questions</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => {
            const selected = sections.includes(card.id)
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(card.id)}
                className={`flex min-h-[7.5rem] flex-col items-start gap-2 rounded-xl border-2 px-4 py-4 text-left shadow-[3px_3px_0px_0px_var(--border-dark)] ${selected ? 'border-[--primary-accent] bg-[--primary-light]' : 'border-[--border-dark] bg-white'}`}
              >
                <Icon size={20} />
                <span className="font-semibold">{card.title}</span>
                <span className="text-xs text-slate-600">{card.detail}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button
          type="button"
          disabled={busy || sections.length === 0}
          onClick={() => onWrite({ pages, sections })}
          className="bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]"
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Write the worksheet
        </Button>
      </div>
      {sections.length === 0 ? <p className="text-sm text-amber-800">Choose at least one kind of question.</p> : null}
    </div>
  )
}
