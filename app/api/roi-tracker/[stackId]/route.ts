import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseService } from '@/lib/supabase/server'
import { ROIMetrics, ToolWithSubscription } from '@/types/roi-tracker'

// ─── Helper: Get internal user ID from Clerk ID ──────────────────────────────

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const { data } = await (supabaseService as any)
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()
  return data?.id ?? null
}

// ─── Helper: Calculate ROI Metrics ───────────────────────────────────────────

function calculateMetrics(tools: ToolWithSubscription[]): ROIMetrics {
  // Calculate predicted monthly cost (sum of all tools)
  const predictedMonthlyCost = tools.reduce((sum, tool) => {
    return sum + (tool.price_from ?? 0)
  }, 0)

  // Calculate actual monthly cost (sum of active tools only)
  const actualMonthlyCost = tools.reduce((sum, tool) => {
    const isActive = tool.subscriptionStatus?.isActive ?? false
    return sum + (isActive ? (tool.price_from ?? 0) : 0)
  }, 0)

  // Calculate monthly savings
  const monthlySavings = predictedMonthlyCost - actualMonthlyCost

  return {
    predictedMonthlyCost,
    actualMonthlyCost,
    monthlySavings,
    // ROI calculations can be added later if needed
    predictedROI: undefined,
    actualROI: undefined,
    roiDifference: undefined,
  }
}

// ─── GET /api/roi-tracker/[stackId] ──────────────────────────────────────────

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
      .select('id, name, objective, agent_ids, total_cost, roi_estimate')
      .eq('id', stackId)
      .eq('user_id', internalUserId)
      .single()

    if (stackError || !stack) {
      console.error('[GET /api/roi-tracker] Stack not found:', stackError)
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // 4. Fetch agents from the stack
    const agentIds = stack.agent_ids ?? []
    
    // Handle empty stack case
    if (agentIds.length === 0) {
      return NextResponse.json({
        stack: {
          id: stack.id,
          name: stack.name,
          objective: stack.objective,
        },
        tools: [],
        metrics: {
          predictedMonthlyCost: 0,
          actualMonthlyCost: 0,
          monthlySavings: 0,
        },
      })
    }

    // 5. Fetch agent details
    const { data: agents, error: agentsError } = await (supabaseService as any)
      .from('agents')
      .select('id, name, description, category, score, pricing_model, price_from, url, logo_url, website_url, website_domain')
      .in('id', agentIds)

    if (agentsError) {
      console.error('[GET /api/roi-tracker] Error fetching agents:', agentsError)
      return NextResponse.json({ error: 'DATABASE_ERROR' }, { status: 500 })
    }

    // 6. Fetch subscription statuses for these agents
    const { data: subscriptions, error: subscriptionsError } = await (supabaseService as any)
      .from('subscription_tracking')
      .select('*')
      .eq('user_id', userId)
      .in('agent_id', agentIds)

    if (subscriptionsError) {
      console.error('[GET /api/roi-tracker] Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json({ error: 'DATABASE_ERROR' }, { status: 500 })
    }

    // 7. Create a map of agent_id -> subscription status for quick lookup
    const subscriptionMap = new Map(
      (subscriptions ?? []).map((sub: any) => [sub.agent_id, sub])
    )

    // 8. Combine agents with their subscription status
    const tools: ToolWithSubscription[] = (agents ?? []).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      score: agent.score ?? 0,
      pricing_model: agent.pricing_model ?? 'freemium',
      price_from: agent.price_from ?? 0,
      url: agent.url || agent.website_url || (agent.website_domain ? `https://${agent.website_domain}` : ''),
      logo_url: agent.logo_url,
      roi_score: 0, // Default value
      use_cases: [],
      compatible_with: [],
      last_updated: new Date().toISOString(),
      subscriptionStatus: subscriptionMap.get(agent.id) || undefined,
    }))

    // 9. Calculate metrics
    const metrics = calculateMetrics(tools)

    // 10. Return the combined data
    return NextResponse.json({
      stack: {
        id: stack.id,
        name: stack.name,
        objective: stack.objective,
      },
      tools,
      metrics,
    })
  } catch (err) {
    console.error('[GET /api/roi-tracker] Internal error:', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
