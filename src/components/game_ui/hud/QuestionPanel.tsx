'use client'

import React, { useEffect, useState } from 'react'
import type { EventBus } from '@/lib/pixi-engine/core/EventBus'
import {
  GAME_EVENTS,
  GAME_STATE_EVENTS,
  HUD_EVENTS,
  type AnswerSelectedPayload,
  type HudQuestionShownPayload,
} from '@/lib/pixi-engine/core/EventTypes'

const LETTERS = ['A', 'B', 'C', 'D'] as const

interface QuestionPanelProps {
  eventBus: EventBus
  className?: string
  isMobile?: boolean
}

/**
 * Shared-question card for Tug of War. Clicks emit HUD_EVENTS.ANSWER_SELECTED;
 * the 3D game owns correctness and scoring.
 */
const QuestionPanel: React.FC<QuestionPanelProps> = ({
  eventBus,
  className,
  isMobile = false,
}) => {
  const [question, setQuestion] = useState<HudQuestionShownPayload | null>(null)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [resolvedCorrect, setResolvedCorrect] = useState<boolean | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const onShown = (payload: HudQuestionShownPayload) => {
      setQuestion(payload)
      setPickedIndex(null)
      setResolvedCorrect(null)
      setLocked(false)
    }
    const onResolved = (payload: AnswerSelectedPayload) => {
      setLocked(true)
      setResolvedCorrect(payload.isCorrect)
    }
    const onEnded = () => {
      setQuestion(null)
      setLocked(true)
    }

    eventBus.on(HUD_EVENTS.QUESTION_SHOWN, onShown)
    eventBus.on(GAME_EVENTS.ANSWER_SELECTED, onResolved)
    eventBus.on(GAME_STATE_EVENTS.GAME_ENDED, onEnded)
    return () => {
      eventBus.off(HUD_EVENTS.QUESTION_SHOWN, onShown)
      eventBus.off(GAME_EVENTS.ANSWER_SELECTED, onResolved)
      eventBus.off(GAME_STATE_EVENTS.GAME_ENDED, onEnded)
    }
  }, [eventBus])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (locked || !question) return
      const fromLetter = event.key.toLowerCase().charCodeAt(0) - 97
      const fromDigit = Number(event.key) - 1
      const index = event.key >= '1' && event.key <= '4' ? fromDigit : fromLetter
      if (index >= 0 && index < question.answers.length) {
        event.preventDefault()
        setPickedIndex(index)
        setLocked(true)
        eventBus.emit(HUD_EVENTS.ANSWER_SELECTED, { selectedIndex: index })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [eventBus, locked, question])

  if (!question) return null

  const pick = (index: number) => {
    if (locked) return
    setPickedIndex(index)
    setLocked(true)
    eventBus.emit(HUD_EVENTS.ANSWER_SELECTED, { selectedIndex: index })
  }

  return (
    <div
      className={`${className ?? ''} pointer-events-auto mx-auto w-[min(920px,92vw)] rounded-[28px] border-2 border-[var(--border-dark,#1E5167)] bg-[var(--panel-bg,#ffffff)]/95 p-3 shadow-[4px_4px_0_0_var(--border-dark,#1E5167)] sm:p-4`}
      role="region"
      aria-label="Question"
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 sm:gap-4`}>
        {question.imageUrl && (
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--border-dark,#1E5167)] bg-white sm:h-40 sm:w-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="grandstander mb-3 text-lg font-bold text-[var(--heading-color,#114257)] sm:text-2xl">
            {question.question}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.answers.map((answer, index) => {
              const optionId = `${question.questionId}-answer-${index}`
              const isPicked = pickedIndex === index
              const showCorrect = resolvedCorrect === true && isPicked
              const showWrong = resolvedCorrect === false && isPicked
              return (
                <button
                  key={optionId}
                  type="button"
                  disabled={locked}
                  onClick={() => pick(index)}
                  className={`grandstander flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-base font-semibold transition sm:text-lg
                    ${
                      showWrong
                        ? 'border-red-500 bg-red-100 text-red-900'
                        : showCorrect
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                          : isPicked
                            ? 'border-[var(--primary-accent-hover)] bg-[var(--secondary-bg)]'
                            : 'border-[var(--border-dark,#1E5167)] bg-[var(--primary-accent,#2b6cb0)] text-[var(--button-text-light,#ffffff)] hover:brightness-110'
                    }
                    disabled:cursor-not-allowed`}
                  aria-label={`Answer ${LETTERS[index]}: ${answer}`}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[var(--heading-color,#114257)]">
                    {LETTERS[index]}
                  </span>
                  <span className="min-w-0 break-words">{answer}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionPanel
