'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StackUpdatesFeedProps {
  stack: { id: string; name: string } | null
}

// Mock data — sera remplacé par de vraies données plus tard
const MOCK_UPDATES = [
  {
    id: '1',
    type: 'price_drop',
    agent_name: 'Make.com',
    message: 'Prix réduit de 29€ à 19€/mois',
    impact: 'Économie de 10€/mois',
    timestamp: '2h',
    color: '#10b981',
  },
  {
    id: '2',
    type: 'better_alternative',
    agent_name: 'Zapier',
    replacement: 'n8n',
    message: 'Alternative open source disponible',
    impact: 'Économie de 49€/mois + plus de flexibilité',
    timestamp: '1j',
    color: '#3b82f6',
  },
  {
    id: '3',
    type: 'new_integration',
    agent_name: 'Notion AI',
    message: 'Nouvelle intégration Slack disponible',
    impact: 'Automatisation des notes de réunion',
    timestamp: '3j',
    color: '#8b5cf6',
  },
]

export function StackUpdatesFeed({ stack }: StackUpdatesFeedProps) {
  const [expanded, setExpanded] = useState(false)

  if (!stack) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center">
        <p className="text-sm text-zinc-400">Aucune stack active</p>
      </div>
    )
  }

  const visibleUpdates = expanded ? MOCK_UPDATES : MOCK_UPDATES.slice(0, 2)

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Mises à jour
          </p>
          <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse" />
        </div>
        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {MOCK_UPDATES.length} nouvelles
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {visibleUpdates.map((update, i) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 hover:border-[#CAFF32]/20 transition-colors group"
            >
              <div
                className="w-1 h-full rounded-full flex-shrink-0"
                style={{ background: update.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-white mb-0.5">
                  {update.agent_name}
                  {update.replacement && (
                    <span className="text-zinc-500"> → {update.replacement}</span>
                  )}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{update.message}</p>
                <p className="text-[10px] text-[#CAFF32] font-medium">{update.impact}</p>
              </div>
              <span className="text-[9px] text-zinc-400 flex-shrink-0">{update.timestamp}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {MOCK_UPDATES.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-center"
        >
          {expanded ? '↑ Réduire' : `↓ Voir ${MOCK_UPDATES.length - 2} autres`}
        </button>
      )}
    </div>
  )
}
