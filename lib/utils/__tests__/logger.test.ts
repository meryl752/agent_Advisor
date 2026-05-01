import { describe, it, expect } from 'vitest'
import { anonymizeEmail, anonymizeId, anonymizeString } from '../logger'

describe('anonymizeEmail', () => {
  it('anonymizes a standard email', () => {
    const result = anonymizeEmail('john.doe@example.com')
    expect(result).toBe('joh***@example.com')
    expect(result).not.toContain('john.doe')
  })

  it('shows only 3 chars of local part', () => {
    const result = anonymizeEmail('ab@test.com')
    expect(result).toBe('ab***@test.com')
  })

  it('handles null', () => {
    expect(anonymizeEmail(null)).toBe('[no-email]')
  })

  it('handles undefined', () => {
    expect(anonymizeEmail(undefined)).toBe('[no-email]')
  })

  it('handles email without @', () => {
    expect(anonymizeEmail('notanemail')).toBe('***')
  })

  it('preserves the domain part', () => {
    const result = anonymizeEmail('user@raspquery.com')
    expect(result).toContain('@raspquery.com')
  })
})

describe('anonymizeId', () => {
  it('anonymizes a Clerk user ID', () => {
    const result = anonymizeId('user_2abc123def456')
    expect(result).toBe('user_2ab***')
    expect(result).not.toContain('def456')
  })

  it('anonymizes a UUID', () => {
    const result = anonymizeId('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBe('550e8400***')
  })

  it('handles null', () => {
    expect(anonymizeId(null)).toBe('[no-id]')
  })

  it('handles undefined', () => {
    expect(anonymizeId(undefined)).toBe('[no-id]')
  })

  it('handles short IDs', () => {
    const result = anonymizeId('abc')
    expect(result).toBe('abc***')
  })
})

describe('anonymizeString', () => {
  it('shows only first 3 chars', () => {
    expect(anonymizeString('secrettoken')).toBe('sec***')
  })

  it('handles short strings', () => {
    expect(anonymizeString('ab')).toBe('***')
  })

  it('handles empty string', () => {
    expect(anonymizeString('')).toBe('[empty]')
  })

  it('handles null', () => {
    expect(anonymizeString(null)).toBe('[empty]')
  })
})
