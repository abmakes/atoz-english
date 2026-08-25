import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STORY_ART_STYLE_ID,
  getStoryArtStyle,
  resolveArtStylePrompt,
  STORY_ART_STYLES,
} from '@/lib/stories/art-styles'
import { storyBriefSchema } from '@/lib/stories/schemas'

describe('story art styles', () => {
  it('defines six presets with preview paths', () => {
    expect(STORY_ART_STYLES).toHaveLength(6)
    for (const style of STORY_ART_STYLES) {
      expect(style.previewSrc).toMatch(/^\/images\/story-styles\/.+\.webp$/)
      expect(style.promptLock.length).toBeGreaterThan(40)
    }
  })

  it('falls back to picture-book for unknown ids', () => {
    expect(getStoryArtStyle('not-real').id).toBe(DEFAULT_STORY_ART_STYLE_ID)
  })

  it('appends an optional teacher note to the locked prompt', () => {
    const locked = resolveArtStylePrompt('chibi')
    expect(locked).toContain('chibi')
    expect(resolveArtStylePrompt('chibi', '  softer pastels  ')).toBe(
      `${locked} Teacher style note: softer pastels`
    )
  })
})

describe('storyBriefSchema art style fields', () => {
  it('defaults artStyleId to picture-book', () => {
    const brief = storyBriefSchema.parse({
      topicPrompt: 'A dog finds a hat',
    })
    expect(brief.artStyleId).toBe('picture-book')
    expect(brief.artStyleNote).toBe('')
  })

  it('accepts a chosen style and note', () => {
    const brief = storyBriefSchema.parse({
      topicPrompt: 'A girl flies a kite',
      artStyleId: 'soft-anime',
      artStyleNote: 'softer pastel skies',
    })
    expect(brief.artStyleId).toBe('soft-anime')
    expect(brief.artStyleNote).toBe('softer pastel skies')
  })

  it('rejects an unknown style id', () => {
    expect(
      storyBriefSchema.safeParse({
        topicPrompt: 'A dog finds a hat',
        artStyleId: 'oil-painting',
      }).success
    ).toBe(false)
  })
})
