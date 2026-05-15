import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { searchAgents } from '@/lib/supabase/queries'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) return NextResponse.json({ agents: [] })

    const agents = await searchAgents(query)
    return NextResponse.json({ agents })
  } catch (err) {
    console.error('GET /api/agents/search:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
