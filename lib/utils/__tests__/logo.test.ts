import { describe, it, expect } from 'vitest'
import { getLogoUrl } from '../logo'

describe('getLogoUrl', () => {
  it('returns a valid URL for a known domain', () => {
    const url = getLogoUrl('claude.ai')
    expect(url).toContain('img.logo.dev')
    expect(url).toContain('claude.ai')
    expect(url).toContain('token=')
  })

  it('returns empty string for empty domain', () => {
    expect(getLogoUrl('')).toBe('')
  })

  it('handles domains with subdomains', () => {
    const url = getLogoUrl('app.make.com')
    expect(url).toContain('app.make.com')
  })

  it('always includes the token param', () => {
    const url = getLogoUrl('openai.com')
    expect(url).toMatch(/token=pk_/)
  })

  it('returns different URLs for different domains', () => {
    const url1 = getLogoUrl('claude.ai')
    const url2 = getLogoUrl('openai.com')
    expect(url1).not.toBe(url2)
  })
})
