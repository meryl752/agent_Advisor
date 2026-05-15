'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/lib/i18n/navigation'
import type { StackUpdateEvent } from '@/lib/supabase/types'

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

function formatRelativeFr(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.round((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'à l’instant'
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 48) return `il y a ${h} h`
  const days = Math.floor(h / 24)
  if (days < 14) return `il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const TYPE_COLORS: Record<string, string> = {
  price_drop: '#10b981',
  better_alternative: '#3b82f6',
  new_integration: '#8b5cf6',
  digest: '#CAFF32',
  info: '#71717a',
}

interface StackUpdatesFeedProps {
  /** Nombre de stacks côté serveur (pour message si props mal sérialisées). */
  stackCount: number
  /** Stack de référence (suivi si dispo, sinon le plus récent) — objet minimal pour RSC → client. */
  anchorStack: { id: string; name: string } | null
  trackedStack: TrackedStackSummary | null
  nextDigestLabel: string | null
  initialUpdates: StackUpdateEvent[]
}

export function StackUpdatesFeed({
  stackCount,
  anchorStack,
  trackedStack,
  nextDigestLabel,
  initialUpdates,
}: StackUpdatesFeedProps) {
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
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-zinc-400">
          {stackCount > 0
            ? 'Les infos du stack n’ont pas été reçues. Rafraîchis la page (F5).'
            : 'Aucun stack pour l’instant.'}
        </p>
        {stackCount > 0 && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-[#CAFF32] hover:underline"
          >
            Recharger
          </button>
        )}
      </div>
    )
  }

  const unread = updates.filter((u) => !u.read_at).length

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
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
                Stack suivi : <span className="text-zinc-700 dark:text-zinc-300">{trackedStack.name}</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-600/90 dark:text-amber-400/90">
                Aucun stack suivi — active le suivi dans Mes stacks
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
            <div className="px-6 pb-6 flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {!trackedStack && (
                <>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Les alertes porteront sur le stack que tu marques comme <strong className="text-zinc-700 dark:text-zinc-300">suivi</strong> (un seul à la fois).
                  </p>
                  <Link
                    href="/dashboard/stack"
                    className="inline-flex self-start text-xs font-semibold px-3 py-2 rounded-lg bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-colors"
                  >
                    Mes stacks →
                  </Link>
                </>
              )}

              {trackedStack && nextDigestLabel && (
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-400 uppercase tracking-wider">Prochain digest (estimé)</span>
                  <br />
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 capitalize">{nextDigestLabel}</span>
                </p>
              )}

              {trackedStack && updates.length === 0 && (
                <p className="text-xs text-zinc-500 leading-relaxed border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-3">
                  Aucune entrée pour l’instant. Active le suivi ou attends le prochain job digest — les événements s’affichent ici.
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
                    className="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 hover:border-[#CAFF32]/20 transition-colors"
                  >
                    <div className="w-1 self-stretch min-h-[2.5rem] rounded-full flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-white mb-0.5">{update.title}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{update.body}</p>
                      {impact && <p className="text-[10px] text-[#CAFF32] font-medium">{impact}</p>}
                    </div>
                    <span className="text-[9px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
                      {formatRelativeFr(update.created_at)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
