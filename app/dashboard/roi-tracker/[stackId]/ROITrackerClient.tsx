'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react'
import { Link } from '@/lib/i18n/navigation'
import MetricsDisplay from './MetricsDisplay'
import ToolList from './ToolList'
import HistoryView from './HistoryView'
import type { ROIMetrics, ToolWithSubscription } from '@/types/roi-tracker'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function recalcMetrics(tools: ToolWithSubscription[]): ROIMetrics {
  const predictedMonthlyCost = tools.reduce((s, t) => s + (t.price_from ?? 0), 0)
  const actualMonthlyCost = tools.reduce(
    (s, t) => s + (t.subscriptionStatus?.isActive ? (t.price_from ?? 0) : 0),
    0
  )
  return {
    predictedMonthlyCost,
    actualMonthlyCost,
    monthlySavings: predictedMonthlyCost - actualMonthlyCost,
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

function Toast({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: ToastType
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-bottom-2 ${
        type === 'success'
          ? 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
          : 'bg-white dark:bg-zinc-900 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

// ─── ROITrackerClient ─────────────────────────────────────────────────────────

export default function ROITrackerClient({
  stackId,
  clerkToken: _clerkToken,
}: {
  stackId: string
  clerkToken: string
}) {
  const router = useRouter()

  // Data state
  const [tools, setTools] = useState<ToolWithSubscription[]>([])
  const [metrics, setMetrics] = useState<ROIMetrics>({
    predictedMonthlyCost: 0,
    actualMonthlyCost: 0,
    monthlySavings: 0,
  })
  const [stackName, setStackName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Offline state
  const [isOffline, setIsOffline] = useState(false)

  // History refresh trigger
  const [historyKey, setHistoryKey] = useState(0)

  // ─── Offline detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // ─── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/roi-tracker/${stackId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 404) {
          router.push('/dashboard/stack')
          return
        }
        throw new Error(body.error ?? 'Failed to load data')
      }
      const data = await res.json()
      setTools(data.tools ?? [])
      setMetrics(data.metrics ?? { predictedMonthlyCost: 0, actualMonthlyCost: 0, monthlySavings: 0 })
      setStackName(data.stack?.name ?? '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [stackId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Toggle subscription ────────────────────────────────────────────────────
  const handleToggle = useCallback(async (agentId: string, currentStatus: boolean) => {
    if (isOffline) {
      setToast({ message: 'You are offline. Changes cannot be saved.', type: 'error' })
      return
    }
    if (togglingId) return

    const newStatus = !currentStatus
    setTogglingId(agentId)

    // Optimistic update
    setTools(prev =>
      prev.map(t =>
        t.id === agentId
          ? {
              ...t,
              subscriptionStatus: t.subscriptionStatus
                ? { ...t.subscriptionStatus, isActive: newStatus }
                : {
                    id: '',
                    userId: '',
                    agentId,
                    isActive: newStatus,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
            }
          : t
      )
    )
    setMetrics(prev => {
      const tool = tools.find(t => t.id === agentId)
      const cost = tool?.price_from ?? 0
      const delta = newStatus ? cost : -cost
      return {
        ...prev,
        actualMonthlyCost: prev.actualMonthlyCost + delta,
        monthlySavings: prev.monthlySavings - delta,
      }
    })

    try {
      const res = await fetch(`/api/roi-tracker/subscription/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus, stackId }),
      })

      if (!res.ok) {
        throw new Error('Failed to update subscription')
      }

      const data = await res.json()

      // Sync with server response
      setTools(prev =>
        prev.map(t =>
          t.id === agentId
            ? { ...t, subscriptionStatus: data.subscriptionStatus }
            : t
        )
      )

      // Recalculate metrics from fresh tool state
      setTools(current => {
        setMetrics(recalcMetrics(current))
        return current
      })

      const toolName = tools.find(t => t.id === agentId)?.name ?? ''
      setToast({
        message: newStatus
          ? `${toolName} subscription activated`
          : `${toolName} subscription deactivated`,
        type: 'success',
      })

      // Refresh history
      setHistoryKey(k => k + 1)
    } catch (err: any) {
      // Revert optimistic update
      setTools(prev =>
        prev.map(t =>
          t.id === agentId
            ? {
                ...t,
                subscriptionStatus: t.subscriptionStatus
                  ? { ...t.subscriptionStatus, isActive: currentStatus }
                  : undefined,
              }
            : t
        )
      )
      setMetrics(prev => {
        const tool = tools.find(t => t.id === agentId)
        const cost = tool?.price_from ?? 0
        const delta = newStatus ? -cost : cost
        return {
          ...prev,
          actualMonthlyCost: prev.actualMonthlyCost + delta,
          monthlySavings: prev.monthlySavings - delta,
        }
      })
      setToast({ message: err.message ?? 'Failed to update subscription', type: 'error' })
    } finally {
      setTogglingId(null)
    }
  }, [isOffline, togglingId, tools, stackId])

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-700 border-t-[#CAFF32] rounded-full animate-spin" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Offline banner */}
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You are offline. Changes cannot be saved.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/stack"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            ROI Tracker
          </h1>
          {stackName && (
            <p className="text-sm text-zinc-400 mt-0.5">{stackName}</p>
          )}
        </div>
      </div>

      {/* Metrics */}
      <MetricsDisplay metrics={metrics} />

      {/* Tools */}
      <ToolList
        tools={tools}
        onToggle={handleToggle}
        togglingId={togglingId}
      />

      {/* History */}
      <HistoryView key={historyKey} stackId={stackId} />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
