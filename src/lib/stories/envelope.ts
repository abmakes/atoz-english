import { ENVELOPE_WINDOW_MS } from '@/lib/stories/schemas';

/**
 * Compute an amplitude envelope (one 0-1 value per 50 ms window) from raw
 * PCM samples. Pure so it is unit-testable; callers in the browser pass
 * `audioBuffer.getChannelData(0)`.
 */
export function computeEnvelope(
  samples: Float32Array,
  sampleRate: number,
  windowMs: number = ENVELOPE_WINDOW_MS
): number[] {
  if (samples.length === 0 || sampleRate <= 0) return [];

  const windowSize = Math.max(1, Math.round((sampleRate * windowMs) / 1000));
  const windowCount = Math.ceil(samples.length / windowSize);
  const rms: number[] = new Array(windowCount);

  for (let w = 0; w < windowCount; w++) {
    const start = w * windowSize;
    const end = Math.min(start + windowSize, samples.length);
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += samples[i] * samples[i];
    }
    rms[w] = Math.sqrt(sum / Math.max(1, end - start));
  }

  // Normalize to the clip's own peak so quiet phone recordings still animate.
  const peak = Math.max(...rms, 0.0001);
  return rms.map((value) => Math.min(1, value / peak));
}

/** Envelope value at a time offset into the clip (linear interpolation). */
export function envelopeValueAt(
  envelope: number[],
  offsetMs: number,
  windowMs: number = ENVELOPE_WINDOW_MS
): number {
  if (envelope.length === 0 || offsetMs < 0) return 0;
  const position = offsetMs / windowMs;
  const index = Math.floor(position);
  if (index >= envelope.length) return 0;
  const next = Math.min(index + 1, envelope.length - 1);
  const frac = position - index;
  return envelope[index] * (1 - frac) + envelope[next] * frac;
}
