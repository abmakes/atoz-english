'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { envelopeValueAt } from '@/lib/stories/envelope'
import { stepAmplitude } from '@/lib/thoughts/animation'
import { playbackRateFor, type VoiceEffect } from '@/lib/thoughts/voices'

interface PlayRequest {
  blob: Blob
  envelope: number[]
  effect: VoiceEffect
}

interface LiveNodes {
  source: AudioBufferSourceNode
  oscillators: OscillatorNode[]
  nodes: AudioNode[]
}

function audioContext(): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new Ctor()
}

/** Soft clip that stays audible on quiet speech. Odd length so the center sample is silence. */
function robotCurve(): Float32Array {
  const length = 2049
  const curve = new Float32Array(length)
  const drive = 8
  const limit = Math.tanh(drive)
  for (let i = 0; i < length; i++) {
    const x = (i / (length - 1)) * 2 - 1
    curve[i] = Math.tanh(drive * x) / limit
  }
  return curve
}

function connectVoice(
  ctx: AudioContext,
  source: AudioBufferSourceNode,
  effect: VoiceEffect
): { output: AudioNode; oscillators: OscillatorNode[]; nodes: AudioNode[] } {
  source.playbackRate.value = playbackRateFor(effect)
  if (effect !== 'robot') {
    return { output: source, oscillators: [], nodes: [source] }
  }
  const shaper = ctx.createWaveShaper()
  shaper.curve = robotCurve()
  shaper.oversample = '2x'
  const carrier = ctx.createOscillator()
  carrier.type = 'square'
  carrier.frequency.value = 46
  const ring = ctx.createGain()
  ring.gain.value = 0
  const wet = ctx.createGain()
  wet.gain.value = 0.8
  const dry = ctx.createGain()
  dry.gain.value = 0.35
  const output = ctx.createGain()
  output.gain.value = 1
  source.connect(shaper)
  shaper.connect(dry)
  dry.connect(output)
  shaper.connect(ring)
  carrier.connect(ring.gain)
  ring.connect(wet)
  wet.connect(output)
  carrier.start()
  return {
    output,
    oscillators: [carrier],
    nodes: [source, shaper, ring, wet, dry, output, carrier],
  }
}

export function useClipPlayer() {
  const levelRef = useRef(0)
  const smoothRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<LiveNodes | null>(null)
  const rafRef = useRef(0)
  const envelopeRef = useRef<number[]>([])
  const [playing, setPlaying] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)

  const stopNodes = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const live = nodesRef.current
    nodesRef.current = null
    if (!live) return
    live.source.onended = null
    try {
      live.source.stop()
    } catch {
      // Already stopped.
    }
    for (const oscillator of live.oscillators) {
      try {
        oscillator.stop()
      } catch {
        // Already stopped.
      }
    }
    for (const node of live.nodes) node.disconnect()
  }, [])

  const stop = useCallback(() => {
    stopNodes()
    smoothRef.current = 0
    levelRef.current = 0
    setPlaying(false)
    setElapsedMs(0)
  }, [stopNodes])

  useEffect(() => () => {
    stopNodes()
    void ctxRef.current?.close().catch(() => undefined)
  }, [stopNodes])

  const play = useCallback(
    async ({ blob, envelope, effect }: PlayRequest) => {
      if (!ctxRef.current) ctxRef.current = audioContext()
      const ctx = ctxRef.current
      await ctx.resume()
      stopNodes()
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
      const source = ctx.createBufferSource()
      source.buffer = decoded
      const wired = connectVoice(ctx, source, effect)
      wired.output.connect(ctx.destination)
      envelopeRef.current = envelope
      smoothRef.current = 0
      levelRef.current = 0
      const rate = playbackRateFor(effect)
      const started = ctx.currentTime
      setDurationMs(Math.round(decoded.duration * 1000))
      setElapsedMs(0)
      setPlaying(true)
      let lastPaint = 0
      const loop = () => {
        const mediaMs = (ctx.currentTime - started) * rate * 1000
        const stepped = stepAmplitude(
          smoothRef.current,
          envelopeValueAt(envelopeRef.current, mediaMs)
        )
        smoothRef.current = stepped.state
        levelRef.current = stepped.level
        const now = performance.now()
        if (now - lastPaint > 100) {
          lastPaint = now
          setElapsedMs(Math.min(decoded.duration * 1000, mediaMs))
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      source.onended = () => {
        cancelAnimationFrame(rafRef.current)
        levelRef.current = 0
        smoothRef.current = 0
        setPlaying(false)
        setElapsedMs(Math.round(decoded.duration * 1000))
      }
      nodesRef.current = {
        source,
        oscillators: wired.oscillators,
        nodes: wired.nodes,
      }
      source.start()
      rafRef.current = requestAnimationFrame(loop)
    },
    [stopNodes]
  )

  return { play, stop, playing, elapsedMs, durationMs, levelRef }
}
