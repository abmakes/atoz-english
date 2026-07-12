import type { GameConfig } from '../config/GameConfig'
import { validateGameConfig } from '../config/GameConfig'

export interface ConfigChangeEvent {
  path: string
  oldValue: unknown
  newValue: unknown
  source: 'user' | 'system' | 'runtime'
}

export interface ConfigValidationResult {
  valid: boolean
  errors?: string[]
}

export function getPropertyByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, part) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)
}

export function setPropertyByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split('.')
  const lastPart = parts.pop()

  if (!lastPart) {
    throw new Error(`Invalid property path: ${path}`)
  }

  let current = obj

  for (const part of parts) {
    if (current[part] === undefined) {
      current[part] = {}
    }

    if (typeof current[part] !== 'object' || current[part] === null) {
      throw new Error(`Cannot set property at path ${path}: ${part} is not an object`)
    }

    current = current[part] as Record<string, unknown>
  }

  current[lastPart] = value
}

export function validateConfigChange(
  config: Readonly<GameConfig>,
  path: string,
  newValue: unknown
): ConfigValidationResult {
  const tempConfig = { ...config } as GameConfig
  setPropertyByPath(tempConfig as unknown as Record<string, unknown>, path, newValue)
  const errors = validateGameConfig(tempConfig)

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Applies a path update onto a frozen GameConfig by cloning, mutating, and re-freezing.
 */
export function applyMutableConfigChange(
  config: Readonly<GameConfig>,
  path: string,
  newValue: unknown
): Readonly<GameConfig> {
  const mutableConfig = { ...config } as GameConfig
  setPropertyByPath(mutableConfig as unknown as Record<string, unknown>, path, newValue)
  return Object.freeze(mutableConfig)
}
