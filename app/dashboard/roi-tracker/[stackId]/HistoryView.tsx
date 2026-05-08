'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, History } from 'lucide-react'
import type { SubscriptionHistoryEntryWithAgent } from '@/types/roi-tracker'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function HistoryEntry({ entry }: { entry: SubscriptionHistoryEntryWithAgent }) {
  const activated = entry.newStatus === true

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
        activated ? 'bg-emerald-500/10' : 'bg-red-500/10'
      }`}>
        {activated ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-900 dark:text-white">
          <span className="font-medium">{entry.agentName}</span>
          {' '}
          <span className={activated ? 'text-emerald-500' : 'text-red-400'}>
            {activated ? 'activated' : 'deactivated'}
          </span>
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3 text-zinc-400" />
          <span className="text-xs text-zinc-400">{formatRelativeTime(entry.changedAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default function HistoryView({ stackId }: { stackId: string }) {
  const [entries, setEntries] = useState<SubscriptionHistoryEntryWithAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchHistory() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/roi-tracker/history/${stackId}`)
        if (!res.ok) throw new Error('Failed to load history')
        const data = await res.json()
        if (!cancelled) setEntries(data)
      } catch (err: any) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchHistory()
    return () => { cancelled = true }
  }, [stackId])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Subscription History
        </h2>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-zinc-300 dark:border-zinc-600 border-t-[#CAFF32] rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Loading history...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <History className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No history yet</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1">
              Activate or deactivate tools to see changes here
            </p>
          </div>
        ) : (
          <div className="px-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            {entries.map(entry => (
              <HistoryEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
