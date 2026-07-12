import { describe, it, expect } from 'vitest'
import { QuestionSequencer } from '@/lib/pixi-engine/game/QuestionSequencer'
import type { QuestionData } from '@/types'
import type { QuestionHandlingConfig } from '@/lib/pixi-engine/config/GameConfig'
import { QuestionType } from '@/types/question_types'

function makeQuestions(count: number): QuestionData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    question: `Question ${i + 1}`,
    answers: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    type: QuestionType.MULTIPLE_CHOICE,
    imageUrl: '',
  }))
}

const sharedConfig: QuestionHandlingConfig = {
  randomizeOrder: false,
  distributionMode: 'sharedPool',
}

describe('QuestionSequencer', () => {
  it('returns questions in order when randomizeOrder is false', () => {
    const sequencer = new QuestionSequencer(makeQuestions(3), 2, sharedConfig)

    expect(sequencer.getNextQuestion()?.id).toBe('q1')
    expect(sequencer.getNextQuestion()?.id).toBe('q2')
    expect(sequencer.getNextQuestion()?.id).toBe('q3')
    expect(sequencer.getNextQuestion()).toBeNull()
    expect(sequencer.isFinished()).toBe(true)
  })

  it('truncates for fairness in perTeam mode', () => {
    const config: QuestionHandlingConfig = {
      randomizeOrder: false,
      distributionMode: 'perTeam',
      truncateForFairness: true,
    }
    // 5 questions, 2 teams → floor(5/2)*2 = 4
    const sequencer = new QuestionSequencer(makeQuestions(5), 2, config)

    expect(sequencer.getTotalQuestionsToAsk()).toBe(4)
    expect(sequencer.getNextQuestion()?.id).toBe('q1')
    expect(sequencer.getNextQuestion()?.id).toBe('q2')
    expect(sequencer.getNextQuestion()?.id).toBe('q3')
    expect(sequencer.getNextQuestion()?.id).toBe('q4')
    expect(sequencer.getNextQuestion()).toBeNull()
  })

  it('throws when given an empty question list', () => {
    expect(() => new QuestionSequencer([], 1, sharedConfig)).toThrow(
      /non-empty array of questions/
    )
  })

  it('throws when numTeams is zero', () => {
    expect(() => new QuestionSequencer(makeQuestions(2), 0, sharedConfig)).toThrow(
      /at least one team/
    )
  })
})
