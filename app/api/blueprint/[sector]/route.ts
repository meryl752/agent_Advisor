import { NextRequest, NextResponse } from 'next/server'
import { getSector } from '@/lib/blueprint/sectors'
import { getAgentsByCategories } from '@/lib/supabase/queries'
import type { Agent } from '@/lib/supabase/types'
import type { BlueprintTask, SectorConfig } from '@/lib/blueprint/sectors'

export interface BlueprintTaskWithAgents extends BlueprintTask {
  agents: Agent[]
}

export interface BlueprintApiResponse {
  sector: SectorConfig
  tasks: BlueprintTaskWithAgents[]
  coverage: {
    score: number
    covered: number
    total: number
  }
}

function matchAgentsToTask(task: BlueprintTask, agents: Agent[]): Agent[] {
  return agents.filter(agent => {
    const categoryMatch = agent.category === task.category
    const useCaseMatch =
      Array.isArray(agent.use_cases) &&
      task.use_cases.some(uc => agent.use_cases.includes(uc))
    return categoryMatch || useCaseMatch
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sector: string }> }
) {
  const { sector: sectorSlug } = await params
  const sector = getSector(sectorSlug)

  if (!sector) {
    return NextResponse.json({ error: 'Sector not found' }, { status: 404 })
  }

  try {
    // Collect all unique categories from this sector's tasks
    const categories = [...new Set(sector.tasks.map(t => t.category))]
    const agents = await getAgentsByCategories(categories)

    // Map agents to each task
    const tasks: BlueprintTaskWithAgents[] = sector.tasks.map(task => ({
      ...task,
      agents: matchAgentsToTask(task, agents),
    }))

    // Compute coverage score
    const covered = tasks.filter(t => t.agents.length > 0).length
    const total = tasks.length
    const score = total > 0 ? Math.round((covered / total) * 100) : 0

    const response: BlueprintApiResponse = {
      sector,
      tasks,
      coverage: { score, covered, total },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[blueprint API] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
