import { Graphics } from 'pixi.js'

const INK = 0x114257
const BAD = 0xdc2626
const BELLY = 0xf3f6c8
const MOUTH = 0xc4453c
const TOOTH = 0xfff7e8
const EYE = 0x6b3a1f

function mixWhite(color: number, amount: number): number {
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount)
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255)
}

function shade(color: number, amount: number): number {
  const mix = (channel: number) => Math.round(channel * (1 - amount))
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255)
}

/** Snout points +x. Closed while swimming, mouth wide for a bite. */
export function drawCrocodile(graphics: Graphics, color: number, open: number, flash: boolean) {
  const dark = shade(color, 0.16)
  const ridge = mixWhite(color, 0.12)
  graphics.clear()
  graphics.ellipse(-8, 18, 22, 7).fill({ color: INK, alpha: 0.14 })

  graphics.poly([-26, -7, -54, -2, -58, 0, -54, 2, -26, 7, -22, 0]).fill(color).stroke({ width: 3, color: INK })
  graphics.poly([-40, -1, -52, 0, -40, 1]).fill(dark)

  limb(graphics, -16, -17, -0.45, color)
  limb(graphics, -16, 17, 0.45, color)
  limb(graphics, 10, -20, -1.05, color)
  limb(graphics, 10, 20, 1.05, color)

  graphics.ellipse(-2, 0, 24, 15).fill(color).stroke({ width: 3, color: INK })
  graphics.ellipse(2, 0, 13, 8).fill(BELLY)
  graphics.moveTo(-8, 0)
  graphics.lineTo(12, 0)
  graphics.stroke({ width: 1.5, color: dark, alpha: 0.55 })

  if (open > 0.28) {
    graphics.ellipse(28, 11, 18, 9).fill(color).stroke({ width: 3, color: INK })
    graphics.ellipse(30, -9, 20, 11).fill(color).stroke({ width: 3, color: INK })
    graphics.ellipse(30, 1, 16, 10).fill(MOUTH)
    for (let index = 0; index < 6; index += 1) {
      const x = 18 + index * 5
      graphics.poly([x, -5, x + 2.2, 1, x + 4.4, -5]).fill(TOOTH)
      graphics.poly([x + 1, 8, x + 3.2, 3, x + 5.4, 8]).fill(TOOTH)
    }
  } else {
    graphics.ellipse(26, 0, 22, 12).fill(color).stroke({ width: 3, color: INK })
    graphics.ellipse(28, 2, 12, 5).fill(BELLY)
    graphics.ellipse(30, 3, 12, 1.4).fill(INK)
    graphics.circle(42, -2, 1.6).fill(INK)
  }

  graphics.ellipse(16, 0, 10, 6).fill(ridge)
  eye(graphics, 18, -8)
  eye(graphics, 18, 8)
  if (flash) graphics.circle(8, 0, 40).stroke({ width: 5, color: BAD })
}

export function drawHeadingDots(graphics: Graphics, color: number) {
  graphics.clear()
  for (const [x, radius] of [
    [46, 3.2],
    [56, 2.4],
    [64, 1.7],
  ] as const) {
    graphics.circle(x, 0, radius).fill({ color, alpha: 0.92 }).stroke({ width: 1.5, color: INK })
  }
}

function limb(graphics: Graphics, x: number, y: number, tilt: number, color: number) {
  graphics.ellipse(x, y, 8, 5).fill(color).stroke({ width: 2.5, color: INK })
  graphics.circle(x + Math.cos(tilt) * 7, y + Math.sin(tilt) * 6, 3.2).fill(color).stroke({ width: 2, color: INK })
}

function eye(graphics: Graphics, x: number, y: number) {
  graphics.circle(x, y, 6).fill(0xffffff).stroke({ width: 2, color: INK })
  graphics.circle(x + 1.4, y, 3.1).fill(EYE)
  graphics.circle(x + 2.4, y - 1, 1.1).fill(0xffffff)
}
