'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
}

const CATEGORY_COLOR: Record<string, string> = {
  copywriting:      '#A78BFA',
  automation:       '#38bdf8',
  analytics:        '#FBBF24',
  customer_service: '#34D399',
  seo:              '#FB923C',
  prospecting:      '#F87171',
  coding:           '#22D3EE',
  research:         '#818CF8',
  image:            '#F472B6',
  video:            '#E879F9',
}

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat] ?? '#CAFF32'
}

function DifficultyBadge({ level }: { level?: string }) {
  const map: Record<string, { label: string; color: string }> = {
    easy:   { label: 'Facile',       color: '#34D399' },
    medium: { label: 'Intermédiaire', color: '#FBBF24' },
    hard:   { label: 'Avancé',       color: '#F87171' },
  }
  const d = map[level ?? ''] ?? { label: level ?? '—', color: '#71717a' }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full border"
      style={{ color: d.color, borderColor: `${d.color}40`, background: `${d.color}10` }}>
      {d.label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all"
    >
      {copied ? '✓ Copié' : '⎘ Copier le prompt'}
    </button>
  )
}

function AgentNode({ agent, index, total, isActive, onClick }: {
  agent: StackAgent
  index: number
  total: number
  isActive: boolean
  onClick: () => void
}) {
  const color = categoryColor(agent.category)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative flex items-start gap-4 cursor-pointer group"
      onClick={onClick}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
        {/* Step circle */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 relative transition-all"
          style={{
            borderColor: isActive ? color : `${color}50`,
            background: isActive ? `${color}20` : 'transparent',
            boxShadow: isActive ? `0 0 16px ${color}40` : 'none',
          }}
        >
          <span className="text-xs font-bold" style={{ color }}>{agent.rank}</span>
        </motion.div>
        {/* Connector line */}
        {index < total - 1 && (
          <div className="w-px flex-1 mt-1" style={{ minHeight: 32, background: `linear-gradient(to bottom, ${color}60, transparent)` }} />
        )}
      </div>

      {/* Card */}
      <motion.div
        layout
        className="flex-1 mb-6 rounded-xl border transition-all overflow-hidden"
        style={{
          borderColor: isActive ? `${color}60` : 'rgba(255,255,255,0.07)',
          background: isActive ? `${color}08` : 'rgba(255,255,255,0.03)',
        }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 p-4">
          {/* Logo */}
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {agent.website_domain && !imgError ? (
              <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
                className="w-5 h-5 object-contain"
                onError={() => setImgError(true)} />
            ) : (
              <span className="text-xs font-bold text-zinc-400">{agent.name[0]}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white">{agent.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ color, background: `${color}15` }}>
                {agent.category}
              </span>
              <DifficultyBadge level={agent.setup_difficulty} />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{agent.role}</p>
          </div>

          <div className="flex flex-col items-end flex-shrink-0 gap-1">
            <span className="text-sm font-semibold" style={{ color }}>{agent.score}</span>
            <span className="text-[10px] text-zinc-600">score</span>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 flex flex-col gap-4 border-t border-zinc-800/60 pt-4">

                {/* Concrete result */}
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 flex-shrink-0">Résultat</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{agent.concrete_result}</p>
                </div>

                {/* Why this tool */}
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 flex-shrink-0">Pourquoi</span>
                  <p className="text-sm text-zinc-400 leading-relaxed">{agent.reason}</p>
                </div>

                {/* Prompt */}
                {agent.prompt_to_use && (
                  <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Prompt à utiliser</span>
                      <CopyButton text={agent.prompt_to_use} />
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">{agent.prompt_to_use}</p>
                  </div>
                )}

                {/* Meta */}
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>À partir de <span className="text-white">{agent.price_from}€/mois</span></span>
                  {agent.time_to_value && <span>Résultats en <span className="text-white">{agent.time_to_value}</span></span>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand hint */}
        {!isActive && (
          <div className="px-4 pb-3">
            <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
              Cliquer pour voir le détail + prompt →
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function StackRoadmap({ agents, stackName, objective }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0)
  const sorted = [...agents].sort((a, b) => a.rank - b.rank)

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Roadmap d'implémentation</p>
        <h2 className="text-lg font-semibold text-white">{stackName}</h2>
        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{objective}</p>
      </div>

      {/* SVG connector line (background) */}
      <div className="relative">
        {sorted.map((agent, i) => (
          <AgentNode
            key={agent.id}
            agent={agent}
            index={i}
            total={sorted.length}
            isActive={activeIndex === i}
            onClick={() => setActiveIndex(activeIndex === i ? null : i)}
          />
        ))}
      </div>

      {/* Summary footer */}
      <div className="flex gap-6 pt-2 border-t border-zinc-800 text-sm">
        <div>
          <span className="text-zinc-500 text-xs">Coût total</span>
          <p className="text-white font-semibold">
            {agents.reduce((s, a) => s + a.price_from, 0)}€/mois
          </p>
        </div>
        <div>
          <span className="text-zinc-500 text-xs">Outils</span>
          <p className="text-white font-semibold">{agents.length} agents</p>
        </div>
      </div>
    </div>
  )
}
