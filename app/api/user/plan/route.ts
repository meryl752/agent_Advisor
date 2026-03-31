import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await getUserByClerkId(userId)
    const plan = (user as any)?.plan ?? 'free'

    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ plan: 'free' })
  }
}
