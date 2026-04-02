'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent, ImplementationStep } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
  streamedCount?: number
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
const catColor = (cat: string) => CATEGORY_COLOR[cat] ?? '#CAFF32'

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, index, color }: { step: ImplementationStep; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="relative"
    >
      {/* Vertical connector line between steps */}
      {index > 0 && (
        <div className="absolute left-[11px] -top-3 w-px h-3"
          style={{ background: 'repeating-linear-gradient(to bottom, #3f3f46 0px, #3f3f46 3px, transparent 3px, transparent 6px)' }} />
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 text-left group"
      >
        {/* Step dot */}
        <div className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{ borderColor: open ? color : '#3f3f46', background: open ? `${color}20` : 'transparent' }}>
          <span className="text-[9px] font-bold" style={{ color: open ? color : '#71717a' }}>{step.step}</span>
        </div>

        <div className="flex-1 min-w-0 pb-2">
          <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors leading-snug">{step.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{step.action}</p>
        </div>

        <span className="text-zinc-600 text-[10px] mt-1 flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-[34px]"
          >
            <div className="pb-3">
              <p className="text-xs text-zinc-400 leading-relaxed mb-2">{step.details}</p>
              {step.tip && (
                <div className="flex gap-2 p-2.5 rounded-lg mt-2"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color }}>💡</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{step.tip}</p>
                </div>
              )}
              {step.source_url && (
                <a href={step.source_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  ↗ Doc officielle
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Agent card (full vertical layout) ───────────────────────────────────────

function AgentCard({ agent, index, total }: { agent: StackAgent; index: number; total: number }) {
  const color = catColor(agent.category)
  const [imgError, setImgError] = useState(false)
  const [copied, setCopied] = useState(false)
  const steps = agent.implementation_steps ?? []
  const isLLM = ['copywriting', 'research', 'coding'].includes(agent.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="relative flex gap-5"
    >
      {/* Left spine */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
        {/* Rank circle */}
        <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10"
          style={{ borderColor: color, background: `${color}15` }}>
          <span className="text-xs font-bold" style={{ color }}>{agent.rank}</span>
        </div>
        {/* Connector to next agent */}
        {index < total - 1 && (
          <div className="flex-1 w-px mt-2"
            style={{ minHeight: 40, background: `linear-gradient(to bottom, ${color}60, transparent)` }} />
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0 pb-10">
        {/* Tool header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
            {agent.website_domain && !imgError ? (
              <img src={getLogoUrl(agent.website_domain)} alt={agent.name}
                className="w-8 h-8 object-contain"
                onError={() => setImgError(true)} />
            ) : (
              <span className="text-base font-bold text-zinc-400">{agent.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base text-white">{agent.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ color, background: `${color}15` }}>
                {agent.category}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/mois`} · Score {agent.score}</p>
          </div>
        </div>

        {/* Role */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{agent.role}</p>

        {/* Concrete result */}
        <div className="rounded-xl p-3 mb-4"
          style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color }}>Résultat</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{agent.concrete_result}</p>
        </div>

        {/* Prompt / guide */}
        {agent.prompt_to_use && (
          <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {isLLM ? 'Prompt' : 'Prise en main'}
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(agent.prompt_to_use); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
                className="text-[10px] px-2.5 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-all">
                {copied ? '✓' : '⎘ Copier'}
              </button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">{agent.prompt_to_use}</p>
          </div>
        )}

        {/* Implementation steps */}
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
            {steps.length > 0 ? `Guide d'implémentation — ${steps.length} étapes` : 'Guide d\'implémentation'}
          </p>
          {steps.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-600"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
              <p className="text-xs text-zinc-600 italic">Génération du guide en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {steps.map((step, i) => (
                <StepCard key={i} step={step} index={i} color={color} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StackRoadmap({ agents, stackName, objective, streamedCount }: Props) {
  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  const visible = streamedCount !== undefined ? sorted.slice(0, streamedCount) : sorted
  const [fullscreen, setFullscreen] = useState(false)

  const inner = (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Roadmap d'implémentation</p>
          <h2 className="text-lg font-semibold text-white">{stackName}</h2>
          <p className="text-sm text-zinc-500 mt-0.5 max-w-xl">{objective}</p>
        </div>
        <button
          onClick={() => setFullscreen(f => !f)}
          className="text-[10px] px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex-shrink-0 ml-4">
          {fullscreen ? '⊠ Réduire' : '⛶ Plein écran'}
        </button>
      </div>

      {/* Agents list */}
      <div className="flex flex-col">
        {visible.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} total={visible.length} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-5 pt-4 border-t border-zinc-800/60 text-xs text-zinc-500 mt-2">
        <span>Total <span className="text-white font-medium">{agents.reduce((s, a) => s + a.price_from, 0)}€/mois</span></span>
        <span>{agents.length} agents</span>
        {streamedCount !== undefined && streamedCount < agents.length && (
          <span className="text-[#CAFF32] animate-pulse">Chargement...</span>
        )}
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-zinc-950 overflow-auto p-10">
        {inner}
      </motion.div>
    )
  }

  return inner
}
