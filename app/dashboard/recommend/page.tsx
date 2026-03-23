'use client'

import { useState } from 'react'
import type { StackResult, UserContext, SubTask } from '@/lib/gemini/recommender'
import { cn } from '@/lib/utils'
import AgentCard from '@/app/components/ui/AgentCard'
import StackFlow from '@/app/components/ui/StackFlow'
import StackSummary from '@/app/components/ui/StackSummary'

const STEPS = ['Objectif', 'Profil', 'Contexte', 'Résultat']

const SECTORS = ['E-commerce', 'SaaS', 'Agence', 'Consultant', 'Créateur', 'B2B', 'Education', 'Santé', 'Autre']
const TEAM_SIZES = [
  { value: 'solo', label: 'Solo — juste moi' },
  { value: 'small', label: 'Petite — 2 à 10' },
  { value: 'medium', label: 'Moyenne — 10 à 50' },
  { value: 'large', label: 'Grande — 50+' },
]
const BUDGETS = [
  { value: 'zero', label: '0€ — gratuit uniquement' },
  { value: 'low', label: 'Jusqu\'à 50€/mois' },
  { value: 'medium', label: 'Jusqu\'à 200€/mois' },
  { value: 'high', label: '200€+ /mois' },
]
const TECH_LEVELS = [
  { value: 'beginner', label: 'Débutant — pas de code' },
  { value: 'intermediate', label: 'Intermédiaire — no-code ok' },
  { value: 'advanced', label: 'Avancé — code possible' },
]
const TIMELINES = [
  { value: 'asap', label: 'Dès aujourd\'hui' },
  { value: 'weeks', label: 'Dans quelques semaines' },
  { value: 'months', label: 'Pas d\'urgence' },
]

const LOGO_URL = (domain: string) =>
  `https://logo.clearbit.com/${domain}`

