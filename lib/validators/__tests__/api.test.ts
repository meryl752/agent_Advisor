import { describe, it, expect } from 'vitest'
import {
  uuidSchema,
  recommendSchema,
  waitlistSchema,
  stackPatchSchema,
  feedbackSchema,
} from '../api'

// ─── uuidSchema ───────────────────────────────────────────────────────────────

describe('uuidSchema', () => {
  it('accepts valid UUIDs', () => {
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
    expect(uuidSchema.safeParse('00000000-0000-0000-0000-000000000000').success).toBe(true)
  })

  it('rejects invalid UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(uuidSchema.safeParse('').success).toBe(false)
    expect(uuidSchema.safeParse('123').success).toBe(false)
  })
})

// ─── recommendSchema ──────────────────────────────────────────────────────────

describe('recommendSchema', () => {
  const valid = {
    objective: 'Je veux lancer une boutique Shopify et automatiser mon SAV',
    sector: 'ecommerce',
    budget: 'low' as const,
    tech_level: 'beginner' as const,
  }

  it('accepts valid input', () => {
    expect(recommendSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects objective too short', () => {
    const result = recommendSchema.safeParse({ ...valid, objective: 'court' })
    expect(result.success).toBe(false)
  })

  it('rejects objective too long', () => {
    const result = recommendSchema.safeParse({ ...valid, objective: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid budget', () => {
    const result = recommendSchema.safeParse({ ...valid, budget: 'ultra' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid tech_level', () => {
    const result = recommendSchema.safeParse({ ...valid, tech_level: 'expert' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid budget values', () => {
    for (const budget of ['zero', 'low', 'medium', 'high'] as const) {
      expect(recommendSchema.safeParse({ ...valid, budget }).success).toBe(true)
    }
  })

  it('accepts all valid tech_level values', () => {
    for (const tech_level of ['beginner', 'intermediate', 'advanced'] as const) {
      expect(recommendSchema.safeParse({ ...valid, tech_level }).success).toBe(true)
    }
  })

  it('defaults team_size to solo', () => {
    const result = recommendSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.team_size).toBe('solo')
  })

  it('defaults current_tools to empty array', () => {
    const result = recommendSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.current_tools).toEqual([])
  })

  it('trims whitespace from objective', () => {
    const result = recommendSchema.safeParse({ ...valid, objective: '  Je veux lancer une boutique Shopify  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.objective).toBe('Je veux lancer une boutique Shopify')
  })
})

// ─── waitlistSchema ───────────────────────────────────────────────────────────

describe('waitlistSchema', () => {
  it('accepts valid email', () => {
    expect(waitlistSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(waitlistSchema.safeParse({ email: 'notanemail' }).success).toBe(false)
  })

  it('rejects empty email', () => {
    expect(waitlistSchema.safeParse({ email: '' }).success).toBe(false)
  })

  it('lowercases email', () => {
    const result = waitlistSchema.safeParse({ email: 'USER@EXAMPLE.COM' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('user@example.com')
  })
})

// ─── stackPatchSchema ─────────────────────────────────────────────────────────

describe('stackPatchSchema', () => {
  it('accepts valid name', () => {
    expect(stackPatchSchema.safeParse({ name: 'Mon Stack Shopify' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(stackPatchSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects name too long', () => {
    expect(stackPatchSchema.safeParse({ name: 'a'.repeat(201) }).success).toBe(false)
  })

  it('accepts name at max length', () => {
    expect(stackPatchSchema.safeParse({ name: 'a'.repeat(200) }).success).toBe(true)
  })

  it('trims whitespace', () => {
    const result = stackPatchSchema.safeParse({ name: '  Mon Stack  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Mon Stack')
  })
})

// ─── feedbackSchema ───────────────────────────────────────────────────────────

describe('feedbackSchema', () => {
  it('accepts valid feedback with rating', () => {
    const result = feedbackSchema.safeParse({ stack_rating: 5 })
    expect(result.success).toBe(true)
  })

  it('rejects rating below 1', () => {
    expect(feedbackSchema.safeParse({ stack_rating: 0 }).success).toBe(false)
  })

  it('rejects rating above 5', () => {
    expect(feedbackSchema.safeParse({ stack_rating: 6 }).success).toBe(false)
  })

  it('accepts empty feedback', () => {
    expect(feedbackSchema.safeParse({}).success).toBe(true)
  })

  it('rejects comment too long', () => {
    expect(feedbackSchema.safeParse({ stack_comment: 'a'.repeat(1001) }).success).toBe(false)
  })

  it('accepts valid agent rating', () => {
    const result = feedbackSchema.safeParse({
      agent_ratings: [{
        agent_id: '550e8400-e29b-41d4-a716-446655440000',
        rating: 4,
      }]
    })
    expect(result.success).toBe(true)
  })
})
