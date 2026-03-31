import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await (supabaseService as any)
    .from('users')
    .update({ onboarding_completed: false, onboarding_step: 0 })
    .eq('clerk_id', userId)

  if (error) {
    console.error('[onboarding/reset] Supabase error:', error)
    return NextResponse.json({ error: 'Failed to reset onboarding' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
