'use client'

import React, { useEffect, useRef, useState } from 'react'
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
}

/**
 * Shared-question card for Tug of War. Clicks emit HUD_EVENTS.ANSWER_SELECTED;
 * the 3D game owns correctness and scoring.
 *
 * The image, stem, and every answer stay on screen. The picture is shown in
 * full (no crop). Its height matches the question plus the answer buttons, and
 * its width follows that height. A portrait picture may grow the card; a
 * landscape one does not.
 */
const QuestionPanel: React.FC<QuestionPanelProps> = ({
  eventBus,
  className,
}) => {
  const [question, setQuestion] = useState<HudQuestionShownPayload | null>(null)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [resolvedCorrect, setResolvedCorrect] = useState<boolean | null>(null)
  const [locked, setLocked] = useState(false)
  const [copyHeight, setCopyHeight] = useState(0)
  const [imageRatio, setImageRatio] = useState<number | null>(null)
  const [wideLayout, setWideLayout] = useState(false)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const copyRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

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
    eventBus.emit(HUD_EVENTS.READY)
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

  useEffect(() => {
    setImageRatio(null)
    setCopyHeight(0)
    const img = imageRef.current
    if (img?.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setImageRatio(img.naturalWidth / img.naturalHeight)
    }
  }, [question?.questionId, question?.imageUrl])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)')
    const readViewport = () => {
      setWideLayout(media.matches)
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    readViewport()
    media.addEventListener('change', readViewport)
    window.addEventListener('resize', readViewport)
    return () => {
      media.removeEventListener('change', readViewport)
      window.removeEventListener('resize', readViewport)
    }
  }, [])

  useEffect(() => {
    const node = copyRef.current
    if (!node) return
    const measure = () => setCopyHeight(node.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [question])

  if (!question) return null

  const pick = (index: number) => {
    if (locked) return
    setPickedIndex(index)
    setLocked(true)
    eventBus.emit(HUD_EVENTS.ANSWER_SELECTED, { selectedIndex: index })
  }

  const hasImage = Boolean(question.imageUrl)
  const isPortrait = imageRatio !== null && imageRatio < 1
  let imageBox: { width: number; height: number } | null = null
  if (wideLayout && imageRatio && copyHeight > 0 && viewport.width > 0) {
    const maxWidth = Math.min(viewport.width * 0.46, 560)
    let height = copyHeight
    if (isPortrait) {
      height = Math.min(copyHeight / imageRatio, viewport.height * 0.42)
      height = Math.max(height, copyHeight)
    }
    let width = height * imageRatio
    if (width > maxWidth) {
      width = maxWidth
      height = width / imageRatio
    }
    imageBox = { width: Math.round(width), height: Math.round(height) }
  }

  return (
    <div
      className={`${className ?? ''} pointer-events-auto w-max max-w-full rounded-2xl border-[3px] border-[#163e66] bg-white/95 p-2 shadow-[3px_3px_0_0_#163e66] sm:p-2.5 lg:rounded-[28px] lg:p-3 [@media(max-height:640px)]:p-1.5`}
      role="region"
      aria-label="Question"
    >
      <div
        className={`flex items-center gap-2 sm:gap-3 ${
          hasImage ? 'flex-col sm:flex-row' : 'justify-center'
        }`}
      >
        {question.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            ref={imageRef}
            src={question.imageUrl}
            alt=""
            onLoad={(event) => {
              const img = event.currentTarget
              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                setImageRatio(img.naturalWidth / img.naturalHeight)
              }
            }}
            style={
              imageBox
                ? { width: imageBox.width, height: imageBox.height }
                : undefined
            }
            className="block h-auto w-auto max-h-[38vh] max-w-full shrink-0 rounded-xl border-2 border-[#163e66] bg-white object-contain sm:max-h-none lg:rounded-2xl lg:border-[3px]"
          />
        )}
        <div
          ref={copyRef}
          className={`flex min-w-0 flex-col justify-center ${
            hasImage ? 'w-full sm:w-[min(26rem,40vw)]' : 'w-full max-w-3xl'
          }`}
        >
          <p className="grandstander mb-1.5 text-sm font-bold leading-snug text-[#163e66] sm:mb-2 sm:text-lg lg:text-2xl lg:leading-tight [@media(max-height:760px)]:lg:text-xl [@media(max-height:640px)]:mb-1 [@media(max-height:640px)]:text-sm [@media(max-height:640px)]:sm:text-base">
            {question.question}
          </p>
          <div className="grid grid-cols-1 gap-1 sm:gap-1.5 [@media(max-height:640px)]:gap-1">
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
                  className={`grandstander flex items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left text-sm font-semibold transition sm:px-3 sm:py-2 sm:text-base lg:text-lg [@media(max-height:760px)]:py-1 [@media(max-height:760px)]:sm:py-1.5 [@media(max-height:640px)]:py-1 [@media(max-height:640px)]:text-sm [@media(max-height:640px)]:lg:text-sm
                    ${
                      showWrong
                        ? 'border-red-500 bg-red-100 text-red-900'
                        : showCorrect
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-900'
                          : isPicked
                            ? 'border-[var(--primary-accent-hover)] bg-[var(--secondary-bg)]'
                            : 'border-[#163e66] bg-[#1e4d73] text-white hover:bg-[#163e66]'
                    }
                    disabled:cursor-not-allowed`}
                  aria-label={`Answer ${LETTERS[index]}: ${answer}`}
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-[var(--heading-color,#114257)] sm:h-7 sm:w-7 sm:text-sm [@media(max-height:640px)]:h-5 [@media(max-height:640px)]:w-5">
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
