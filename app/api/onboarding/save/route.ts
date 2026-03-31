import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { stepKey: string; value: string | null; stepIndex: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { stepKey, value, stepIndex } = body

  const allowedKeys = ['role', 'sector', 'team_size', 'budget', 'main_goal', 'referral_source']
  if (!allowedKeys.includes(stepKey)) {
    return NextResponse.json({ error: 'Invalid step key' }, { status: 400 })
  }

  const { error } = await (supabaseService as any)
    .from('users')
    .update({ [stepKey]: value, onboarding_step: stepIndex + 1 })
    .eq('clerk_id', userId)

  if (error) {
    console.error('[onboarding/save] Supabase error:', error)
    return NextResponse.json({ error: 'Failed to save step' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
