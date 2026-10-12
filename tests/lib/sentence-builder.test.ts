import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  GRAMMAR_FOCUSES,
  GRAMMAR_LABELS,
  PROMPTS,
  SCENES,
  getScene,
  promptsForFocus,
  type GrammarFocus,
  type WordSlot,
} from '@/lib/pixi-games/sentence-builder/content'
import {
  QUESTION_TIME_MS,
  SCORE_RUN_LENGTH,
  applyTimePenalty,
  buildScoreRun,
  buildSurvivalQueue,
  pointsForSentence,
  reshuffleSurvival,
} from '@/lib/pixi-games/sentence-builder/round'

function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const QUESTION_WORDS = new Set(['what', 'where', 'who', 'when', 'why', 'how'])

function grammaticalArticlePhrase(phrase: string): boolean {
  const stripped = phrase.trim().replace(/^(in|on|at|with|after)\s+/i, '')
  const match = /^(a|an|the|some)\s+([a-z]+)$/i.exec(stripped)
  if (!match) return false
  const determiner = match[1].toLowerCase()
  const noun = match[2].toLowerCase()
  const vowel = /^[aeiou]/.test(noun)
  const plural = /s$/.test(noun) && !/(?:ss|us|is)$/.test(noun)
  if (determiner === 'a') return !vowel && !plural
  if (determiner === 'an') return vowel && !plural
  if (determiner === 'the' || determiner === 'some') return true
  return false
}

function answers(focus: GrammarFocus): string[] {
  return promptsForFocus(focus).map((item) => item.answer)
}

