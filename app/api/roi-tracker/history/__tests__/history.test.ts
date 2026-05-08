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
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  supabaseService: {
    from: () => mockSupabaseChain,
  },
}))

// ─── Import route after mocks ─────────────────────────────────────────────────

import { GET } from '../../history/[stackId]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STACK_ID = '550e8400-e29b-41d4-a716-446655440000'
const USER_UUID = '660e8400-e29b-41d4-a716-446655440001'
const AGENT_ID_1 = '770e8400-e29b-41d4-a716-446655440001'
const AGENT_ID_2 = '770e8400-e29b-41d4-a716-446655440002'

function makeRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/roi-tracker/history/${VALID_STACK_ID}`, {
    method: 'GET',
  })
}

function makeParams(stackId: string = VALID_STACK_ID) {
  return { params: Promise.resolve({ stackId }) }
}

// ─── GET /api/roi-tracker/history/[stackId] ───────────────────────────────────

describe('GET /api/roi-tracker/history/[stackId]', () => {
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

  it('returns empty array when stack has no agents', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with no agents
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [],
        },
        error: null,
      })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it('returns empty array when no history exists', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1, AGENT_ID_2],
        },
        error: null,
      })

    // No history entries
    mockSupabaseChain.limit.mockResolvedValueOnce({ data: [], error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it('returns history entries with agent names sorted by most recent first', async () => {
    const mockHistoryEntries = [
      {
        id: 'hist1',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_1,
        previous_status: false,
        new_status: true,
        changed_at: '2025-01-15T10:30:00Z',
        agents: { name: 'Tool 1' },
      },
      {
        id: 'hist2',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_2,
        previous_status: true,
        new_status: false,
        changed_at: '2025-01-14T09:15:00Z',
        agents: { name: 'Tool 2' },
      },
      {
        id: 'hist3',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_1,
        previous_status: false,
        new_status: true,
        changed_at: '2025-01-13T14:45:00Z',
        agents: { name: 'Tool 1' },
      },
    ]

    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1, AGENT_ID_2],
        },
        error: null,
      })

    // History entries
    mockSupabaseChain.limit.mockResolvedValueOnce({ data: mockHistoryEntries, error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verify history entries are returned
    expect(body).toHaveLength(3)
    
    // Verify first entry (most recent)
    expect(body[0].id).toBe('hist1')
    expect(body[0].agentName).toBe('Tool 1')
    expect(body[0].previousStatus).toBe(false)
    expect(body[0].newStatus).toBe(true)
    expect(body[0].changedAt).toBe('2025-01-15T10:30:00Z')

    // Verify second entry
    expect(body[1].id).toBe('hist2')
    expect(body[1].agentName).toBe('Tool 2')
    expect(body[1].previousStatus).toBe(true)
    expect(body[1].newStatus).toBe(false)

    // Verify third entry
    expect(body[2].id).toBe('hist3')
    expect(body[2].agentName).toBe('Tool 1')
  })

  it('limits history to 50 entries', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1],
        },
        error: null,
      })

    // Mock 50 history entries
    const mockHistoryEntries = Array.from({ length: 50 }, (_, i) => ({
      id: `hist${i}`,
      user_id: 'user_clerk123',
      agent_id: AGENT_ID_1,
      previous_status: i % 2 === 0,
      new_status: i % 2 === 1,
      changed_at: new Date(Date.now() - i * 1000).toISOString(),
      agents: { name: 'Tool 1' },
    }))

    mockSupabaseChain.limit.mockResolvedValueOnce({ data: mockHistoryEntries, error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verify exactly 50 entries are returned
    expect(body).toHaveLength(50)
    
    // Verify limit was called with 50
    expect(mockSupabaseChain.limit).toHaveBeenCalledWith(50)
  })

  it('handles missing agent name gracefully', async () => {
    const mockHistoryEntries = [
      {
        id: 'hist1',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_1,
        previous_status: false,
        new_status: true,
        changed_at: '2025-01-15T10:30:00Z',
        agents: null, // Agent might be deleted
      },
    ]

    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1],
        },
        error: null,
      })

    // History entries
    mockSupabaseChain.limit.mockResolvedValueOnce({ data: mockHistoryEntries, error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verify fallback to 'Unknown Tool'
    expect(body[0].agentName).toBe('Unknown Tool')
  })

  it('handles database errors gracefully', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1],
        },
        error: null,
      })

    // History query fails
    mockSupabaseChain.limit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DATABASE_ERROR')
  })

  it('filters history by agents in the specified stack only', async () => {
    const AGENT_ID_3 = '770e8400-e29b-41d4-a716-446655440003'
    
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null })
      // Stack found with only AGENT_ID_1 and AGENT_ID_2
      .mockResolvedValueOnce({
        data: {
          id: VALID_STACK_ID,
          agent_ids: [AGENT_ID_1, AGENT_ID_2],
        },
        error: null,
      })

    // History should only include entries for AGENT_ID_1 and AGENT_ID_2
    // AGENT_ID_3 should be filtered out by the query
    const mockHistoryEntries = [
      {
        id: 'hist1',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_1,
        previous_status: false,
        new_status: true,
        changed_at: '2025-01-15T10:30:00Z',
        agents: { name: 'Tool 1' },
      },
      {
        id: 'hist2',
        user_id: 'user_clerk123',
        agent_id: AGENT_ID_2,
        previous_status: true,
        new_status: false,
        changed_at: '2025-01-14T09:15:00Z',
        agents: { name: 'Tool 2' },
      },
    ]

    mockSupabaseChain.limit.mockResolvedValueOnce({ data: mockHistoryEntries, error: null })

    const req = makeRequest()
    const res = await GET(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()

    // Verify only entries for agents in the stack are returned
    expect(body).toHaveLength(2)
    expect(body.every((entry: any) => 
      [AGENT_ID_1, AGENT_ID_2].includes(entry.agentId)
    )).toBe(true)
    
    // Verify the in() filter was called with the correct agent IDs
    expect(mockSupabaseChain.in).toHaveBeenCalledWith('agent_id', [AGENT_ID_1, AGENT_ID_2])
  })
})
