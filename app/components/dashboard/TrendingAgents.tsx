'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface Agent {
  name: string
  category: string
  score: number
}

interface TrendingAgentsProps {
  agents: Agent[]
}

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'copywriting', label: 'Rédaction' },
  { id: 'automation', label: 'Automation' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'image', label: 'Image' },
  { id: 'research', label: 'Recherche' },
  { id: 'prospecting', label: 'Prospection' },
]

const CATEGORY_COLORS: Record<string, string> = {
  copywriting:     '#f59e0b',
  automation:      '#3b82f6',
  analytics:       '#8b5cf6',
  image:           '#ec4899',
  research:        '#06b6d4',
  prospecting:     '#10b981',
  customer_service:'#f97316',
  seo:             '#84cc16',
  video:           '#ef4444',
  coding:          '#6366f1',
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-[#CAFF32]"
        />
      </div>
      <span className="text-xs font-semibold text-zinc-900 dark:text-white w-8 text-right">{score}</span>
    </div>
  )
}

export function TrendingAgents({ agents }: TrendingAgentsProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = activeCategory === 'all'
    ? agents
    : agents.filter(a => a.category === activeCategory)

  // Only show categories that have agents
  const availableCategories = CATEGORIES.filter(c =>
    c.id === 'all' || agents.some(a => a.category === c.id)
  )

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Tendances
          </p>
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            Meilleurs outils du moment
          </p>
        </div>
        <Link href="/dashboard/score" className="text-[10px] text-zinc-500 hover:text-[#CAFF32] transition-colors">
          Voir tout →
        </Link>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {availableCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-[10px] font-medium px-3 py-1 rounded-full border transition-all ${
              activeCategory === cat.id
                ? 'bg-[#CAFF32] text-zinc-900 border-[#CAFF32]'
                : 'text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Agents list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">Aucun outil dans cette catégorie</p>
        ) : (
          filtered.map((agent, i) => (
            <motion.div
              key={`${agent.name}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-4"
            >
              {/* Rank */}
              <span className="text-[10px] font-mono text-zinc-400 w-4 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Logo placeholder */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-zinc-900"
                style={{ background: CATEGORY_COLORS[agent.category] ?? '#CAFF32' }}
              >
                {agent.name.charAt(0)}
              </div>

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{agent.name}</p>
                <p className="text-[10px] text-zinc-500 capitalize">{agent.category}</p>
              </div>

              {/* Score bar */}
              <div className="w-28 flex-shrink-0">
                <ScoreBar score={agent.score} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

// Need Link for the "Voir tout" button
import Link from 'next/link'
