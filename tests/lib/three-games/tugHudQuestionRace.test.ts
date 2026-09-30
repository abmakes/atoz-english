import { describe, expect, it } from 'vitest'
import { EventBus } from '@/lib/pixi-engine/core/EventBus'
import {
  HUD_EVENTS,
  type HudQuestionShownPayload,
} from '@/lib/pixi-engine/core/EventTypes'
import { canReplayHudQuestion } from '@/lib/three-games/tug-of-war/tugOfWarLogic'

const payload: HudQuestionShownPayload = {
  questionId: 'q1',
  question: 'What animal is this?',
  answers: ['Cat', 'Dog'],
  imageUrl: null,
  questionIndex: 0,
  totalQuestions: 6,
  teamId: 'blue',
  roundNumber: 1,
}

describe('Tug of War first-question HUD race', () => {
  it('drops QUESTION_SHOWN when the React card has not subscribed yet', () => {
    const bus = new EventBus(false)
    bus.emit(HUD_EVENTS.QUESTION_SHOWN, payload)

    const received: HudQuestionShownPayload[] = []
    bus.on(HUD_EVENTS.QUESTION_SHOWN, (next) => {
      received.push(next)
    })

    expect(received).toEqual([])
  })

  it('re-emits the cached question when the HUD later signals READY', () => {
    const bus = new EventBus(false)
    let lastHudQuestion: HudQuestionShownPayload | null = null
    const answerLocked = false

    bus.on(HUD_EVENTS.READY, () => {
      const replay = {
        ended: false,
        disposed: false,
        answerLocked,
        lastHudQuestion,
      }
      if (!canReplayHudQuestion(replay)) return
      bus.emit(HUD_EVENTS.QUESTION_SHOWN, replay.lastHudQuestion)
    })

    lastHudQuestion = payload
    bus.emit(HUD_EVENTS.QUESTION_SHOWN, payload)

    const received: HudQuestionShownPayload[] = []
    bus.on(HUD_EVENTS.QUESTION_SHOWN, (next) => {
      received.push(next)
    })
    bus.emit(HUD_EVENTS.READY)

    expect(received).toEqual([payload])
  })
})
