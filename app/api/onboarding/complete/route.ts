import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/server'
import { callLLM } from '@/lib/llm/router'

const FALLBACK_MESSAGE =
  "Welcome! We've identified 3 quick wins to help you get started. Your personalized stack is ready."

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let answers: Record<string, string | null> = {}
  try {
    const body = await req.json()
    answers = body.answers ?? {}
  } catch {
    // proceed with empty answers
  }

  // Mark onboarding as completed
  const { error } = await (supabaseService as any)
    .from('users')
    .update({ onboarding_completed: true })
    .eq('clerk_id', userId)

  if (error) {
    console.error('[onboarding/complete] Supabase error:', error)
    return NextResponse.json({ message: FALLBACK_MESSAGE })
  }

  // Generate personalized welcome message with 5s timeout
  const prompt = `You are a personalized AI advisor. Write a 2-sentence welcome message for a new user.
Their profile: Role: ${answers.role ?? 'professional'}, Sector: ${answers.sector ?? 'business'}, Budget: ${answers.budget ?? 'flexible'}, Goal: ${answers.main_goal ?? 'grow their business'}.
Mention their sector, acknowledge their budget, and reference exactly 3 quick wins they can achieve.
Be warm, specific, and under 60 words.`

  let message = FALLBACK_MESSAGE
  try {
    message = await Promise.race([
      callLLM(prompt, 150),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), 5000)
      ),
    ])
  } catch (err) {
    console.error('[onboarding/complete] LLM error:', err instanceof Error ? err.message : err)
    message = FALLBACK_MESSAGE
  }

  return NextResponse.json({ message })
}
