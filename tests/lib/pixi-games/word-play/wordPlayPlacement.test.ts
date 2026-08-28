import { describe, expect, it } from 'vitest'
import { findFirstEmptySlotId } from '@/lib/pixi-games/word-play/wordPlayPlacement'

describe('findFirstEmptySlotId', () => {
  const slots = ['slot-0', 'slot-1', 'slot-2']

  it('fills slots in visual order', () => {
    expect(findFirstEmptySlotId(slots, new Set(['slot-0']))).toBe('slot-1')
  })

  it('returns the first slot when none are occupied', () => {
    expect(findFirstEmptySlotId(slots, new Set())).toBe('slot-0')
  })

  it('returns null when the arrangement is full', () => {
    expect(findFirstEmptySlotId(slots, new Set(slots))).toBeNull()
  })
})
