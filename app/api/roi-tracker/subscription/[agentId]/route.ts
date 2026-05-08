import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────────────────────

const subscriptionUpdateSchema = z.object({
  isActive: z.boolean(),
  stackId: z.string().uuid(),
})

// ─── Helper: Get internal user ID from Clerk ID ──────────────────────────────

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

// ─── Helper: Verify agent belongs to user's stack ────────────────────────────

async function verifyAgentInUserStack(
  agentId: string,
  stackId: string,
  internalUserId: string
): Promise<boolean> {
  // Fetch the stack and verify ownership
  const { data: stack, error } = await (supabaseService as any)
    .from('stacks')
    .select('agent_ids')
    .eq('id', stackId)
    .eq('user_id', internalUserId)
    .single()

  if (error || !stack) {
    return false
  }

  // Check if agent is in the stack's agent_ids array
  const agentIds = stack.agent_ids ?? []
  return agentIds.includes(agentId)
}

// ─── PATCH /api/roi-tracker/subscription/[agentId] ───────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    // 1. Validate authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { agentId } = await params

    // 2. Validate UUID format for agentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(agentId)) {
      return NextResponse.json({ error: 'INVALID_AGENT_ID' }, { status: 400 })
    }

    // 3. Parse and validate request body
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    }

    const validation = subscriptionUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'INVALID_DATA', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { isActive, stackId } = validation.data

    // 4. Get internal user ID
    const internalUserId = await getInternalUserId(userId)
    if (!internalUserId) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // 5. Verify agent exists and belongs to user's stack
    const isAgentInStack = await verifyAgentInUserStack(agentId, stackId, internalUserId)
    if (!isAgentInStack) {
      return NextResponse.json(
        { error: 'AGENT_NOT_IN_STACK' },
        { status: 403 }
      )
    }

    // 6. Get current subscription status
    const { data: currentStatus } = await (supabaseService as any)
      .from('subscription_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .single()

    const previousStatus = currentStatus?.is_active ?? false

    // 7. Update or insert subscription status with transaction
    // Note: Supabase doesn't have explicit transactions in the JS client,
    // but we can use upsert which is atomic
    const { data: updatedStatus, error: updateError } = await (supabaseService as any)
      .from('subscription_tracking')
      .upsert(
        {
          user_id: userId,
          agent_id: agentId,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,agent_id',
        }
      )
      .select()
      .single()

    if (updateError) {
      console.error('[PATCH /api/roi-tracker/subscription] Update error:', updateError)
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: updateError.message },
        { status: 500 }
      )
    }

    // 8. Insert history record
    const { error: historyError } = await (supabaseService as any)
      .from('subscription_history')
      .insert({
        user_id: userId,
        agent_id: agentId,
        previous_status: previousStatus,
        new_status: isActive,
        changed_at: new Date().toISOString(),
      })

    if (historyError) {
      console.error('[PATCH /api/roi-tracker/subscription] History insert error:', historyError)
      // Don't fail the request if history insert fails, but log it
      // The main update succeeded, which is what matters most
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      subscriptionStatus: {
        id: updatedStatus.id,
        userId: updatedStatus.user_id,
        agentId: updatedStatus.agent_id,
        isActive: updatedStatus.is_active,
        createdAt: updatedStatus.created_at,
        updatedAt: updatedStatus.updated_at,
      },
    })
  } catch (err) {
    console.error('[PATCH /api/roi-tracker/subscription] Internal error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
