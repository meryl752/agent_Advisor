import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'
import { uuidSchema, feedbackSchema } from '@/lib/validators/api'

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users').select('id').eq('clerk_id', clerkId).single()
  return data?.id ?? null
}

// GET — fetch existing feedback for this stack
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id: stackId } = await params

  // Validate UUID
  const idValidation = uuidSchema.safeParse(stackId)
  if (!idValidation.success) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  const internalId = await getInternalUserId(userId)
  if (!internalId) return NextResponse.json({ feedback: null })

  const { data } = await (supabaseService as any)
    .from('stack_feedback')
    .select('*')
    .eq('stack_id', stackId)
    .eq('user_id', internalId)
    .single()

  return NextResponse.json({ feedback: data ?? null })
}

// POST — upsert feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { id: stackId } = await params

    // Validate UUID
    const idValidation = uuidSchema.safeParse(stackId)
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })

    // Validate feedback data with Zod
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.errors,
      }, { status: 400 })
    }

    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const { data, error } = await (supabaseService as any)
      .from('stack_feedback')
      .upsert({
        stack_id: stackId,
        user_id: internalId,
        stack_rating: validation.data.stack_rating ?? null,
        stack_comment: validation.data.stack_comment ?? null,
        agent_ratings: validation.data.agent_ratings ?? [],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stack_id,user_id' })
      .select()
      .single()

    if (error) {
      console.error('Feedback upsert error:', error.message)
      return NextResponse.json({ error: 'Sauvegarde échouée' }, { status: 500 })
    }

    return NextResponse.json({ success: true, feedback: data })
  } catch (err) {
    console.error('POST /api/stacks/[id]/feedback:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
