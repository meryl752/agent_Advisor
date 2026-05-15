import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { uuidSchema } from '@/lib/validators/api'
import { getStackUpdateEvents } from '@/lib/supabase/queries'

// ─── GET /api/stacks/[id]/updates ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    const url = new URL(req.url)
    const raw = parseInt(url.searchParams.get('limit') ?? '30', 10)
    const limit = Number.isFinite(raw) ? Math.min(100, Math.max(1, raw)) : 30

    let email: string | undefined
    try {
      const user = await currentUser()
      email = user?.emailAddresses[0]?.emailAddress
    } catch {
      /* optional */
    }

    const updates = await getStackUpdateEvents(id, userId, email, limit)
    return NextResponse.json({ updates })
  } catch (err) {
    console.error('GET /api/stacks/[id]/updates:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
