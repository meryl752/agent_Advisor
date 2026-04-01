import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { getToken } = await auth()
    let user = null
    try { user = await currentUser() } catch { /* ignore */ }
    if (!user) return NextResponse.json({ stacks: [] })

    const clerkToken = await getToken({ template: 'supabase' }) ?? ''
    const userEmail = user.emailAddresses[0]?.emailAddress
    const stacks = await getUserStacks(user.id, clerkToken, userEmail)

    return NextResponse.json({ stacks })
  } catch {
    return NextResponse.json({ stacks: [] })
  }
}
