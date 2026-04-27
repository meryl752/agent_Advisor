'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getLogoUrl } from '@/lib/utils/logo'
import type { Agent } from '@/lib/supabase/types'
import type { BlueprintTask } from '@/lib/blueprint/sectors'

const CATEGORY_COLORS: Record<string, string> = {
  copywriting: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
  image: 'bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20',
  automation: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
  analytics: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/20',
  customer_service: 'bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20',
  seo: 'bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20',
  prospecting: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20',
  research: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
  video: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20',
  social: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20',
}

function AgentLogo({ domain, name }: { domain?: string; name: string }) {
  const [error, setError] = useState(false)

  if (!domain || error) {
    return (
      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
        <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black">{name[0]}</span>
      </div>
    )
  }

  return (
    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-100">
      <Image
        src={getLogoUrl(domain)}
        alt={name}
        width={20}
        height={20}
        className="object-contain"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}

interface AgentChipProps {
  agent: Agent
  inStack: boolean
  onAdd: () => void
  stackFull: boolean
  plan: 'free' | 'pro' | 'agency'
}

function AgentChip({ agent, inStack, onAdd, stackFull, plan }: AgentChipProps) {
  const [added, setAdded] = useState(inStack)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const domain = (agent as Agent & { website_domain?: string }).website_domain

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (inStack || added) return
    if (plan === 'free' && stackFull) {
      setShowUpgrade(true)
      setTimeout(() => setShowUpgrade(false), 3000)
      return
    }
    setAdded(true)
    onAdd()
  }

  return (
    <div className="relative flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group/chip">
      <AgentLogo domain={domain} name={agent.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-syne font-bold text-xs text-zinc-900 dark:text-white truncate">{agent.name}</span>
          <span className={cn(
            'font-dm-mono text-[8px] px-1.5 py-[1px] rounded-full border',
            CATEGORY_COLORS[agent.category] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
          )}>
            {agent.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`font-dm-mono text-[10px] font-bold ${agent.price_from === 0 ? 'text-[#CAFF32]' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {agent.price_from === 0 ? 'Gratuit' : `${agent.price_from}€/m`}
          </span>
          <span className="font-dm-mono text-[9px] text-zinc-400 dark:text-zinc-600">
            ★ {agent.score}/100
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {agent.url && (
          <a href={agent.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-xs" title={`Visiter ${agent.name}`}>
            ↗
          </a>
        )}
        <button onClick={handleAdd}
          className={cn(
            'font-dm-mono text-[9px] px-2.5 py-1 rounded-lg transition-all',
            (added || inStack)
              ? 'bg-[#CAFF32]/10 text-[#CAFF32] border border-[#CAFF32]/20 cursor-default'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
          )}>
          {(added || inStack) ? '✓ Ajouté' : '+ Ajouter'}
        </button>
      </div>

      <AnimatePresence>
        {showUpgrade && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <p className="font-dm-mono text-[10px] text-zinc-600 dark:text-zinc-300 mb-1">Plan gratuit limité à 3 agents</p>
            <a href="/dashboard/billing" className="font-dm-mono text-[10px] text-[#CAFF32] hover:underline">Passer en Pro →</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface BlueprintTaskCardProps {
  task: BlueprintTask
  agents: Agent[]
  selected: boolean
  onToggle: () => void
  onAddAgentToStack: (agentId: string) => void
  userStackAgentIds: string[]
  userPlan: 'free' | 'pro' | 'agency'
  stackAgentCount: number
}

export default function BlueprintTaskCard({
  task,
  agents,
  selected,
  onToggle,
  onAddAgentToStack,
  userStackAgentIds,
  userPlan,
  stackAgentCount,
}: BlueprintTaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const stackFull = userPlan === 'free' && stackAgentCount >= 3

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer',
        selected
          ? 'border-[#CAFF32]/40 bg-[#CAFF32]/[0.03]'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700'
      )}
      onClick={() => setExpanded(prev => !prev)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className={cn(
            'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all',
            selected
              ? 'bg-[#CAFF32] border-[#CAFF32]'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
          )}
        >
          {selected && <span className="text-zinc-900 text-[10px] font-black">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-syne font-bold text-sm text-zinc-900 dark:text-white">{task.label}</span>
            <span className={cn(
              'font-dm-mono text-[9px] px-2 py-[2px] rounded-full border',
              CATEGORY_COLORS[task.category] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            )}>
              {task.category}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="font-dm-mono text-[10px] text-[#CAFF32]">⏱ {task.roi_estimate}</span>
            <span className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              {agents.length > 0 ? `${agents.length} outil${agents.length > 1 ? 's' : ''}` : 'Bientôt disponible'}
            </span>
          </div>
        </div>

        <span className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-600 flex-shrink-0">
          {expanded ? '↑' : '↓'}
        </span>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
              <p className="font-dm-mono text-[10px] text-zinc-500 mb-3 leading-relaxed">
                💡 {task.roi_detail}
              </p>

              {agents.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {agents.slice(0, 4).map(agent => (
                    <AgentChip
                      key={agent.id}
                      agent={agent}
                      inStack={userStackAgentIds.includes(agent.id)}
                      onAdd={() => onAddAgentToStack(agent.id)}
                      stackFull={stackFull}
                      plan={userPlan}
                    />
                  ))}
                  {agents.length > 4 && (
                    <p className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-600 text-center pt-1">
                      +{agents.length - 4} autres outils disponibles
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3">
                  <span className="text-zinc-400 text-sm">⏳</span>
                  <span className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-600">Bientôt disponible</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
