import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

const mockSupabaseFrom = vi.fn()
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
  supabaseService: {
    from: () => mockSupabaseChain,
  },
}))

// ─── Import routes after mocks ────────────────────────────────────────────────

import { DELETE, PATCH } from '../stacks/[id]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const USER_UUID = '660e8400-e29b-41d4-a716-446655440001'

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest(`http://localhost/api/stacks/${VALID_UUID}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeParams(id: string = VALID_UUID) {
  return { params: Promise.resolve({ id }) }
}

// ─── DELETE /api/stacks/[id] ──────────────────────────────────────────────────

describe('DELETE /api/stacks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user
    mockAuth.mockResolvedValue({ userId: 'user_clerk123' })
    // Default: user found
    mockSupabaseChain.single.mockResolvedValue({ data: { id: USER_UUID }, error: null })
    // Default: delete success
    mockSupabaseChain.eq.mockReturnThis()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const req = makeRequest('DELETE')
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid UUID format', async () => {
    const req = makeRequest('DELETE')
    const res = await DELETE(req, makeParams('not-a-uuid'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_ID')
  })

  it('returns 404 when user not found in DB', async () => {
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null })
    const req = makeRequest('DELETE')
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('USER_NOT_FOUND')
  })

  it('returns 200 on successful delete', async () => {
    // Build a proper chainable mock for the delete operation
    const eqChain = { eq: vi.fn().mockReturnValue({ error: null }) }
    const deleteChain = { eq: vi.fn().mockReturnValue(eqChain) }
    mockSupabaseChain.delete.mockReturnValue(deleteChain)
    // User found
    mockSupabaseChain.single.mockResolvedValue({ data: { id: USER_UUID }, error: null })

    const req = makeRequest('DELETE')
    const res = await DELETE(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ─── PATCH /api/stacks/[id] ───────────────────────────────────────────────────

describe('PATCH /api/stacks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_clerk123' })
    mockSupabaseChain.single.mockResolvedValue({ data: { id: USER_UUID }, error: null })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const req = makeRequest('PATCH', { name: 'New Name' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    const req = makeRequest('PATCH', { name: 'New Name' })
    const res = await PATCH(req, makeParams('bad-id'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_ID')
  })

  it('returns 400 for empty name', async () => {
    const req = makeRequest('PATCH', { name: '' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_DATA')
  })

  it('returns 400 for name too long', async () => {
    const req = makeRequest('PATCH', { name: 'a'.repeat(201) })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_DATA')
  })

  it('returns 400 for missing body', async () => {
    const req = new NextRequest(`http://localhost/api/stacks/${VALID_UUID}`, {
      method: 'PATCH',
      body: 'invalid json{{{',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 200 on successful rename', async () => {
    // User found
    mockSupabaseChain.single
      .mockResolvedValueOnce({ data: { id: USER_UUID }, error: null }) // getInternalUserId
      .mockResolvedValueOnce({ data: { id: VALID_UUID, name: 'New Name' }, error: null }) // update

    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: VALID_UUID, name: 'New Name' },
        error: null,
      }),
    }
    mockSupabaseChain.update.mockReturnValue(updateChain)

    const req = makeRequest('PATCH', { name: 'New Name' })
    const res = await PATCH(req, makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
