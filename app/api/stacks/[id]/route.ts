import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'
import { uuidSchema, stackPatchSchema } from '@/lib/validators/api'

// ─── Helper: verify stack belongs to user ────────────────────────────────────

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

// ─── GET /api/stacks/[id] ─────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { id } = await params

    const idValidation = uuidSchema.safeParse(id)
    if (!idValidation.success) return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })

    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

    // Fetch the stack
    const { data: stack, error } = await (supabaseService as any)
      .from('stacks')
      .select('*')
      .eq('id', id)
      .eq('user_id', internalId)
      .single()

    if (error || !stack) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    // Fetch agent details
    const agentIds = stack.agent_ids ?? []
    let agents: any[] = []
    if (agentIds.length > 0) {
      const { data: agentData } = await (supabaseService as any)
        .from('agents')
        .select('id, name, description, url, category, pricing, score')
        .in('id', agentIds)
      agents = agentData ?? []
    }

    // Reconstruct a FinalStack-compatible object
    const finalStack = {
      stack_name: stack.name,
      justification: stack.objective ?? '',
      total_cost: stack.total_cost ?? 0,
      roi_estimate: stack.roi_estimate ?? 0,
      time_saved_per_week: 0,
      quick_wins: [],
      warnings: [],
      subtasks: [],
      agents: agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        role: a.description ?? a.category ?? '',
        url: a.url ?? '',
        pricing: a.pricing ?? 'freemium',
        score: a.score ?? 0,
        why_selected: '',
        implementation_steps: [],
        subtasks: [],
      })),
    }

    return NextResponse.json({ stack: finalStack, stackId: stack.id, objective: stack.objective })
  } catch (err) {
    console.error('GET /api/stacks/[id]:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── DELETE /api/stacks/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { id } = await params

    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

    const { error } = await (supabaseService as any)
      .from('stacks')
      .delete()
      .eq('id', id)
      .eq('user_id', internalId) // security: only delete own stacks

    if (error) {
      console.error('Delete stack error:', error.message)
      return NextResponse.json({ error: 'DELETE_FAILED' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/stacks/[id]:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PATCH /api/stacks/[id] ──────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const { id } = await params

    // Validate UUID format
    const idValidation = uuidSchema.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })

    // Validate body with Zod
    const validation = stackPatchSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'INVALID_DATA', details: validation.error.errors }, { status: 400 })
    }

    const internalId = await getInternalUserId(userId)
    if (!internalId) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

    const { data, error } = await (supabaseService as any)
      .from('stacks')
      .update({ name: validation.data.name })
      .eq('id', id)
      .eq('user_id', internalId) // security: only update own stacks
      .select()
      .single()

    if (error) {
      console.error('Update stack error:', error.message)
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 })
    }

    return NextResponse.json({ success: true, stack: data })
  } catch (err) {
    console.error('PATCH /api/stacks/[id]:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
