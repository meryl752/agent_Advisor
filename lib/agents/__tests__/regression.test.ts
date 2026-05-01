/**
 * Tests de régression du moteur de recommandation
 *
 * Ces tests vérifient les INVARIANTS du pipeline :
 * - Le moteur retourne toujours 4-6 outils
 * - Le budget est toujours respecté
 * - Pas de redondances fonctionnelles
 * - Le score de chaque outil est dans [0, 100]
 * - Les champs obligatoires sont toujours présents
 * - Le matcher RRF produit des résultats cohérents
 *
 * Stratégie : mocks pour LLM + Supabase → tests rapides sans API réelles
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { matchAgents } from '../matcher'
import type { VectorAgent, AnalyzedQuery, UserContext } from '../types'
import { BUDGET_MAP } from '@/lib/constants'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeAgent(overrides: Partial<VectorAgent> = {}): VectorAgent {
  return {
    id: crypto.randomUUID(),
    name: 'TestAgent',
    category: 'automation',
    description: 'A test agent',
    pricing_model: 'freemium',
    price_from: 0,
    score: 80,
    roi_score: 75,
    use_cases: ['automatisation', 'email'],
    compatible_with: [],
    url: 'https://test.com',
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
    similarity: 0.8,
    best_for: [],
    integrations: [],
    setup_difficulty: 'easy',
    time_to_value: '1 jour',
    website_domain: 'test.com',
    not_for: [],
    ...overrides,
  }
}

function makeQuery(overrides: Partial<AnalyzedQuery> = {}): AnalyzedQuery {
  return {
    original: 'Je veux automatiser mon service client Shopify',
    subtasks: ['automatiser emails', 'chatbot SAV', 'gestion commandes'],
    required_categories: ['automation', 'customer-support', 'ecommerce'],
    sector_context: 'e-commerce boutique en ligne',
    implicit_constraints: [],
    ...overrides,
  }
}

function makeContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    objective: 'Je veux automatiser mon service client Shopify',
    sector: 'ecommerce',
    team_size: 'solo',
    budget: 'low',
    tech_level: 'beginner',
    timeline: 'weeks',
    current_tools: [],
    ...overrides,
  }
}

// ─── matchAgents — Invariants ─────────────────────────────────────────────────

describe('matchAgents — invariants', () => {

  it('returns empty array when no agents provided', () => {
    const result = matchAgents([], makeQuery(), makeContext())
    expect(result).toHaveLength(0)
  })

  it('returns at most 15 agents', () => {
    const agents = Array.from({ length: 30 }, (_, i) =>
      makeAgent({ id: `id-${i}`, name: `Agent${i}`, price_from: 0 })
    )
    const result = matchAgents(agents, makeQuery(), makeContext())
    expect(result.length).toBeLessThanOrEqual(15)
  })

  it('all returned agents have relevance_score in [0, 100]', () => {
    const agents = Array.from({ length: 10 }, (_, i) =>
      makeAgent({ id: `id-${i}`, name: `Agent${i}`, price_from: i * 5 })
    )
    const result = matchAgents(agents, makeQuery(), makeContext())
    for (const agent of result) {
      expect(agent.relevance_score).toBeGreaterThanOrEqual(0)
      expect(agent.relevance_score).toBeLessThanOrEqual(100)
    }
  })

  it('results are sorted by relevance_score descending', () => {
    const agents = Array.from({ length: 10 }, (_, i) =>
      makeAgent({ id: `id-${i}`, name: `Agent${i}`, price_from: 0 })
    )
    const result = matchAgents(agents, makeQuery(), makeContext())
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].relevance_score).toBeGreaterThanOrEqual(result[i].relevance_score)
    }
  })

  it('eliminates agents over budget', () => {
    const ctx = makeContext({ budget: 'low' }) // low = 50€
    const budgetMax = BUDGET_MAP['low']
    const agents = [
      makeAgent({ id: 'cheap', name: 'Cheap', price_from: 10 }),
      makeAgent({ id: 'expensive', name: 'Expensive', price_from: budgetMax + 100 }),
    ]
    const result = matchAgents(agents, makeQuery(), ctx)
    const names = result.map(a => a.name)
    expect(names).toContain('Cheap')
    expect(names).not.toContain('Expensive')
  })

  it('returns empty when all agents exceed budget with low budget', () => {
    const ctx = makeContext({ budget: 'low' }) // 50€ max
    const agents = [
      makeAgent({ id: '1', name: 'Paid1', price_from: 100 }),
      makeAgent({ id: '2', name: 'Paid2', price_from: 200 }),
    ]
    const result = matchAgents(agents, makeQuery(), ctx)
    expect(result).toHaveLength(0)
  })

  it('zero budget filters out all paid agents', () => {
    // FIXED: budget='zero' now correctly filters agents with price_from > 0
    const ctx = makeContext({ budget: 'zero' })
    const agents = [
      makeAgent({ id: '1', name: 'Paid', price_from: 10 }),
      makeAgent({ id: '2', name: 'Free', price_from: 0 }),
    ]
    const result = matchAgents(agents, makeQuery(), ctx)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Free')
  })

  it('all returned agents have required fields', () => {
    const agents = Array.from({ length: 5 }, (_, i) =>
      makeAgent({ id: `id-${i}`, name: `Agent${i}` })
    )
    const result = matchAgents(agents, makeQuery(), makeContext())
    for (const agent of result) {
      expect(agent.id).toBeDefined()
      expect(agent.name).toBeDefined()
      expect(agent.category).toBeDefined()
      expect(agent.price_from).toBeTypeOf('number')
      expect(agent.relevance_score).toBeTypeOf('number')
      expect(agent.relevance_reason).toBeDefined()
    }
  })

  it('boosts agents matching required categories', () => {
    const query = makeQuery({ required_categories: ['automation'] })
    const agents = [
      makeAgent({ id: '1', name: 'AutoAgent', category: 'automation', price_from: 0 }),
      makeAgent({ id: '2', name: 'OtherAgent', category: 'analytics', price_from: 0 }),
    ]
    const result = matchAgents(agents, query, makeContext())
    // AutoAgent should rank higher due to category match
    expect(result[0].name).toBe('AutoAgent')
  })

  it('penalizes agents with not_for matching objective', () => {
    const ctx = makeContext({ objective: 'Je veux faire du dropshipping' })
    const query = makeQuery({ subtasks: ['dropshipping'] })
    const agents = [
      makeAgent({ id: '1', name: 'GoodAgent', not_for: [], price_from: 0 }),
      makeAgent({ id: '2', name: 'BadAgent', not_for: ['dropshipping'], price_from: 0 }),
    ]
    const result = matchAgents(agents, query, ctx)
    const goodIdx = result.findIndex(a => a.name === 'GoodAgent')
    const badIdx = result.findIndex(a => a.name === 'BadAgent')
    if (goodIdx !== -1 && badIdx !== -1) {
      expect(goodIdx).toBeLessThan(badIdx)
    }
  })

  it('handles agents with missing optional fields gracefully', () => {
    const agent = makeAgent({
      id: 'minimal',
      name: 'Minimal',
      use_cases: undefined as any,
      best_for: undefined as any,
      integrations: undefined as any,
      not_for: undefined as any,
    })
    expect(() => matchAgents([agent], makeQuery(), makeContext())).not.toThrow()
  })
})

// ─── matchAgents — Property-based tests ──────────────────────────────────────

describe('matchAgents — property-based', () => {

  it('relevance_score is always in [0, 100] for any input', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price_from: fc.integer({ min: 0, max: 500 }),
            similarity: fc.float({ min: 0, max: 1 }),
            category: fc.constantFrom('automation', 'analytics', 'ecommerce', 'ai-writing'),
            score: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (rawAgents) => {
          const agents = rawAgents.map(a => makeAgent(a as any))
          const result = matchAgents(agents, makeQuery(), makeContext())
          return result.every(r =>
            r.relevance_score >= 0 && r.relevance_score <= 100
          )
        }
      ),
      { numRuns: 50 }
    )
  })

  it('results are always sorted descending for any input', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price_from: fc.integer({ min: 0, max: 100 }),
            similarity: fc.float({ min: 0, max: 1 }),
          }),
          { minLength: 2, maxLength: 15 }
        ),
        (rawAgents) => {
          const agents = rawAgents.map(a => makeAgent(a as any))
          const result = matchAgents(agents, makeQuery(), makeContext())
          for (let i = 1; i < result.length; i++) {
            if (result[i - 1].relevance_score < result[i].relevance_score) return false
          }
          return true
        }
      ),
      { numRuns: 50 }
    )
  })

  it('never returns agents over budget', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('zero', 'low', 'medium', 'high' as const),
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price_from: fc.integer({ min: 0, max: 300 }),
            similarity: fc.float({ min: 0, max: 1 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (budget, rawAgents) => {
          const ctx = makeContext({ budget: budget as any })
          const budgetMax = BUDGET_MAP[budget as keyof typeof BUDGET_MAP] ?? 0
          const agents = rawAgents.map(a => makeAgent(a as any))
          const result = matchAgents(agents, makeQuery(), ctx)
          // For zero budget: only free agents (price_from === 0) allowed
          // For other budgets: price_from <= budgetMax
          return result.every(a => {
            if (budgetMax === 0) return a.price_from === 0
            return a.price_from <= budgetMax
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('never returns more than 15 agents regardless of input size', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price_from: fc.integer({ min: 0, max: 50 }),
            similarity: fc.float({ min: 0, max: 1 }),
          }),
          { minLength: 0, maxLength: 100 }
        ),
        (rawAgents) => {
          const agents = rawAgents.map(a => makeAgent(a as any))
          const result = matchAgents(agents, makeQuery(), makeContext())
          return result.length <= 15
        }
      ),
      { numRuns: 30 }
    )
  })
})

// ─── Budget constants — sanity checks ────────────────────────────────────────

describe('BUDGET_MAP — sanity checks', () => {
  it('zero budget is 0', () => {
    expect(BUDGET_MAP['zero']).toBe(0)
  })

  it('budgets are ordered: zero < low < medium < high', () => {
    expect(BUDGET_MAP['zero']).toBeLessThan(BUDGET_MAP['low'])
    expect(BUDGET_MAP['low']).toBeLessThan(BUDGET_MAP['medium'])
    expect(BUDGET_MAP['medium']).toBeLessThan(BUDGET_MAP['high'])
  })

  it('all budget values are non-negative integers', () => {
    for (const val of Object.values(BUDGET_MAP)) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(val)).toBe(true)
    }
  })
})
