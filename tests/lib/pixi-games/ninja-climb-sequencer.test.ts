import { describe, it, expect } from 'vitest'
import {
  NinjaClimbQuestionSequencer,
  estimateTurnsForSummit,
} from '@/lib/pixi-games/ninja-climb/ninjaClimbQuestionSequencer'
import type { QuestionData } from '@/types'

function q(id: string): QuestionData {
  return {
    id,
    question: `Q ${id}`,
    answers: ['a', 'b'],
    correctAnswer: 'a',
    type: 'MULTIPLE_CHOICE' as QuestionData['type'],
  }
}

describe('estimateTurnsForSummit', () => {
  it('sizes turns for summit climb', () => {
    expect(estimateTurnsForSummit(560, 2, 50)).toBe(24) // 12 answers * 2 teams
  })
})

describe('NinjaClimbQuestionSequencer', () => {
  it('gives each question to each team before repeating a (team,q) pair in cycle 1', () => {
    const questions = [q('1'), q('2'), q('3')]
    const seq = new NinjaClimbQuestionSequencer(questions, 2, {
      minTurns: 6,
      randomize: false,
    })
    const ids = seq.getScheduledQuestionIds()
    // Pattern: Q1,Q1, Q2,Q2, Q3,Q3
    expect(ids).toEqual(['1', '1', '2', '2', '3', '3'])
  })

  it('appends more cycles when summit needs more turns', () => {
    const questions = [q('1'), q('2')]
    const seq = new NinjaClimbQuestionSequencer(questions, 2, {
      minTurns: 12,
      randomize: false,
      rng: () => 0, // stable shuffle
    })
    // cycle = 4 turns; need 12 → 3 cycles
    expect(seq.getTotalQuestionsToAsk()).toBe(12)
    const ids = seq.getScheduledQuestionIds()
    expect(ids.slice(0, 4)).toEqual(['1', '1', '2', '2'])
  })

  it('within one cycle, consecutive pair shares the same question for both teams', () => {
    const questions = [q('a'), q('b')]
    const seq = new NinjaClimbQuestionSequencer(questions, 2, {
      minTurns: 4,
      randomize: false,
    })
    expect(seq.getNextQuestion()?.id).toBe('a') // team 0
    expect(seq.getNextQuestion()?.id).toBe('a') // team 1
    expect(seq.getNextQuestion()?.id).toBe('b')
    expect(seq.getNextQuestion()?.id).toBe('b')
    expect(seq.isFinished()).toBe(true)
  })
})
