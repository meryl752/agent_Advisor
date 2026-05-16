'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/i18n/navigation'
import type { StackUpdateEvent } from '@/lib/supabase/types'
import { overviewCardClass } from '@/lib/ui/overview-card'

export type TrackedStackSummary = {
  id: string
  name: string
  digest_enabled_at?: string | null
}

function metaImpact(meta: StackUpdateEvent['meta']): string | null {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null
  const m = meta as Record<string, unknown>
  return typeof m.impact === 'string' ? m.impact : null
}

function formatRelativeEn(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.round((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 48) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 14) return `${days}d ago`
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const TYPE_COLORS: Record<string, string> = {
  price_drop: '#10b981',
  better_alternative: '#3b82f6',
  new_integration: '#8b5cf6',
  digest: '#CAFF32',
  info: '#71717a',
}

interface StackUpdatesFeedProps {
  stackCount: number
  anchorStack: { id: string; name: string } | null
  trackedStack: TrackedStackSummary | null
  nextDigestLabel: string | null
  initialUpdates: StackUpdateEvent[]
  polished?: boolean
}

export function StackUpdatesFeed({
  stackCount,
  anchorStack,
  trackedStack,
  nextDigestLabel,
  initialUpdates,
  polished,
}: StackUpdatesFeedProps) {
  const shell = polished
    ? overviewCardClass
    : 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50'
  const [isOpen, setIsOpen] = useState(false)
  const [updates, setUpdates] = useState<StackUpdateEvent[]>(initialUpdates)

  const updatesStackId = trackedStack?.id ?? anchorStack?.id ?? null

  useEffect(() => {
    setUpdates(initialUpdates)
  }, [initialUpdates])

  useEffect(() => {
    if (!isOpen || !updatesStackId) return
    const ac = new AbortController()
    fetch(`/api/stacks/${updatesStackId}/updates?limit=30`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (Array.isArray(j.updates)) setUpdates(j.updates)
      })
      .catch(() => {})
    return () => ac.abort()
  }, [isOpen, updatesStackId])

  if (!anchorStack) {
    return (
      <motion.div className={`${shell} p-6 flex flex-col items-center justify-center gap-2 text-center`}>
        <p className="text-sm text-zinc-400">
          {stackCount > 0
            ? 'Stack info did not load. Refresh the page (F5).'
            : 'No stacks yet.'}
        </p>
        {stackCount > 0 && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-[#CAFF32] hover:underline"
          >
            Reload
          </button>
        )}
      </motion.div>
    )
  }

  const unread = updates.filter((u) => !u.read_at).length

  return (
    <motion.div className={shell}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-600 dark:text-zinc-400"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 bg-[#CAFF32] rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-900">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-zinc-900 dark:text-white">Updates</span>
            {trackedStack ? (
              <span className="text-[11px] text-zinc-500 line-clamp-1">
                Tracked stack:{' '}
                <span className="text-zinc-700 dark:text-zinc-300">{trackedStack.name}</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90">
                No tracked stack — enable tracking in My Stacks
              </span>
            )}
          </div>
        </div>

        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400 flex-shrink-0"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 flex flex-col gap-3 border-t border-zinc-100/60 dark:border-zinc-800 pt-4">
              {!trackedStack && (
                <>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Alerts apply to the stack you mark as{' '}
                    <strong className="text-zinc-700 dark:text-zinc-300">tracked</strong> (one at a
                    time).
                  </p>
                  <Link
                    href="/dashboard/stack"
                    className="inline-flex self-start text-xs font-semibold px-3 py-2 rounded-lg bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-colors"
                  >
                    My Stacks →
                  </Link>
                </>
              )}

              {trackedStack && nextDigestLabel && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-400 uppercase tracking-wider">Next digest (estimated)</span>
                  <br />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                    {nextDigestLabel}
                  </span>
                </p>
              )}

              {trackedStack && updates.length === 0 && (
                <p className="text-xs text-zinc-500 leading-relaxed border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-3">
                  No entries yet. Enable tracking or wait for the next digest job — events will show
                  up here.
                </p>
              )}

              {updates.map((update, i) => {
                const color = TYPE_COLORS[update.type] ?? TYPE_COLORS.info
                const impact = metaImpact(update.meta)
                return (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border-0 shadow-sm dark:border dark:border-zinc-800/60 hover:shadow-md dark:hover:border-[#CAFF32]/20 transition-all"
                  >
                    <motion.div
                      className="w-1 self-stretch min-h-[2.5rem] rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white mb-0.5">
                        {update.title}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{update.body}</p>
                      {impact && <p className="text-[10px] text-[#CAFF32] font-medium">{impact}</p>}
                    </div>
                    <span className="text-[9px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
                      {formatRelativeEn(update.created_at)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
