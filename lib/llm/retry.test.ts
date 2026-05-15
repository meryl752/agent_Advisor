import { describe, it, expect } from 'vitest'
import { computeProviderBackoffMs, isTransientProviderError } from './retry'

describe('isTransientProviderError', () => {
  it('429 / rate limit messages', () => {
    expect(isTransientProviderError(new Error('429 rate limit'))).toBe(true)
    expect(isTransientProviderError(new Error('Rate limit reached for model'))).toBe(true)
  })

  it('network-ish messages', () => {
    expect(isTransientProviderError(new Error('fetch failed'))).toBe(true)
    expect(isTransientProviderError(new Error('ECONNRESET'))).toBe(true)
    expect(isTransientProviderError(new Error('Timeout: Groq x'))).toBe(true)
  })

  it('status on shaped error', () => {
    expect(isTransientProviderError({ status: 503 })).toBe(true)
    expect(isTransientProviderError({ code: 429 })).toBe(true)
  })

  it('non-transient', () => {
    expect(isTransientProviderError(new Error('Groq not configured'))).toBe(false)
    expect(isTransientProviderError(new Error('Invalid API key'))).toBe(false)
  })
})

describe('computeProviderBackoffMs', () => {
  it('parses Groq try again in Nms', () => {
    const ms = computeProviderBackoffMs(new Error('Please try again in 90ms'), 0)
    expect(ms).toBeGreaterThanOrEqual(80)
    expect(ms).toBeLessThanOrEqual(20_000)
  })

  it('exponential when no hint', () => {
    const a = computeProviderBackoffMs(new Error('something'), 0)
    const b = computeProviderBackoffMs(new Error('something'), 2)
    expect(b).toBeGreaterThanOrEqual(a)
    expect(b).toBeLessThanOrEqual(14_000)
  })
})