describe('sentence builder content', () => {
  it('ships 20 reusable scenes', () => {
    expect(SCENES).toHaveLength(20)
    for (const scene of SCENES) {
      expect(existsSync(join(process.cwd(), 'public', scene.image.replace(/^\//, '')))).toBe(true)
      expect(getScene(scene.id).alt.length).toBeGreaterThan(0)
    }
  })

  it('gives every structure its own 20-question set, one picture each', () => {
    expect(GRAMMAR_FOCUSES).toHaveLength(8)
    expect(PROMPTS).toHaveLength(GRAMMAR_FOCUSES.length * SCORE_RUN_LENGTH)
    for (const focus of GRAMMAR_FOCUSES) {
      const prompts = promptsForFocus(focus)
      expect(prompts).toHaveLength(SCORE_RUN_LENGTH)
      expect(new Set(prompts.map((item) => item.sceneId)).size).toBe(SCORE_RUN_LENGTH)
      expect(prompts.every((item) => item.focus === focus)).toBe(true)
      expect(GRAMMAR_LABELS[focus].length).toBeGreaterThan(0)
    }
  })

  it('gives every slot four unique forms and keeps articles on the noun', () => {
    const ids = new Set<string>()
    for (const item of PROMPTS) {
      expect(ids.has(item.id)).toBe(false)
      ids.add(item.id)
      expect(getScene(item.sceneId)).toBeTruthy()
      const built = `${item.slots.map((slot) => slot.correct).join(' ')}${item.punctuation}`
      expect(item.answer).toBe(built)
      expect(item.slots.length).toBeGreaterThanOrEqual(2)
      for (const slot of item.slots) {
        expect(slot.options).toHaveLength(4)
        expect(new Set(slot.options).size).toBe(4)
        expect(slot.options).toContain(slot.correct)
        expect(slot.correct).not.toMatch(/^(a|an|the|some)$/i)
        expect(slot.options.filter((option) => grammaticalArticlePhrase(option)).length).toBeLessThanOrEqual(1)
        expect(rivalQuestionWords(slot)).toBe(false)
      }
    }
  })

  it('keeps each score run inside one grammar structure', () => {
    expect(answers('present-simple').every((answer) => !/\b(is|are|am)\b/.test(answer))).toBe(true)
    expect(answers('present-continuous').every((answer) => /\b(is|are)\b/.test(answer) && /\w+ing\b/.test(answer))).toBe(
      true
    )
    expect(answers('wh-question').every((answer) => answer.endsWith('?'))).toBe(true)
    expect(answers('wh-question').some((answer) => answer.startsWith('What '))).toBe(true)
    expect(answers('wh-question').some((answer) => answer.startsWith('Where '))).toBe(true)
    expect(answers('wh-question').some((answer) => answer.startsWith('Who '))).toBe(true)
    expect(answers('be-present').some((answer) => answer.startsWith('I am '))).toBe(true)
    expect(answers('be-present').some((answer) => answer.includes(" isn't "))).toBe(true)
    expect(answers('be-present').some((answer) => answer.includes(' are '))).toBe(true)
    expect(answers('be-past').some((answer) => answer.includes(' was '))).toBe(true)
    expect(answers('be-past').some((answer) => answer.includes(' were '))).toBe(true)
    expect(answers('be-past').some((answer) => answer.includes("wasn't"))).toBe(true)
    expect(answers('be-past').some((answer) => answer.includes("weren't"))).toBe(true)
    expect(answers('has-have').every((answer) => /\b(has|have)\b/.test(answer))).toBe(true)
    expect(answers('past-simple-regular').every((answer) => /\w+ed\b/.test(answer))).toBe(true)
    expect(answers('past-simple-irregular').some((answer) => /\b(ate|rode|wrote|drove|swam|led)\b/.test(answer))).toBe(true)
    expect(answers('past-simple-irregular').some((answer) => answer.includes(' led '))).toBe(true)

    const kicking = promptsForFocus('past-simple-regular').find((item) => item.sceneId === 'kids-soccer')
    expect(kicking?.answer).toBe('They kicked a ball.')
    expect(kicking?.slots[1]?.options).toEqual(['kicked', 'kick', 'kicks', 'kicking'])
  })

  it('fails closed when a scene id is unknown', () => {
    expect(() => getScene('missing-scene')).toThrow(/Unknown sentence-builder scene/)
  })
})

function rivalQuestionWords(slot: WordSlot): boolean {
  const correct = slot.correct.toLowerCase()
  if (!QUESTION_WORDS.has(correct)) return false
  return slot.options.some((option) => option !== slot.correct && QUESTION_WORDS.has(option.toLowerCase()))
}

describe('sentence builder scoring', () => {
  it('awards more points when more time is left', () => {
    expect(pointsForSentence(QUESTION_TIME_MS)).toBe(200)
    expect(pointsForSentence(QUESTION_TIME_MS / 2)).toBe(150)
    expect(pointsForSentence(1)).toBe(100)
    expect(pointsForSentence(QUESTION_TIME_MS)).toBeGreaterThan(pointsForSentence(QUESTION_TIME_MS / 2))
  })

  it('scores nothing when the timer is already gone', () => {
    expect(pointsForSentence(0)).toBe(0)
    expect(pointsForSentence(-20)).toBe(0)
  })

  it('caps a wrong-word penalty at zero', () => {
    expect(applyTimePenalty(10_000)).toBe(7_500)
    expect(applyTimePenalty(1_000)).toBe(0)
  })

  it('builds a 20-question run from one structure and does not repeat the last survival prompt', () => {
    const random = seeded(4)
    const bank = promptsForFocus('present-simple')
    const scoreRun = buildScoreRun(bank, random)
    expect(scoreRun).toHaveLength(20)
    expect(new Set(scoreRun.map((item) => item.id)).size).toBe(20)
    expect(scoreRun.every((item) => item.focus === 'present-simple')).toBe(true)

    const queue = buildSurvivalQueue(bank, seeded(9))
    expect(queue.length).toBe(bank.length)
    const firstId = bank[0]?.id
    const reshuffled = reshuffleSurvival(bank, firstId, () => 0.999)
    expect(reshuffled[0]?.id).not.toBe(firstId)
    expect(reshuffled).toHaveLength(bank.length)
  })
})
