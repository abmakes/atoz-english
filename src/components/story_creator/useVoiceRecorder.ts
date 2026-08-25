'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { computeEnvelope } from '@/lib/stories/envelope'

export interface RecordingResult {
  blob: Blob
  mimeType: string
  objectUrl: string
  durationMs: number
  envelope: number[]
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4', // iOS Safari
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

/**
 * Microphone recording for the student story flow.
 * - permission is requested once (from a user gesture) and the stream reused
 * - exposes a live input level (0-1) for the "it's working!" meter
 * - stop() resolves with the blob plus the decoded duration and amplitude
 *   envelope used for lip sync
 */
export function useVoiceRecorder() {
  const [isSupported, setIsSupported] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [level, setLevel] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const startedAtRef = useRef(0)

  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined'
    )
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      void audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setHasPermission(true)
      return true
    } catch {
      setHasPermission(false)
      return false
    }
  }, [])

  const monitorLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Float32Array(analyser.fftSize)
    const loop = () => {
      analyser.getFloatTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
      const rms = Math.sqrt(sum / data.length)
      setLevel(Math.min(1, rms * 6))
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const start = useCallback(() => {
    const stream = streamRef.current
    if (!stream || isRecording) return

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    )
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.start()
    recorderRef.current = recorder
    startedAtRef.current = performance.now()
    setIsRecording(true)

    // Live level meter
    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      audioContextRef.current = new AudioContextCtor()
    }
    void audioContextRef.current.resume().catch(() => {})
    if (!analyserRef.current) {
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      analyserRef.current = analyser
    }
    monitorLevel()
  }, [isRecording, monitorLevel])

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') return null

    cancelAnimationFrame(rafRef.current)
    setLevel(0)

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })
        )
      }
      recorder.stop()
    })
    setIsRecording(false)

    const fallbackDuration = performance.now() - startedAtRef.current
    let durationMs = Math.round(fallbackDuration)
    let envelope: number[] = []
    try {
      const audioContext = audioContextRef.current
      if (audioContext) {
        const decoded = await audioContext.decodeAudioData(
          await blob.arrayBuffer()
        )
        durationMs = Math.round(decoded.duration * 1000)
        envelope = computeEnvelope(decoded.getChannelData(0), decoded.sampleRate)
      }
    } catch {
      // Envelope is a nice-to-have; playback falls back to a synthetic mouth.
    }

    return {
      blob,
      mimeType: blob.type || 'audio/webm',
      objectUrl: URL.createObjectURL(blob),
      durationMs,
      envelope,
    }
  }, [])

  return {
    isSupported,
    hasPermission,
    isRecording,
    level,
    requestPermission,
    start,
    stop,
  }
}
