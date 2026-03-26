'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FinalStack as StackResult, SubTask } from '@/lib/agents/types'
import { cn } from '@/lib/utils'
import AgentCard from '@/app/components/ui/AgentCard'
import StackFlow from '@/app/components/ui/StackFlow'
import StackSummary from '@/app/components/ui/StackSummary'
import StackChat from '@/app/components/ui/StackChat'



const EXAMPLE_CHIPS = [
  { label: 'Aide j\'aimerais automatiser mon service de receptions pour mon business', prompt: 'Aide j\'aimerais automatiser mon service de receptions pour mon business' },
  { label: 'J\'aimerais augmenter la rapidité à laquelle j\'atteint mes clients dans mon business', prompt: 'J\'aimerais augmenter la rapidité à laquelle j\'atteint mes clients dans mon business' },
  { label: 'J\'aimerais automatiser le service client au niveau de ma plateforme Shopify', prompt: 'J\'aimerais automatiser le service client au niveau de ma plateforme Shopify' },
  { label: 'Optimiser mes processus de vente avec l\'IA pour gagner du temps', prompt: 'Je souhaite optimiser mes processus de vente avec l\'IA pour gagner du temps au quotidien' },
  { label: 'Analyser mes données clients pour prédire les futures tendances', prompt: 'J\'aimerais analyser mes données clients pour prédire les futures tendances et anticiper la demande' },
  { label: 'Automatiser ma gestion d\'inventaire e-commerce intelligemment', prompt: 'Mettre en place un système intelligent pour automatiser ma gestion d\'inventaire et mes commandes' },
]

const BUDGET_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'zero', label: 'Gratuit' },
  { value: 'low', label: '<50€' },
  { value: 'medium', label: '<200€' },
  { value: 'high', label: '200€+' },
]

const TECH_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
]

const TEAM_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'solo', label: 'Solo' },
  { value: 'small', label: '2-10' },
  { value: 'medium', label: '10-50' },
  { value: 'large', label: '50+' },
]

const TIMELINE_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'asap', label: 'Urgent' },
  { value: 'weeks', label: 'Semaines' },
  { value: 'months', label: 'Mois' },
]

const BUDGET_LIMITS: Record<string, number> = {
  all: 999999, zero: 0, low: 50, medium: 200, high: 999999,
}

const DIFFICULTY_MAP: Record<string, string[]> = {
  all: ['easy', 'medium', 'hard'],
  beginner: ['easy'],
  intermediate: ['easy', 'medium'],
  advanced: ['easy', 'medium', 'hard'],
}

function filterStack(stack: StackResult, filters: Record<string, string>): StackResult {
  const budgetLimit = BUDGET_LIMITS[filters.budget]
  const allowedDiff = DIFFICULTY_MAP[filters.tech]

  const filteredAgents = stack.agents.filter(agent => {
    if (filters.budget !== 'all' && agent.price_from > budgetLimit) return false
    if (filters.tech !== 'all' && agent.setup_difficulty &&
        !allowedDiff.includes(agent.setup_difficulty)) return false
    return true
  })

  return {
    ...stack,
    agents: filteredAgents.map((a, i) => ({ ...a, rank: i + 1 })),
    total_cost: filteredAgents.reduce((sum, a) => sum + a.price_from, 0),
  }
}

