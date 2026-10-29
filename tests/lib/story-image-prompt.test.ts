import { describe, expect, it } from 'vitest'
import { createPanelImagePrompt } from '@/lib/stories/story-generation'

describe('createPanelImagePrompt', () => {
  const base = {
    characterSheet:
      'A cheerful girl about eight years old with curly brown hair in two short puffs, wearing a bright yellow raincoat and red wellington boots, carrying a small blue umbrella.',
    artStyle:
      'Bright flat children\'s picture-book cartoon with thick clean outlines, soft rounded shapes, and a warm cheerful palette.',
    sceneDescription:
      'She stands on a rainy street in the foreground, puddles reflecting soft grey-blue light, while a yellow bus waits at a stop in the midground with its doors open.',
    panelOrder: 2,
    hasReferenceImage: false,
  }

  it('writes a rich prose prompt covering style, character, scene, and constraints', () => {
    const prompt = createPanelImagePrompt(base)
    expect(prompt).toMatch(/Children's picture-book illustration/)
    expect(prompt).toContain(base.characterSheet)
    expect(prompt).toContain(base.artStyle)
    expect(prompt).toContain(base.sceneDescription)
    expect(prompt).toMatch(/no written text/i)
    expect(prompt).toMatch(/4:3/)
    expect(prompt).not.toMatch(/editorial architectural photograph/i)
    expect(prompt).not.toMatch(/neon sign/i)
  })

  it('mentions the reference image when one is attached', () => {
    const prompt = createPanelImagePrompt({ ...base, hasReferenceImage: true })
    expect(prompt).toMatch(/reference image is attached/i)
    expect(prompt).toMatch(/exact character design/i)
  })

  it('appends the teacher tweak when provided', () => {
    const prompt = createPanelImagePrompt({
      ...base,
      tweak: 'make the umbrella much bigger',
    })
    expect(prompt).toContain('make the umbrella much bigger')
    expect(prompt).toMatch(/Teacher adjustment/)
  })
})
