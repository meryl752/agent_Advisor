'use client'

import { Wrench } from 'lucide-react'
import ToolCard from './ToolCard'
import type { ToolWithSubscription } from '@/types/roi-tracker'

export default function ToolList({
  tools,
  onToggle,
  togglingId,
}: {
  tools: ToolWithSubscription[]
  onToggle: (agentId: string, currentStatus: boolean) => void
  togglingId?: string | null
}) {
  const activeCount = tools.filter(t => t.subscriptionStatus?.isActive).length

  if (tools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <Wrench className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          No tools in this stack
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Stack Tools
        </h2>
        <span className="text-xs text-zinc-400">
          {activeCount}/{tools.length} active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map(tool => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onToggle={onToggle}
            isToggling={togglingId === tool.id}
          />
        ))}
      </div>
    </div>
  )
}
