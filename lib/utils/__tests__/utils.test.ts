import { describe, it, expect } from 'vitest'
import { cn, validateEmail } from '../../utils'

describe('cn (className merger)', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    // tailwind-merge should keep the last one
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('merges padding conflicts correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })
})

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    expect(validateEmail('test@raspquery.com')).toBe(true)
  })

  it('rejects emails without @', () => {
    expect(validateEmail('notanemail')).toBe(false)
  })

  it('rejects emails without domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })

  it('rejects emails without local part', () => {
    expect(validateEmail('@domain.com')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('rejects emails with spaces', () => {
    expect(validateEmail('user @domain.com')).toBe(false)
  })
})
