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
  upsert: vi.fn().mockReturnThis(),
  insert: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  supabaseService: {
    from: () => mockSupabaseChain,
  },
}))

// ─── Import route after mocks ─────────────────────────────────────────────────

import { PATCH } from '../[agentId]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_AGENT_ID = '770e8400-e29b-41d4-a716-446655440001'
const VALID_STACK_ID = '550e8400-e29b-41d4-a716-446655440000'
const USER_UUID = '660e8400-e29b-41d4-a716-446655440001'
const CLERK_USER_ID = 'user_clerk123'

function makeRequest(body: any): NextRequest {
  return new NextRequest(`http://localhost/api/roi-tracker/subscription/${VALID_AGENT_ID}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function makeParams(agentId: string = VALID_AGENT_ID) {
  return { params: Promise.resolve({ agentId }) }
}

// ─── PATCH /api/roi-tracker/subscription/[agentId] ────────────────────────────

describe('PATCH /api/roi-tracker/subscription/[agentId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mockAuth.mockResolvedValue({ userId: CLERK_USER_ID })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('UNAUTHORIZED')
  })

  it('returns 400 when agentId is not a valid UUID', async () => {
    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams('invalid-uuid'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_AGENT_ID')
  })

  it('returns 400 when request body is invalid JSON', async () => {
    const req = new NextRequest(`http://localhost/api/roi-tracker/subscription/${VALID_AGENT_ID}`, {
      method: 'PATCH',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_JSON')
  })

  it('returns 400 when isActive is missing', async () => {
    const req = makeRequest({ stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_DATA')
  })

  it('returns 400 when stackId is missing', async () => {
    const req = makeRequest({ isActive: true })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_DATA')
  })

  it('returns 400 when stackId is not a valid UUID', async () => {
    const req = makeRequest({ isActive: true, stackId: 'invalid-uuid' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_DATA')
  })

  it('returns 404 when user not found in DB', async () => {
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null })
    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('USER_NOT_FOUND')
  })

  it('returns 403 when agent does not belong to user stack', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found but agent not in agent_ids
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: ['other-agent-id'],
        },
        error: null,
      })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('AGENT_NOT_IN_STACK')
  })

  it('returns 403 when stack does not belong to user', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack not found (doesn't belong to user)
      .mockResolvedValueOnce({ data: null, error: null })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('AGENT_NOT_IN_STACK')
  })

  it('creates new subscription status when none exists', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with agent
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [VALID_AGENT_ID],
        },
        error: null,
      })
      // No existing subscription status
      .mockResolvedValueOnce({ data: null, error: null })
      // Upsert returns new status
      .mockResolvedValueOnce({
        data: {
          id: 'new-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      })

    // History insert succeeds
    mockSupabaseChain.insert.mockResolvedValue({ error: null })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.subscriptionStatus.isActive).toBe(true)
    expect(body.subscriptionStatus.agentId).toBe(VALID_AGENT_ID)
  })

  it('updates existing subscription status', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with agent
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [VALID_AGENT_ID],
        },
        error: null,
      })
      // Existing subscription status
      .mockResolvedValueOnce({
        data: {
          id: 'existing-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      })
      // Upsert returns updated status
      .mockResolvedValueOnce({
        data: {
          id: 'existing-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        error: null,
      })

    // History insert succeeds
    mockSupabaseChain.insert.mockResolvedValue({ error: null })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.subscriptionStatus.isActive).toBe(true)
  })

  it('returns 500 when upsert fails', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with agent
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [VALID_AGENT_ID],
        },
        error: null,
      })
      // No existing subscription status
      .mockResolvedValueOnce({ data: null, error: null })
      // Upsert fails
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('UPDATE_FAILED')
  })

  it('succeeds even when history insert fails', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with agent
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [VALID_AGENT_ID],
        },
        error: null,
      })
      // No existing subscription status
      .mockResolvedValueOnce({ data: null, error: null })
      // Upsert succeeds
      .mockResolvedValueOnce({
        data: {
          id: 'new-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      })

    // History insert fails (but we don't fail the request)
    mockSupabaseChain.insert.mockResolvedValue({
      error: { message: 'History insert failed' },
    })

    const req = makeRequest({ isActive: true, stackId: VALID_STACK_ID })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('records history with correct previous and new status', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with agent
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [VALID_AGENT_ID],
        },
        error: null,
      })
      // Existing subscription status (active)
      .mockResolvedValueOnce({
        data: {
          id: 'existing-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      })
      // Upsert returns updated status (inactive)
      .mockResolvedValueOnce({
        data: {
          id: 'existing-sub-id',
          user_id: CLERK_USER_ID,
          agent_id: VALID_AGENT_ID,
          is_active: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
        error: null,
      })

    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    mockSupabaseChain.insert = mockInsert

    const req = makeRequest({ isActive: false, stackId: VALID_STACK_ID })
    await PATCH(req, makeParams())

    // Verify history was inserted with correct values
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: CLERK_USER_ID,
        agent_id: VALID_AGENT_ID,
        previous_status: true,
        new_status: false,
      })
    )
  })
})
