import { describe, expect, it } from 'vitest'
import {
  mouthPlacementSchema,
  storyBriefSchema,
  submissionMetaSchema,
} from '@/lib/stories/schemas'
import { buildExampleStory, parseStoryPlan } from '@/lib/stories/story-generation'
import { createShareToken } from '@/lib/stories/tokens'

describe('mouthPlacementSchema', () => {
  it('accepts a valid placement', () => {
    const result = mouthPlacementSchema.safeParse({
      x: 0.5,
      y: 0.6,
      scale: 0.15,
      rotation: -10,
      style: 'duck',
    })
    expect(result.success).toBe(true)
  })

  it('rejects out-of-range coordinates and unknown styles', () => {
    expect(
      mouthPlacementSchema.safeParse({ x: 1.5, y: 0.5, scale: 0.1 }).success
    ).toBe(false)
    expect(
      mouthPlacementSchema.safeParse({
        x: 0.5,
        y: 0.5,
        scale: 0.1,
        style: 'laser',
      }).success
    ).toBe(false)
  })
})

describe('storyBriefSchema', () => {
  it('applies defaults and filters unknown grammar tags', () => {
    const result = storyBriefSchema.parse({
      topicPrompt: 'A dog finds a hat',
      grammarFocus: ['Past Simple', 'Not A Real Tag'],
    })
    expect(result.level).toBe('A1')
    expect(result.storyType).toBe('Everyday mishap')
    expect(result.grammarFocus).toEqual(['Past Simple'])
  })

  it('rejects an empty prompt', () => {
    expect(storyBriefSchema.safeParse({ topicPrompt: 'a' }).success).toBe(false)
  })
})

describe('parseStoryPlan', () => {
  const plan = {
    title: 'The Lost Kite',
    characterSheet: 'A boy with red hair and a yellow shirt',
    artStyle: 'bright flat cartoon',
    panels: [
      { sceneDescription: 'Boy flies a kite in the park', exampleSentence: 'Tom flew his kite.' },
      { sceneDescription: 'Kite stuck in a tree', exampleSentence: 'The kite got stuck.' },
      { sceneDescription: 'Dog climbs the tree', exampleSentence: 'His dog climbed the tree.' },
      { sceneDescription: 'Boy hugs dog with kite', exampleSentence: 'Tom was very happy.' },
    ],
  }

  it('parses plain JSON', () => {
    expect(parseStoryPlan(JSON.stringify(plan)).title).toBe('The Lost Kite')
  })

  it('strips markdown code fences', () => {
    const fenced = '```json\n' + JSON.stringify(plan) + '\n```'
    expect(parseStoryPlan(fenced).panels).toHaveLength(4)
  })

  it('rejects a plan without exactly 4 panels', () => {
    expect(() =>
      parseStoryPlan(JSON.stringify({ ...plan, panels: plan.panels.slice(0, 3) }))
    ).toThrow()
  })
})

describe('submissionMetaSchema', () => {
  const valid = [1, 2, 3, 4].map((panelOrder) => ({
    panelOrder,
    durationMs: 3000,
    envelope: [0.2, 0.8, 0.4],
  }))

  it('accepts one recording per panel', () => {
    expect(submissionMetaSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects duplicate panels', () => {
    const duplicated = [...valid.slice(0, 3), { ...valid[2] }]
    expect(submissionMetaSchema.safeParse(duplicated).success).toBe(false)
  })

  it('rejects overlong recordings', () => {
    const tooLong = valid.map((item) => ({ ...item, durationMs: 10 * 60 * 1000 }))
    expect(submissionMetaSchema.safeParse(tooLong).success).toBe(false)
  })
})

describe('createShareToken', () => {
  it('creates long, unique, URL-safe tokens', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => createShareToken()))
    expect(tokens.size).toBe(200)
    for (const token of tokens) {
      expect(token.length).toBeGreaterThanOrEqual(20)
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })
})

describe('buildExampleStory', () => {
  it('joins sentences and skips gaps', () => {
    expect(buildExampleStory(['One.', null, ' Two. ', undefined])).toBe('One. Two.')
  })
})
