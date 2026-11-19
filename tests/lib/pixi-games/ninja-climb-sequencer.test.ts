import { describe, it, expect } from 'vitest'
import {
  NinjaClimbQuestionSequencer,
  dealQuestionsAcrossTeams,
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
    expect(estimateTurnsForSummit(480, 2, 50)).toBe(20) // 10 answers * 2 teams
  })
})

function teamQuestions(ids: string[], numTeams: number, team: number): string[] {
  return ids.filter((_, index) => index % numTeams === team)
}

describe('dealQuestionsAcrossTeams', () => {
  it('alternates through the list so the teams do not share a question back to back', () => {
    const ids = dealQuestionsAcrossTeams(
      [q('1'), q('2'), q('3'), q('4'), q('5')],
      2
    ).map((question) => question.id)
    expect(ids.slice(0, 5)).toEqual(['1', '2', '3', '4', '5'])
    for (let i = 0; i < ids.length - 1; i++) {
      expect(ids[i]).not.toBe(ids[i + 1])
    }
  })

  it('gives each team every question once before anything repeats', () => {
    const ids = dealQuestionsAcrossTeams(
      [q('1'), q('2'), q('3'), q('4')],
      2
    ).map((question) => question.id)
    expect(ids).toEqual(['1', '2', '3', '4', '2', '3', '4', '1'])
    expect(teamQuestions(ids, 2, 0).sort()).toEqual(['1', '2', '3', '4'])
    expect(teamQuestions(ids, 2, 1).sort()).toEqual(['1', '2', '3', '4'])
  })

  it('still covers a 15-question quiz for both teams', () => {
    const questions = Array.from({ length: 15 }, (_, index) => q(String(index + 1)))
    const ids = dealQuestionsAcrossTeams(questions, 2).map((question) => question.id)
    expect(ids).toHaveLength(30)
    expect(new Set(teamQuestions(ids, 2, 0)).size).toBe(15)
    expect(new Set(teamQuestions(ids, 2, 1)).size).toBe(15)
  })
})

describe('NinjaClimbQuestionSequencer', () => {
  it('deals different questions to the two teams on consecutive turns', () => {
    const questions = [q('1'), q('2'), q('3')]
    const seq = new NinjaClimbQuestionSequencer(questions, 2, {
      minTurns: 6,
      randomize: false,
    })
    expect(seq.getScheduledQuestionIds()).toEqual(['1', '2', '3', '1', '2', '3'])
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
    expect(ids.slice(0, 4)).toEqual(['1', '2', '2', '1'])
    expect(new Set(teamQuestions(ids.slice(0, 4), 2, 0)).size).toBe(2)
  })

  it('does not hand the second team the question the first team just answered', () => {
    const questions = [q('a'), q('b')]
    const seq = new NinjaClimbQuestionSequencer(questions, 2, {
      minTurns: 4,
      randomize: false,
    })
    expect(seq.getNextQuestion()?.id).toBe('a') // team 0
    expect(seq.getNextQuestion()?.id).toBe('b') // team 1
    expect(seq.getNextQuestion()?.id).toBe('b') // team 0, first unseen
    expect(seq.getNextQuestion()?.id).toBe('a') // team 1, first unseen
    expect(seq.isFinished()).toBe(true)
  })

  it('rejects an empty question list', () => {
    expect(() => new NinjaClimbQuestionSequencer([], 2)).toThrow(
      /non-empty question list/
    )
  })
})
