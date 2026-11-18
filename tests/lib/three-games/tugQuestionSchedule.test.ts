import { describe, expect, it } from 'vitest'
import { TugQuestionSequencer } from '@/lib/three-games/tug-of-war/tugQuestionSchedule'
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

const questions = [q('1'), q('2'), q('3')]

describe('TugQuestionSequencer', () => {
  it('asks each question once on a short match', () => {
    const sequencer = new TugQuestionSequencer(questions, 2, 'short', false)
    expect(sequencer.getScheduledQuestionIds()).toEqual(['1', '2', '3'])
  })

  it('deals every question to every team on a regular match', () => {
    const sequencer = new TugQuestionSequencer(questions, 2, 'regular', false)
    expect(sequencer.getTotalQuestionsToAsk()).toBe(6)
    expect(sequencer.getScheduledQuestionIds()).toEqual(['1', '2', '3', '1', '2', '3'])
  })

  it('repeats a full coverage cycle on a long match', () => {
    const sequencer = new TugQuestionSequencer(questions, 2, 'long', false, () => 0)
    expect(sequencer.getTotalQuestionsToAsk()).toBe(12)
  })
})
