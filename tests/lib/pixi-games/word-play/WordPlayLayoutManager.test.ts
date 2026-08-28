import { describe, expect, it } from 'vitest'
import {
  calculateCenteredFlowLayout,
  WordPlayLayoutManager,
} from '@/lib/pixi-games/word-play/managers/WordPlayLayoutManager'

function rowCenter(
  positions: { x: number; y: number }[],
  itemWidth: number,
  rowY: number
): number {
  const row = positions.filter((position) => position.y === rowY)
  const left = Math.min(...row.map((position) => position.x))
  const right = Math.max(...row.map((position) => position.x + itemWidth))
  return (left + right) / 2
}

describe('calculateCenteredFlowLayout', () => {
  it('centers a single short row exactly once', () => {
    const positions = calculateCenteredFlowLayout(4, 100, 60, 800, 20, 12)
    expect(rowCenter(positions, 100, 0)).toBe(400)
  })

  it('centers full and partial rows on the same axis', () => {
    const positions = calculateCenteredFlowLayout(8, 100, 60, 340, 20, 12)
    expect(rowCenter(positions, 100, 0)).toBe(170)
    expect(rowCenter(positions, 100, 72)).toBe(170)
    expect(rowCenter(positions, 100, 144)).toBe(170)
  })

  it('returns no positions for an empty item set', () => {
    expect(calculateCenteredFlowLayout(0, 100, 60, 800, 20, 12)).toEqual([])
  })

  it('maps a centered content region to the viewport center', () => {
    const viewportWidth = 1024
    const regionLeft = 48
    const regionWidth = viewportWidth - regionLeft * 2
    const positions = calculateCenteredFlowLayout(4, 180, 60, regionWidth, 16, 12)
    const globalCenter = regionLeft + rowCenter(positions, 180, 0)
    expect(globalCenter).toBe(viewportWidth / 2)
  })
})

describe('WordPlayLayoutManager', () => {
  it('centers desktop controls below tiles while compact landscape stays horizontal', () => {
    const desktop = new WordPlayLayoutManager(1024, 504).getLayoutParams()
    expect(desktop.isPortrait).toBe(false)
    expect(desktop.stackTrayControls).toBe(true)
    expect(desktop.contentTop).toBeGreaterThanOrEqual(28)
    expect(desktop.promptMaxWidth).toBeLessThan(1024)

    const landscape = new WordPlayLayoutManager(880, 407).getLayoutParams()
    expect(landscape.isPortrait).toBe(false)
    expect(landscape.stackTrayControls).toBe(false)
    expect(landscape.timerScale).toBeLessThan(1)
  })

  it('reserves a HUD-safe header and stacks tray controls on portrait phones', () => {
    const portrait = new WordPlayLayoutManager(440, 880).getLayoutParams()
    expect(portrait.isPortrait).toBe(true)
    expect(portrait.stackTrayControls).toBe(true)
    expect(portrait.contentTop).toBeGreaterThanOrEqual(170)
    expect(portrait.imageMaxHeight).toBe(0)
    expect(portrait.tileHeight).toBe(58)
    expect(portrait.tileMaxWidth).toBeLessThan(440 / 2)
    expect(portrait.checkButtonWidth).toBeLessThanOrEqual(220)
  })

  it('scales typography and cards up for fullscreen play', () => {
    const fullscreen = new WordPlayLayoutManager(1920, 1080).getLayoutParams()
    expect(fullscreen.promptFontSize).toBeGreaterThanOrEqual(42)
    expect(fullscreen.tileFontSize).toBeGreaterThanOrEqual(30)
    expect(fullscreen.tileHeight).toBeGreaterThanOrEqual(70)
    expect(fullscreen.tileMaxWidth).toBe(360)
    expect(fullscreen.stackTrayControls).toBe(true)
  })

  it('recalculates when orientation changes', () => {
    const manager = new WordPlayLayoutManager(440, 880)
    expect(manager.getLayoutParams().isPortrait).toBe(true)

    manager.updateLayout(880, 440)
    const landscape = manager.getLayoutParams()
    expect(landscape.isPortrait).toBe(false)
    expect(landscape.stackTrayControls).toBe(false)
    expect(landscape.imageMaxHeight).toBeGreaterThan(0)
  })
})
