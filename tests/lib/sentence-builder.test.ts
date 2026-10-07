import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GRAMMAR_LABELS, PROMPTS, SCENES, getScene, type GrammarFocus } from '@/lib/pixi-games/sentence-builder/content'
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

describe('sentence builder content', () => {
  it('ships 20 reusable scenes and a score run that uses each picture once', () => {
    expect(SCENES).toHaveLength(20)
    const scoreRun = PROMPTS.filter((item) => item.scoreRun)
    expect(scoreRun).toHaveLength(SCORE_RUN_LENGTH)
    expect(new Set(scoreRun.map((item) => item.sceneId)).size).toBe(SCORE_RUN_LENGTH)
    for (const scene of SCENES) {
      expect(existsSync(join(process.cwd(), 'public', scene.image.replace(/^\//, '')))).toBe(true)
      expect(getScene(scene.id).alt.length).toBeGreaterThan(0)
    }
  })

  it('gives every slot four unique choices and a sentence that matches the answer', () => {
    const ids = new Set<string>()
    for (const item of PROMPTS) {
      expect(ids.has(item.id)).toBe(false)
      ids.add(item.id)
      expect(getScene(item.sceneId)).toBeTruthy()
      const built = `${item.slots.map((slot) => slot.correct).join(' ')}${item.punctuation}`
      expect(item.answer).toBe(built)
      expect(item.slots.length).toBeGreaterThanOrEqual(3)
      for (const slot of item.slots) {
        expect(slot.options).toHaveLength(4)
        expect(new Set(slot.options).size).toBe(4)
        expect(slot.options).toContain(slot.correct)
      }
    }
  })

  it('covers the basic ESL structures in the 20-question run', () => {
    const answers = PROMPTS.filter((item) => item.scoreRun).map((item) => item.answer)
    const focuses = new Set(PROMPTS.filter((item) => item.scoreRun).map((item) => item.focus))
    const requiredFocuses: GrammarFocus[] = [
      'present-simple',
      'present-continuous',
      'wh-question',
      'be-present',
      'be-past',
      'has-have',
      'past-simple-regular',
      'past-simple-irregular',
    ]
    for (const focus of requiredFocuses) {
      expect(focuses.has(focus)).toBe(true)
      expect(GRAMMAR_LABELS[focus].length).toBeGreaterThan(0)
    }
    expect(answers.some((answer) => /\b(eats|teaches|drives|rides|reads|plays|opens)\b/.test(answer))).toBe(true)
    expect(answers.some((answer) => /\b(is|are) \w+ing\b/.test(answer))).toBe(true)
    expect(answers.some((answer) => answer.endsWith('?'))).toBe(true)
    expect(answers.some((answer) => answer.includes(' am '))).toBe(true)
    expect(answers.some((answer) => answer.includes(' is '))).toBe(true)
    expect(answers.some((answer) => answer.includes("isn't"))).toBe(true)
    expect(answers.some((answer) => answer.includes(' was '))).toBe(true)
    expect(answers.some((answer) => answer.includes(' were '))).toBe(true)
    expect(answers.some((answer) => answer.includes("wasn't"))).toBe(true)
    expect(answers.some((answer) => answer.includes("weren't"))).toBe(true)
    expect(answers.some((answer) => answer.includes(' has '))).toBe(true)
    expect(answers.some((answer) => answer.includes(' have '))).toBe(true)
    expect(answers.some((answer) => /\b(ate|wrote|rode|ran|drove|swam)\b/.test(answer))).toBe(true)
    expect(answers.some((answer) => /\b(cooked|washed|played|brushed|walked|opened)\b/.test(answer))).toBe(true)
  })

  it('fails closed when a scene id is unknown', () => {
    expect(() => getScene('missing-scene')).toThrow(/Unknown sentence-builder scene/)
  })
})

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

  it('builds a 20-question run and does not repeat the last survival prompt immediately', () => {
    const random = seeded(4)
    const scoreRun = buildScoreRun(PROMPTS, random)
    expect(scoreRun).toHaveLength(20)
    expect(new Set(scoreRun.map((item) => item.id)).size).toBe(20)

    const queue = buildSurvivalQueue(PROMPTS, seeded(9))
    expect(queue.length).toBe(PROMPTS.length)
    const firstId = PROMPTS[0]?.id
    const reshuffled = reshuffleSurvival(PROMPTS, firstId, () => 0.999)
    expect(reshuffled[0]?.id).not.toBe(firstId)
    expect(reshuffled).toHaveLength(PROMPTS.length)
  })
})
