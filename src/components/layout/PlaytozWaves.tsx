'use client'

import { useEffect, useRef } from 'react'

const WIDTH = 1440
const STEP = 48
const TAU = Math.PI * 2
const FRAME = 1000 / 24

type Edge = { b: number; a1: number; a2: number; ph: number }

const bands: {
  id: 'w1' | 'w3'
  top: Edge
  bot: Edge | null
  k1: number
  k2: number
  s: number
  dir: number
}[] = [
  { id: 'w1', top: { b: 110, a1: 52, a2: 16, ph: 0.3 }, bot: { b: 275, a1: 52, a2: 16, ph: 1.4 }, k1: 0.5, k2: 0.9, s: 0.3, dir: 1 },
  { id: 'w3', top: { b: 745, a1: 50, a2: 16, ph: 4.0 }, bot: null, k1: 0.5, k2: 0.8, s: 0.28, dir: 1 },
]

function edge(x: number, t: number, base: number, a1: number, a2: number, k1: number, k2: number, s1: number, s2: number, ph: number) {
  const X = TAU * x / WIDTH
  return base
    + a1 * 0.45 * Math.sin(k1 * X + ph)
    + a1 * 0.55 * Math.sin((k1 + 0.5) * X + ph * 1.3) * Math.sin(s1 * 1.2 * t + ph)
    + a2 * Math.sin(k2 * X + ph * 1.9) * Math.sin(s2 * 1.2 * t + ph * 2)
}

export default function PlaytozWaves() {
  const w1 = useRef<SVGPathElement>(null)
  const w3 = useRef<SVGPathElement>(null)

  useEffect(() => {
    const els = { w1: w1.current, w3: w3.current }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let visible = true
    let last = 0
    let frame = 0

    const draw = (t: number) => {
      bands.forEach((band) => {
        const node = els[band.id]
        if (!node) return
        let d = ''
        const top = band.top
        for (let x = 0; x <= WIDTH; x += STEP) {
          d += `${x ? 'L' : 'M'}${x} ${edge(x, t, top.b, top.a1, top.a2, band.k1, band.k2, band.s * band.dir, band.s * band.dir * 1.6, top.ph).toFixed(1)} `
        }
        if (band.bot) {
          const bottom = band.bot
          for (let x = WIDTH; x >= 0; x -= STEP) {
            d += `L${x} ${edge(x, t, bottom.b, bottom.a1, bottom.a2, band.k1, band.k2, band.s * band.dir, band.s * band.dir * 1.6, bottom.ph).toFixed(1)} `
          }
          d += 'Z'
        } else {
          d += `L${WIDTH} 900 L0 900Z`
        }
        node.setAttribute('d', d)
      })
    }

    draw(0)
    const svg = w1.current?.ownerSVGElement
    const observer = svg && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true
      })
      : null
    if (svg && observer) observer.observe(svg)

    const loop = (ms: number) => {
      frame = window.requestAnimationFrame(loop)
      if (!visible || ms - last < FRAME) return
      last = ms
      draw(ms / 1000)
    }
    if (!still) frame = window.requestAnimationFrame(loop)

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [])

  return (
    <div className="tide" aria-hidden="true">
      <svg viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path ref={w1} fill="#e6f6ff" />
        <path ref={w3} fill="#e6f6ff" />
      </svg>
    </div>
  )
}
