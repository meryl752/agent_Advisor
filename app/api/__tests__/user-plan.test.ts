import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}))

const mockGetUserByClerkId = vi.fn()
vi.mock('@/lib/supabase/queries', () => ({
  getUserByClerkId: (id: string) => mockGetUserByClerkId(id),
}))

// ─── Import route after mocks ─────────────────────────────────────────────────

import { GET } from '../user/plan/route'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/user/plan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('UNAUTHORIZED')
  })

  it('returns free plan for authenticated user with no DB record', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockGetUserByClerkId.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('free')
  })

  it('returns free plan for free user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockGetUserByClerkId.mockResolvedValue({ plan: 'free' })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('free')
  })

  it('returns pro plan for pro user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_pro' })
    mockGetUserByClerkId.mockResolvedValue({ plan: 'pro' })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('pro')
  })

  it('returns agency plan for agency user', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_agency' })
    mockGetUserByClerkId.mockResolvedValue({ plan: 'agency' })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('agency')
  })

  it('falls back to free plan on DB error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_123' })
    mockGetUserByClerkId.mockRejectedValue(new Error('DB_ERROR'))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('free')
  })
})