export default function RecommendPage() {
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [originalStack, setOriginalStack] = useState<StackResult | null>(null)
  const [displayStack, setDisplayStack] = useState<StackResult | null>(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    budget: 'all', tech: 'all', team: 'all', timeline: 'all',
  })

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all')

  const handleSubmit = async () => {
    if (!objective.trim()) return
    setLoading(true)
    setLoadingStep(0)
    setError('')
    setOriginalStack(null)
    setDisplayStack(null)

    const t1 = setTimeout(() => setLoadingStep(1), 3000)
    const t2 = setTimeout(() => setLoadingStep(2), 6000)

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      })
      const data = await res.json()
      clearTimeout(t1); clearTimeout(t2)
      if (!res.ok) { setError(data.error); return }
      setOriginalStack(data.result)
      setDisplayStack(data.result)
      setFilters({ budget: 'all', tech: 'all', team: 'all', timeline: 'all' })
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    if (originalStack) setDisplayStack(filterStack(originalStack, newFilters))
  }

  const resetFilters = () => {
    setFilters({ budget: 'all', tech: 'all', team: 'all', timeline: 'all' })
    setDisplayStack(originalStack)
  }

  // ── IDLE STATE ────────────────────────────────────────────────
  if (!displayStack && !loading) {
    return (
      <div className="min-h-[calc(100vh-0px)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Animated Background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.03, 0.05, 0.03],
              x: [-20, 20, -20],
              y: [-20, 20, -20],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[800px] h-[400px] blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent 70%)' }}
          />
          {/* Strategic subtle green gradients */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-[#CAFF32]/[0.02] blur-[120px] rounded-full" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[#CAFF32]/[0.01] blur-[150px] rounded-full" />
          
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.02, 0.04, 0.02],
              x: [20, -20, 20],
              y: [20, -20, 20],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/4 right-1/4 w-[400px] h-[400px] blur-3xl rounded-full"
            style={{ background: 'radial-gradient(circle, #6B4FFF, transparent 70%)' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-black text-5xl text-white tracking-tight mb-4 leading-tight">
              Construis ton stack <br />
              de <span className="text-[#CAFF32]">super-pouvoirs</span> IA
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">
              Décris ton objectif métier — notre IA assemble le combo optimal d'outils en 30 secondes.
            </p>
          </div>

          {/* Main input - Glassmorphism style */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#CAFF32]/20 via-zinc-800 to-[#6B4FFF]/20 rounded-2xl blur-sm opacity-50 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden
                            focus-within:border-[#CAFF32]/40 transition-all duration-500 shadow-2xl">
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Ex: Je veux lancer une boutique Shopify et automatiser mon service client..."
                rows={4}
                className="w-full bg-transparent text-zinc-100 font-medium text-lg
                           px-6 pt-6 pb-2 outline-none resize-none placeholder:text-zinc-700
                           leading-relaxed"
              />
              <div className="flex items-center justify-end px-6 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={!objective.trim()}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 rounded-xl font-black text-sm',
                    'transition-all duration-300 relative overflow-hidden group/btn',
                    objective.trim()
                      ? 'bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] hover:scale-105 hover:shadow-[0_0_20px_rgba(202,255,50,0.3)]'
                      : 'bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed'
                  )}
                >
                  <span className="relative z-10">Générer mon stack</span>
                  <span className="text-lg relative z-10 group-hover/btn:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Suggestion Chips - Infinite Auto-scroll */}
          <div className="w-full relative px-1 flex flex-col gap-3 overflow-hidden" 
               style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
            {/* Row 1 */}
            <div className="flex overflow-hidden relative">
              <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                className="flex gap-2 whitespace-nowrap"
              >
                {[...EXAMPLE_CHIPS, ...EXAMPLE_CHIPS, ...EXAMPLE_CHIPS].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => setObjective(chip.prompt)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                               bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50
                               hover:bg-zinc-800/60 hover:border-[#CAFF32]/30 
                               text-zinc-500 hover:text-[#CAFF32]
                               transition-all duration-200 text-[11px] font-medium 
                               group shadow-xl whitespace-nowrap flex-shrink-0"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Row 2 */}
            <div className="flex overflow-hidden relative">
              <motion.div
                animate={{ x: [-1000, 0] }}
                transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
                className="flex gap-2 whitespace-nowrap"
              >
                {[...EXAMPLE_CHIPS, ...EXAMPLE_CHIPS, ...EXAMPLE_CHIPS].reverse().map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => setObjective(chip.prompt)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl 
                               bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50
                               hover:bg-zinc-800/60 hover:border-[#CAFF32]/30 
                               text-zinc-500 hover:text-[#CAFF32]
                               transition-all duration-200 text-[11px] font-medium 
                               group shadow-xl whitespace-nowrap flex-shrink-0"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-8 text-red-400 text-sm font-mono text-center"
            >
              ⚠ {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    )
  }

    // ── LOADING STATE ─────────────────────────────────────────────
    if (loading) {
      const logs = [
        // Step 0
        [
          `> initializing neural_engine_v4... [OK]`,
          `> target_objective: "${objective.slice(0, 40)}${objective.length > 40 ? '...' : ''}"`,
          `> extracting core requirements...`,
          `> process_id: 0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        ],
        // Step 1
        [
          `> querying 200+ specialized agents...`,
          `> analyzing ROI metrics and scoring...`,
          `> matching capabilities: 84% coverage`,
          `> background process: agent_scoring.sh`,
        ],
        // Step 2
        [
          `> building optimized architectural stack...`,
          `> applying budget constraints: OK`,
          `> profiling tool synergy: 0.98 index`,
          `> finalizing recommendation...`,
        ]
      ]

      const displayedLogs = logs.slice(0, loadingStep + 1).flat()

      return (
        <div className="min-h-[calc(100vh-0px)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                            w-[800px] h-[400px] opacity-[0.03] blur-3xl rounded-full"
                 style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent)' }} />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            {/* Terminal Window */}
            <div className="bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
              {/* Terminal Header */}
              <div className="bg-zinc-900/50 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  <div className="w-3 h-3 rounded-full bg-zinc-800" />
                  <div className="w-3 h-3 rounded-full bg-zinc-800" />
                </div>
                <div className="w-12" />
              </div>

              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm overflow-y-auto flex-1 scrollbar-hide">
                <div className="space-y-1.5 min-h-full">
                  {displayedLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "transition-all duration-300",
                        i < displayedLogs.length - 1 ? "text-zinc-500" : "text-[#CAFF32]"
                      )}
                    >
                      {log}
                    </motion.div>
                  ))}
                  
                  {/* Flickering Cursor */}
                  <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2.5 h-4.5 bg-[#CAFF32] ml-1 align-middle"
                  />
                </div>
              </div>

              {/* Progress Footer */}
              <div className="bg-zinc-900/30 px-6 py-4 border-top border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">System Status</span>
                  <span className="text-[10px] font-mono text-[#CAFF32] font-black uppercase">
                    {loadingStep === 0 ? 'Analyzing' : loadingStep === 1 ? 'Scoring' : 'Finalizing'}...
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#CAFF32]"
                    animate={{ width: [`${(loadingStep) * 33}%`, `${(loadingStep + 1) * 33}%`] }}
                    transition={{ duration: 3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

  // ── RESULTS ───────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 flex items-center gap-3 px-8 pt-8 mb-6">
        <button
          onClick={() => {
            setObjective('')
            setOriginalStack(null)
            setDisplayStack(null)
            resetFilters()
          }}
          className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-1 transition-colors"
        >
          ← Nouveau stack
        </button>
        <span className="text-zinc-700">·</span>
        <span className="text-xs font-mono text-zinc-600 truncate max-w-md">
          &quot;{objective}&quot;
        </span>
      </div>

      {displayStack && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-8 pb-8">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 h-full overflow-hidden">
            {/* Left column - Agents & Subtasks - Independent Scroll */}
            <div className="h-full overflow-y-auto pr-4 scrollbar-hide flex flex-col">
              {/* STACK SUMMARY — flex-shrink-0 is critical: prevents this from being squashed to 0 */}
              <div className="flex-shrink-0 pb-6">
                <StackSummary
                  stackName={displayStack.stack_name}
                  justification={displayStack.justification}
                  total_cost={displayStack.total_cost}
                  roi_estimate={displayStack.roi_estimate}
                  time_saved_per_week={displayStack.time_saved_per_week}
                  agentCount={displayStack.agents.length}
                />
              </div>

              {displayStack.subtasks && displayStack.subtasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
                    Décomposition du projet
                  </p>
                  <div className="flex flex-col gap-[2px] overflow-hidden">
                    {displayStack.subtasks.map((task: SubTask, i: number) => (
                      <div key={i} className="bg-zinc-900 p-4 grid grid-cols-[1fr_60px_1fr] gap-3 items-center">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.08em] mb-1">Sans IA</p>
                          <p className="text-sm text-zinc-500 leading-relaxed">{task.without_ai}</p>
                        </div>
                        <div className="text-center">
                          <div className="font-black text-[#CAFF32] text-base">→</div>
                          <p className="text-[10px] font-mono text-[#CAFF32]/60 uppercase tracking-[0.04em] mt-1 leading-tight">
                            {task.tool_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono text-[#CAFF32] uppercase tracking-[0.08em] mb-1">Avec IA ✦</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">{task.with_ai}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
                  Les agents — clique pour les détails
                </p>
                <div className="flex flex-col gap-[2px] overflow-hidden">
                  {displayStack.agents.map((agent, i) => (
                    <AgentCard
                      key={i}
                      rank={agent.rank}
                      name={agent.name}
                      category={agent.category}
                      price_from={agent.price_from}
                      role={agent.role}
                      reason={agent.reason}
                      concrete_result={(agent as typeof agent & { concrete_result?: string }).concrete_result}
                      website_domain={agent.website_domain}
                      setup_difficulty={agent.setup_difficulty}
                      time_to_value={agent.time_to_value}
                      score={agent.score}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Flow & Filters - Independent Scroll */}
            <div className="h-full overflow-y-auto pr-2 scrollbar-hide flex flex-col gap-4">
              <StackFlow agents={displayStack.agents} stackName={displayStack.stack_name} />

              {/* Expert Chat — tuteur conversationnel post-stack */}
              <StackChat
                stackContext={{
                  stack_name: displayStack.stack_name,
                  objective: objective,
                  total_cost: displayStack.total_cost,
                  agents: displayStack.agents.map(a => ({ name: a.name, role: a.role })),
                }}
              />

              {/* Filtres */}
              <div className="bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
                    Ajuster le stack
                  </p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters}
                      className="text-[10px] font-mono text-[#CAFF32] hover:text-[#d4ff50] transition-colors">
                      Reset ×
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { key: 'budget', label: 'Budget', opts: BUDGET_OPTIONS },
                    { key: 'tech', label: 'Niveau', opts: TECH_OPTIONS },
                    { key: 'team', label: 'Équipe', opts: TEAM_OPTIONS },
                    { key: 'timeline', label: 'Urgence', opts: TIMELINE_OPTIONS },
                  ].map(({ key, label, opts }) => (
                    <div key={key}>
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.1em] mb-2">
                        {label}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {opts.map(opt => (
                          <button key={opt.value} onClick={() => applyFilter(key, opt.value)}
                            className={cn(
                              'text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all',
                              filters[key as keyof typeof filters] === opt.value
                                ? 'bg-[#CAFF32] text-zinc-900 border-[#CAFF32] font-black'
                                : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                            )}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résumé financier */}
              <div className="bg-zinc-900 border border-zinc-800 p-4">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-3">
                  Résumé financier
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Coût mensuel', value: `${displayStack.total_cost}€`, color: 'text-white' },
                    { label: 'ROI estimé', value: `+${displayStack.roi_estimate}%`, color: 'text-[#CAFF32]' },
                    { label: 'Temps économisé', value: `${displayStack.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
                  ].map((m, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                      <span className="text-xs text-zinc-500">{m.label}</span>
                      <span className={cn('font-black text-sm', m.color)}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick wins */}
              {displayStack.quick_wins?.length > 0 && (
                <div className="bg-[#CAFF32]/5 border border-[#CAFF32]/15 p-4">
                  <p className="text-[10px] font-mono text-[#CAFF32] uppercase tracking-[0.15em] mb-3">
                    ✦ Quick wins
                  </p>
                  <div className="flex flex-col gap-2">
                    {displayStack.quick_wins.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#CAFF32] text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {displayStack.warnings?.length > 0 && (
                <div className="bg-[#FF6B35]/5 border border-[#FF6B35]/15 p-4">
                  <p className="text-[10px] font-mono text-[#FF6B35] uppercase tracking-[0.15em] mb-3">
                    ⚠ Vigilance
                  </p>
                  <div className="flex flex-col gap-2">
                    {displayStack.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#FF6B35] text-xs mt-0.5">•</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
