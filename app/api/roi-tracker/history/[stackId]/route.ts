import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'
import { SubscriptionHistoryEntryWithAgent } from '@/types/roi-tracker'

// ─── Helper: Get internal user ID from Clerk ID ──────────────────────────────

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

// ─── GET /api/roi-tracker/history/[stackId] ──────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ stackId: string }> }
) {
  try {
    // 1. Validate authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { stackId } = await params

    // 2. Get internal user ID
    const internalUserId = await getInternalUserId(userId)
    if (!internalUserId) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // 3. Fetch the stack and verify ownership
    const { data: stack, error: stackError } = await (supabaseService as any)
      .from('stacks')
      .select('id, agent_ids')
      .eq('id', stackId)
      .eq('user_id', internalUserId)
      .single()

    if (stackError || !stack) {
      console.error('[GET /api/roi-tracker/history] Stack not found:', stackError)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // 4. Get agent IDs from the stack
    const agentIds = stack.agent_ids ?? []

    // Handle empty stack case - return empty history
    if (agentIds.length === 0) {
      return NextResponse.json([])
    }

    // 5. Fetch subscription history for the user's agents in this stack
    // Join with agents table to get agent names
    const { data: historyEntries, error: historyError } = await (supabaseService as any)
      .from('subscription_history')
      .select(`
        id,
        user_id,
        agent_id,
        previous_status,
        new_status,
        changed_at,
        agents!inner (
          name
        )
      `)
      .eq('user_id', userId)
      .in('agent_id', agentIds)
      .order('changed_at', { ascending: false })
      .limit(50)

    if (historyError) {
      console.error('[GET /api/roi-tracker/history] Error fetching history:', historyError)
      return NextResponse.json({ error: 'DATABASE_ERROR' }, { status: 500 })
    }

    // 6. Transform the data to include agent name at the top level
    const formattedHistory: SubscriptionHistoryEntryWithAgent[] = (historyEntries ?? []).map((entry: any) => ({
      id: entry.id,
      userId: entry.user_id,
      agentId: entry.agent_id,
      previousStatus: entry.previous_status,
      newStatus: entry.new_status,
      changedAt: entry.changed_at,
      agentName: entry.agents?.name ?? 'Unknown Tool',
    }))

    // 7. Return the history (empty array if no entries)
    return NextResponse.json(formattedHistory)
  } catch (err) {
    console.error('[GET /api/roi-tracker/history] Internal error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