export default function RecommendPage() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StackResult | null>(null)
  const [error, setError] = useState('')
  const [ctx, setCtx] = useState<UserContext>({
    objective: '',
    sector: '',
    team_size: 'solo',
    budget: 'low',
    tech_level: 'intermediate',
    timeline: 'weeks',
    current_tools: [],
  })
  const [toolInput, setToolInput] = useState('')

  const update = (key: keyof UserContext, value: unknown) =>
    setCtx(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setResult(data.result)
      setStep(3)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <p className="font-dm-mono text-[0.7rem] text-muted tracking-[0.12em] uppercase mb-2">
        Algorithme StackAI
      </p>
      <h1 className="font-syne font-extrabold text-3xl tracking-[-0.03em] text-cream mb-6">
        Construis ton stack
      </h1>

      {/* Progress */}
      <div className="flex gap-0 mb-10 bg-border">
        {STEPS.map((s, i) => (
          <div key={s} className={cn(
            'flex-1 py-3 text-center font-dm-mono text-[0.62rem] tracking-[0.08em] uppercase transition-colors',
            i === step ? 'bg-accent text-bg' : i < step ? 'bg-accent/20 text-accent' : 'bg-bg-2 text-muted'
          )}>
            {s}
          </div>
        ))}
      </div>

      {/* STEP 0 — Objectif */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <p className="font-dm-sans text-sm text-muted-2 font-light">
            Décris ton objectif en langage naturel. Plus c'est précis, meilleur sera le stack.
          </p>
          <div className="border border-border bg-bg-2 p-1">
            <textarea
              value={ctx.objective}
              onChange={e => update('objective', e.target.value)}
              placeholder="Ex: Je veux lancer une boutique Shopify, automatiser mon service client et créer du contenu pour Instagram..."
              rows={5}
              className="w-full bg-transparent text-cream font-dm-sans text-sm p-4
                         outline-none resize-none placeholder:text-muted leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn('w-2 h-2 rounded-full', ctx.objective.length > 20 ? 'bg-accent' : 'bg-border-2')} />
            <p className="font-dm-mono text-[0.65rem] text-muted">
              {ctx.objective.length < 20 ? 'Décris un peu plus ton objectif...' : 'Parfait, on peut continuer ✦'}
            </p>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={ctx.objective.length < 20}
            className="bg-accent text-bg font-syne font-bold text-[0.88rem] px-8 py-4
                       tracking-[0.03em] hover:opacity-85 transition-opacity disabled:opacity-40 w-fit"
          >
            Continuer →
          </button>
        </div>
      )}

      {/* STEP 1 — Profil */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          {/* Secteur */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">Ton secteur</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(s => (
                <button key={s} onClick={() => update('sector', s)}
                  className={cn(
                    'font-dm-mono text-[0.7rem] px-4 py-2 border transition-colors tracking-[0.06em]',
                    ctx.sector === s ? 'bg-accent text-bg border-accent' : 'bg-bg-2 text-muted-2 border-border hover:border-accent/50'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Taille équipe */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">Taille de ton équipe</p>
            <div className="flex flex-col gap-2">
              {TEAM_SIZES.map(t => (
                <button key={t.value} onClick={() => update('team_size', t.value)}
                  className={cn(
                    'font-dm-sans text-sm px-4 py-3 border text-left transition-colors',
                    ctx.team_size === t.value ? 'bg-accent/10 text-cream border-accent' : 'bg-bg-2 text-muted-2 border-border hover:border-border-2'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="border border-border text-muted-2 font-syne font-bold text-[0.85rem] px-6 py-3 hover:border-border-2 transition-colors">
              ← Retour
            </button>
            <button onClick={() => setStep(2)} disabled={!ctx.sector}
              className="bg-accent text-bg font-syne font-bold text-[0.88rem] px-8 py-3 tracking-[0.03em] hover:opacity-85 transition-opacity disabled:opacity-40">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Contexte */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          {/* Budget */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">Budget mensuel outils IA</p>
            <div className="flex flex-col gap-2">
              {BUDGETS.map(b => (
                <button key={b.value} onClick={() => update('budget', b.value)}
                  className={cn(
                    'font-dm-sans text-sm px-4 py-3 border text-left transition-colors',
                    ctx.budget === b.value ? 'bg-accent/10 text-cream border-accent' : 'bg-bg-2 text-muted-2 border-border hover:border-border-2'
                  )}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niveau technique */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">Niveau technique</p>
            <div className="flex flex-col gap-2">
              {TECH_LEVELS.map(t => (
                <button key={t.value} onClick={() => update('tech_level', t.value)}
                  className={cn(
                    'font-dm-sans text-sm px-4 py-3 border text-left transition-colors',
                    ctx.tech_level === t.value ? 'bg-accent/10 text-cream border-accent' : 'bg-bg-2 text-muted-2 border-border hover:border-border-2'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">Urgence</p>
            <div className="flex gap-2">
              {TIMELINES.map(t => (
                <button key={t.value} onClick={() => update('timeline', t.value)}
                  className={cn(
                    'flex-1 font-dm-sans text-sm px-3 py-3 border text-center transition-colors',
                    ctx.timeline === t.value ? 'bg-accent/10 text-cream border-accent' : 'bg-bg-2 text-muted-2 border-border hover:border-border-2'
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outils actuels */}
          <div>
            <p className="font-dm-mono text-[0.68rem] text-muted uppercase tracking-[0.1em] mb-3">
              Outils que tu utilises déjà (optionnel)
            </p>
            <div className="flex gap-2 mb-2">
              <input
                value={toolInput}
                onChange={e => setToolInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && toolInput.trim()) {
                    update('current_tools', [...ctx.current_tools, toolInput.trim()])
                    setToolInput('')
                  }
                }}
                placeholder="Ex: Shopify, Notion... (Entrée pour ajouter)"
                className="flex-1 bg-bg-2 border border-border text-cream text-sm px-4 py-2
                           font-dm-sans outline-none focus:border-accent placeholder:text-muted"
              />
            </div>
            {ctx.current_tools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ctx.current_tools.map((t, i) => (
                  <span key={i} className="font-dm-mono text-[0.68rem] bg-bg-3 border border-border
                                           text-muted-2 px-3 py-1 flex items-center gap-2">
                    {t}
                    <button onClick={() => update('current_tools', ctx.current_tools.filter((_, j) => j !== i))}
                      className="text-muted hover:text-accent">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="font-dm-mono text-xs text-red-400">Erreur : {error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="border border-border text-muted-2 font-syne font-bold text-[0.85rem] px-6 py-3 hover:border-border-2 transition-colors">
              ← Retour
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="bg-accent text-bg font-syne font-bold text-[0.88rem] px-8 py-3
                         tracking-[0.03em] hover:opacity-85 transition-opacity disabled:opacity-40 flex items-center gap-2">
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border border-bg border-t-transparent rounded-full" />
                  Analyse en cours...
                </>
              ) : 'Générer mon stack →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Résultat */}
      {step === 3 && result && (
  <div className="flex flex-col gap-4">
    {/* Summary */}
    <StackSummary
      stackName={result.stack_name}
      justification={result.justification}
      total_cost={result.total_cost}
      roi_estimate={result.roi_estimate}
      time_saved_per_week={(result as StackResult & { time_saved_per_week?: number }).time_saved_per_week}
      agentCount={result.agents.length}
    />

    {/* Workflow visuel */}
    <StackFlow
      agents={result.agents}
      stackName={result.stack_name}
    />

    {/* Sous-tâches */}
    {result.subtasks && result.subtasks.length > 0 && (

      <div>
        <p className="font-dm-mono text-[0.65rem] text-muted uppercase tracking-[0.1em] mb-2">
          Décomposition du projet
        </p>
        <div className="flex flex-col gap-[2px] bg-border">
          {(result as StackResult & { subtasks?: SubTask[] }).subtasks!.map((task, i) => (
            <div key={i} className="bg-bg-2 p-4 grid grid-cols-[1fr_60px_1fr] gap-3 items-center">
              <div>
                <p className="font-dm-mono text-[0.58rem] text-muted uppercase tracking-[0.06em] mb-1">
                  Sans IA
                </p>
                <p className="font-dm-sans text-sm text-[#666] font-light leading-relaxed">
                  {task.without_ai}
                </p>
              </div>
              <div className="text-center">
                <div className="font-syne font-bold text-accent text-base">→</div>
                <p className="font-dm-mono text-[0.52rem] text-accent uppercase tracking-[0.04em] mt-1 leading-tight">
                  {task.tool_name}
                </p>
              </div>
              <div>
                <p className="font-dm-mono text-[0.58rem] text-accent uppercase tracking-[0.06em] mb-1">
                  Avec IA ✦
                </p>
                <p className="font-dm-sans text-sm text-cream font-light leading-relaxed">
                  {task.with_ai}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Quick wins + Warnings */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-border">
      {result.quick_wins?.length > 0 && (
        <div className="bg-accent/5 border border-accent/15 p-4">
          <p className="font-dm-mono text-[0.62rem] text-accent uppercase tracking-[0.1em] mb-3">
            ✦ Quick wins immédiats
          </p>
          <div className="flex flex-col gap-2">
            {result.quick_wins.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-accent text-xs mt-[2px] flex-shrink-0">{i + 1}.</span>
                <p className="font-dm-sans text-sm text-cream font-light leading-relaxed">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {result.warnings?.length > 0 && (
        <div className="bg-accent-2/5 border border-accent-2/15 p-4">
          <p className="font-dm-mono text-[0.62rem] text-accent-2 uppercase tracking-[0.1em] mb-3">
            ⚠ Points de vigilance
          </p>
          <div className="flex flex-col gap-2">
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-accent-2 text-xs mt-[2px] flex-shrink-0">•</span>
                <p className="font-dm-sans text-sm text-cream font-light leading-relaxed">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Agent cards */}
    <div>
      <p className="font-dm-mono text-[0.65rem] text-muted uppercase tracking-[0.1em] mb-2">
        Les agents de ton stack — clique pour les détails
      </p>
      <div className="flex flex-col gap-[2px] bg-border">
        {result.agents.map((agent, i) => (
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

    {/* Reset */}
    <button
      onClick={() => {
        setStep(0)
        setResult(null)
        setCtx({ objective: '', sector: '', team_size: 'solo', budget: 'low', tech_level: 'intermediate', timeline: 'weeks', current_tools: [] })
      }}
      className="border border-border text-muted-2 font-syne font-bold text-[0.85rem]
                 px-6 py-3 hover:border-accent hover:text-accent transition-colors w-fit"
    >
      ← Nouveau stack
    </button>
  </div>
)}
    </div>
  )
}
