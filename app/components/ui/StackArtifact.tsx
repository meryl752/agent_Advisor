'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StackAgent, ImplementationStep } from '@/lib/agents/types'
import { getLogoUrl } from '@/lib/utils/logo'
import { IconExternalLink, IconCopy, IconCheck, IconBell, IconBellOff, IconShare, IconRefresh, IconBolt, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

interface Props {
  agents: StackAgent[]
  stackName: string
  objective: string
  totalCost: number
  roiEstimate: number
  timeSaved: number
  streamedCount?: number
  stackId?: string
  onRegenerate?: () => void
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

function ToolLogo({ agent }: { agent: StackAgent }) {
  const [err, setErr] = useState(false)
  
  // Use logo_url if available, otherwise generate from website_domain
  const logoSrc = agent.logo_url || (agent.website_domain ? getLogoUrl(agent.website_domain) : '')
  
  if (logoSrc && !err) {
    return (
      <img src={logoSrc} alt={agent.name}
        className="w-9 h-9 object-contain" onError={() => setErr(true)} />
    )
  }
  return <span className="text-sm font-bold text-zinc-400">{agent.name[0]}</span>
}

function StepRow({ step, index, color }: { step: ImplementationStep; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-3"
    >
      {/* Timeline vertical line + badge */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Step number badge */}
        <div 
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all text-xs font-semibold border z-10 bg-white dark:bg-zinc-950"
          style={{ 
            borderColor: open ? 'rgba(161,161,170,0.4)' : 'rgba(161,161,170,0.2)',
            color: open ? '#3f3f46' : '#a1a1aa'
          }}
        >
          {step.step}
        </div>
        
        {/* Vertical timeline line - only if not last step */}
        <div 
          className="w-px flex-1 mt-1"
          style={{ 
            background: 'linear-gradient(to bottom, rgba(161,161,170,0.2) 0%, rgba(161,161,170,0.1) 50%, rgba(161,161,170,0.05) 100%)'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <button 
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-start gap-3 p-3 text-left group rounded-lg transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {step.title}
              </span>
              {step.source_url && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  Doc
                </span>
              )}
            </div>
          </div>
          
          {/* Chevron */}
          <div className="flex-shrink-0 mt-0.5">
            {open ? <IconChevronUp size={14} className="text-zinc-400" />
                   : <IconChevronDown size={14} className="text-zinc-400" />}
          </div>
        </button>
        
        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2 pt-1">
                {/* Details - styled border with beveled corners */}
                <div 
                  className="p-3 mb-2 bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden"
                  style={{
                    clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                    border: '1px solid rgba(161,161,170,0.2)'
                  }}
                >
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {step.details}
                  </p>
                </div>
                
                {/* Documentation link */}
                {step.source_url && (
                  <a 
                    href={step.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    style={{
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                    }}
                  >
                    <IconExternalLink size={12} />
                    Voir la documentation
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function StackArtifact({
  agents, stackName, objective, totalCost, roiEstimate, timeSaved,
  streamedCount, stackId, onRegenerate
}: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [alertsActive, setAlertsActive] = useState(false)
  const [copied, setCopied] = useState(false)

  const sorted = [...agents].sort((a, b) => a.rank - b.rank)
  const visible = streamedCount !== undefined ? sorted.slice(0, streamedCount) : sorted
  const selectedAgent = visible.find(a => a.id === selected) ?? visible[0] ?? null

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-5 h-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1.5">Stack recommandé</p>
          <h2 className="font-syne font-bold text-2xl text-zinc-900 dark:text-white leading-tight">{stackName}</h2>
          <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed max-w-md">{objective}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setAlertsActive(a => !a)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              alertsActive ? 'bg-[#CAFF32]/10 border-[#CAFF32]/30 text-[#CAFF32]'
                           : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}>
            {alertsActive ? <IconBell size={14} /> : <IconBellOff size={14} />}
            Alertes
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
            {copied ? <IconCheck size={14} /> : <IconShare size={14} />}
          </button>
          {onRegenerate && (
            <button onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
              <IconRefresh size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-6 px-5 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Coût</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{totalCost}€<span className="text-sm font-normal text-zinc-500">/mois</span></p>
        </div>
        <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">ROI</p>
          <p className="text-lg font-bold text-[#CAFF32]">+{roiEstimate}%</p>
        </div>
        <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800" />
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Outils</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{visible.length}</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400">
            <IconBolt size={14} />
            <span className="text-xs">Execution — coming soon</span>
          </div>
        </div>
      </div>

      {/* Split layout — tool list + detail panel */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 320px)', minHeight: 400 }}>

        {/* Left — compact tool list */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto scrollbar-hide">
          {visible.map((agent, i) => {
            const color = catColor(agent.category)
            const isSelected = (selected ?? visible[0]?.id) === agent.id
            return (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                onClick={() => setSelected(agent.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all relative ${
                  isSelected
                    ? 'border-l-2 border-zinc-300 dark:border-zinc-600 pl-4'
                    : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02] border-l-2 border-transparent'
                }`}
              >
                <ToolLogo agent={agent} />
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-medium truncate ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    {agent.name}
                  </p>
                  <p className="text-sm text-zinc-400 truncate">{agent.price_from === 0 ? 'Free' : `${agent.price_from}€/mo`}</p>
                </div>
              </motion.button>
            )
          })}

          {streamedCount !== undefined && streamedCount < agents.length && (
            <div className="flex items-center gap-2 px-3 py-2">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32]"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }} />
              <p className="text-[10px] text-zinc-500">Loading...</p>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <AnimatePresence mode="wait">
          {selectedAgent && (
            <motion.div
              key={selectedAgent.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto scrollbar-hide rounded-xl border border-zinc-100 dark:border-zinc-800/60 p-5 flex flex-col gap-4"
            >
              {(() => {
                const agent = selectedAgent
                const color = catColor(agent.category)
                const [promptCopied, setPromptCopied] = useState(false)
                const steps = agent.implementation_steps ?? []

                return (
                  <>
                    {/* Tool header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                          <img src={agent.logo_url || (agent.website_domain ? getLogoUrl(agent.website_domain) : '')} 
                            alt={agent.name} className="w-12 h-12 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{agent.name}</h3>
                            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ color, background: `${color}15` }}>
                              {agent.category}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">
                            {agent.price_from === 0 ? 'Free' : `${agent.price_from}€/mo`}
                            {' · '}Score {agent.score}
                          </p>
                        </div>
                      </div>
                      {agent.url && (
                        <a href={agent.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all flex-shrink-0">
                          <IconExternalLink size={14} />
                          Voir l'outil
                        </a>
                      )}
                    </div>

                    {/* Role */}
                    <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{agent.role}</p>

                    {/* Why selected */}
                    {agent.reason && (
                      <div className="text-sm text-zinc-500 leading-relaxed px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        {agent.reason}
                      </div>
                    )}

                    {/* Implementation guide */}
                    {steps.length > 0 && (
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-3">
                          Implementation guide · {steps.length} step{steps.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-col gap-2">
                          {steps.map((step, i) => (
                            <StepRow key={i} step={step} index={i} color={color} />
                          ))}
                        </div>
                      </div>
                    )}

                    {steps.length === 0 && (
                      <div className="flex items-center gap-2 py-2">
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} />
                        <p className="text-xs text-zinc-500 italic">Generating guide...</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
