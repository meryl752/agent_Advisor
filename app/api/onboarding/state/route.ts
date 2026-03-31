import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await (supabaseService as any)
    .from('users')
    .select('role, sector, team_size, budget, main_goal, referral_source, onboarding_step, onboarding_completed')
    .eq('clerk_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json({})
  }

  return NextResponse.json(data)
}
