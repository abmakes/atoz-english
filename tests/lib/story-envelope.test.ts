import { describe, expect, it } from 'vitest'
import { computeEnvelope, envelopeValueAt } from '@/lib/stories/envelope'

function sine(durationMs: number, sampleRate: number, amplitude = 1): Float32Array {
  const samples = new Float32Array(Math.round((durationMs / 1000) * sampleRate))
  for (let i = 0; i < samples.length; i++) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * 220 * i) / sampleRate)
  }
  return samples
}

describe('computeEnvelope', () => {
  it('returns one value per 50ms window', () => {
    const envelope = computeEnvelope(sine(1000, 48000), 48000)
    expect(envelope.length).toBe(20)
  })

  it('normalizes to the clip peak (loudest window ~= 1)', () => {
    const envelope = computeEnvelope(sine(500, 48000, 0.1), 48000)
    expect(Math.max(...envelope)).toBeCloseTo(1, 5)
  })

  it('silence stays near zero while speech is high', () => {
    const sampleRate = 48000
    const loud = sine(500, sampleRate)
    const silence = new Float32Array(loud.length)
    const combined = new Float32Array(loud.length * 2)
    combined.set(loud, 0)
    combined.set(silence, loud.length)

    const envelope = computeEnvelope(combined, sampleRate)
    const firstHalf = envelope.slice(0, envelope.length / 2)
    const secondHalf = envelope.slice(envelope.length / 2)
    expect(Math.min(...firstHalf)).toBeGreaterThan(0.5)
    expect(Math.max(...secondHalf)).toBeLessThan(0.05)
  })

  it('handles empty input', () => {
    expect(computeEnvelope(new Float32Array(0), 48000)).toEqual([])
  })
})

describe('envelopeValueAt', () => {
  const envelope = [0, 1, 0.5]

  it('interpolates between windows', () => {
    expect(envelopeValueAt(envelope, 0)).toBe(0)
    expect(envelopeValueAt(envelope, 25)).toBeCloseTo(0.5)
    expect(envelopeValueAt(envelope, 50)).toBe(1)
    expect(envelopeValueAt(envelope, 75)).toBeCloseTo(0.75)
  })

  it('returns 0 outside the clip', () => {
    expect(envelopeValueAt(envelope, -10)).toBe(0)
    expect(envelopeValueAt(envelope, 100000)).toBe(0)
    expect(envelopeValueAt([], 10)).toBe(0)
  })
})
