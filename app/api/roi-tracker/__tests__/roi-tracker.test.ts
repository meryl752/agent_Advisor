import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  supabaseService: {
    from: () => mockSupabaseChain,
  },
}))

// ─── Import route after mocks ─────────────────────────────────────────────────

import { GET } from '../[stackId]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STACK_ID = '550e8400-e29b-41d4-a716-446655440000'
const USER_UUID = '660e8400-e29b-41d4-a716-446655440001'
const AGENT_ID_1 = '770e8400-e29b-41d4-a716-446655440001'
const AGENT_ID_2 = '770e8400-e29b-41d4-a716-446655440002'

function makeRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/roi-tracker/${VALID_STACK_ID}`, {
    method: 'GET',
  })
}

function makeParams(stackId: string = VALID_STACK_ID) {
  return { params: Promise.resolve({ stackId }) }
}

// ─── GET /api/roi-tracker/[stackId] ───────────────────────────────────────────

describe('GET /api/roi-tracker/[stackId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mockAuth.mockResolvedValue({ userId: 'user_clerk123' })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('UNAUTHORIZED')
  })

  it('returns 404 when user not found in DB', async () => {
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null })
    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('USER_NOT_FOUND')
  })

  it('returns 404 when stack not found', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack not found
      .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('NOT_FOUND')
  })

  it('returns empty tools array when stack has no agents', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with no agents
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          name: 'Test Stack',
          objective: 'Test objective',
          agent_ids: [],
        },
        error: null,
      })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tools).toEqual([])
    expect(body.metrics.predictedMonthlyCost).toBe(0)
    expect(body.metrics.actualMonthlyCost).toBe(0)
    expect(body.metrics.monthlySavings).toBe(0)
  })

  it('returns tools with subscription status and calculates metrics correctly', async () => {
    const mockAgents = [
      {
        id: AGENT_ID_1,
        name: 'Tool 1',
        description: 'Description 1',
        category: 'automation',
        score: 85,
        pricing_model: 'paid',
        price_from: 50,
        url: 'https://tool1.com',
        logo_url: 'https://logo1.com',
      },
      {
        id: AGENT_ID_2,
        name: 'Tool 2',
        description: 'Description 2',
        category: 'analytics',
        score: 90,
        pricing_model: 'freemium',
        price_from: 30,
        url: 'https://tool2.com',
        logo_url: 'https://logo2.com',
      },
    ]

    const mockSubscriptions = [
      {
        id: 'sub1',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_1,
        isActive: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01',
      },
      // Tool 2 is not active (no subscription or isActive: false)
    ]

    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          name: 'Test Stack',
          objective: 'Test objective',
          agent_ids: [AGENT_ID_1, AGENT_ID_2],
        },
        error: null,
      })

    // Agents query
    mockSupabaseChain.in.mockResolvedValueOnce({ data: mockAgents, error: null })
    // Subscriptions query
    mockSupabaseChain.in.mockResolvedValueOnce({ data: mockSubscriptions, error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verify tools are returned
    expect(body.tools).toHaveLength(2)
    expect(body.tools[0].name).toBe('Tool 1')
    expect(body.tools[0].subscriptionStatus).toBeDefined()
    expect(body.tools[0].subscriptionStatus.isActive).toBe(true)
    expect(body.tools[1].name).toBe('Tool 2')
    expect(body.tools[1].subscriptionStatus).toBeUndefined()

    // Verify metrics calculation
    // Predicted: 50 + 30 = 80
    // Actual: 50 (only Tool 1 is active)
    // Savings: 80 - 50 = 30
    expect(body.metrics.predictedMonthlyCost).toBe(80)
    expect(body.metrics.actualMonthlyCost).toBe(50)
    expect(body.metrics.monthlySavings).toBe(30)
  })

  it('handles database errors gracefully', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          name: 'Test Stack',
          objective: 'Test objective',
          agent_ids: [AGENT_ID_1],
        },
        error: null,
      })

    // Agents query fails
    mockSupabaseChain.in.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DATABASE_ERROR')
  })
})
