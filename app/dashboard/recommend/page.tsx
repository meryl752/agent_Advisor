'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FinalStack } from '@/lib/agents/types'
import AgentCard from '@/app/components/ui/AgentCard'
import StackFlow from '@/app/components/ui/StackFlow'
import StackSummary from '@/app/components/ui/StackSummary'
import ROIChart from '@/app/components/ui/ROIChart'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'questioning' | 'reasoning' | 'results' | 'error'
interface ChipOption { label: string; value: string }
interface Question { id: string; text: string; type: 'free-text' | 'chips'; chips?: ChipOption[] }
interface ChatEntry { role: 'ai' | 'user'; text: string }
interface ApiError { type: 'rate-limit' | 'server'; message: string; plan?: string; resetAt?: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { label: 'Automatiser mon service client Shopify', prompt: "J'aimerais automatiser le service client au niveau de ma plateforme Shopify" },
  { label: 'Augmenter ma vitesse de prospection B2B', prompt: "J'aimerais augmenter la rapidité à laquelle j'atteins mes clients dans mon business B2B" },
  { label: 'Créer du contenu Instagram en masse', prompt: "Je veux créer du contenu Instagram de qualité en grande quantité avec l'IA" },
  { label: 'Automatiser ma gestion d\'inventaire', prompt: "Mettre en place un système intelligent pour automatiser ma gestion d'inventaire" },
  { label: 'Analyser mes données clients', prompt: "J'aimerais analyser mes données clients pour prédire les futures tendances" },
  { label: 'Optimiser mes processus de vente', prompt: "Je souhaite optimiser mes processus de vente avec l'IA pour gagner du temps" },
]

const QUESTIONS: Question[] = [
  { id: 'sector', text: "Dans quel secteur opères-tu ?", type: 'chips',
    chips: [
      { label: 'E-commerce', value: 'e-commerce' }, { label: 'SaaS', value: 'saas' },
      { label: 'Agence', value: 'agence' }, { label: 'Consultant', value: 'consultant' },
      { label: 'Créateur', value: 'createur' }, { label: 'B2B', value: 'b2b' },
    ],
  },
  { id: 'budget', text: "Quel est ton budget mensuel pour les outils IA ?", type: 'chips',
    chips: [
      { label: 'Gratuit', value: 'zero' }, { label: '<50€', value: 'low' },
      { label: '<200€', value: 'medium' }, { label: '200€+', value: 'high' },
    ],
  },
  { id: 'tech_level', text: "Quel est ton niveau technique ?", type: 'chips',
    chips: [
      { label: 'Débutant', value: 'beginner' },
      { label: 'Intermédiaire', value: 'intermediate' },
      { label: 'Avancé', value: 'advanced' },
    ],
  },
]

const REASONING_STEPS = [
  { label: 'Analyse de ton objectif', sub: ['Extraction des mots-clés métier', 'Identification des cas d\'usage', 'Détection du secteur et contexte'] },
  { label: 'Recherche dans la base d\'agents', sub: ['Scan de 200+ outils IA', 'Filtrage par budget et niveau technique', 'Scoring ROI par profil'] },
  { label: 'Optimisation du stack', sub: ['Calcul des synergies entre outils', 'Vérification de la compatibilité', 'Ajustement au budget'] },
  { label: 'Assemblage du stack final', sub: ['Classement par priorité d\'implémentation', 'Génération des quick wins', 'Calcul du ROI projeté'] },
]

// ─── Siri Orb ─────────────────────────────────────────────────────────────────

function SiriOrb() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      {/* Outer glow rings */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          className="absolute rounded-full"
          style={{
            width: `${100 + i * 40}px`,
            height: `${100 + i * 40}px`,
            background: `radial-gradient(circle, transparent 40%, rgba(202,255,50,${0.06 - i * 0.015}) 100%)`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
        />
      ))}

      {/* Core orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full"
        animate={{ scale: [1, 1.05, 0.97, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 35% 35%, #e8ff80, #CAFF32 30%, #4ade80 55%, #06b6d4 75%, #6366f1 100%)',
          boxShadow: '0 0 40px rgba(202,255,50,0.5), 0 0 80px rgba(202,255,50,0.2), 0 0 120px rgba(99,102,241,0.15)',
        }}
      >
        {/* Inner shimmer */}
        <motion.div className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.3) 20%, transparent 40%, rgba(255,255,255,0.15) 60%, transparent 80%)',
          }}
        />
        {/* Specular highlight */}
        <div className="absolute top-3 left-4 w-6 h-4 rounded-full bg-white/40 blur-sm" />
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full bg-[#CAFF32]"
          style={{ left: `${20 + i * 12}%`, top: `${15 + (i % 3) * 25}%` }}
          animate={{
            y: [0, -12, 0, 8, 0],
            opacity: [0, 1, 0.5, 1, 0],
            scale: [0.5, 1, 0.7, 1, 0.5],
          }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}

// ─── Reasoning Steps (Manus-style) ────────────────────────────────────────────

function ReasoningSteps({ visibleStep }: { visibleStep: number }) {
  return (
    <div className="flex flex-col gap-1 w-full max-w-sm mx-auto">
      {REASONING_STEPS.map((step, i) => {
        const done = i < visibleStep
        const active = i === visibleStep
        return (
          <motion.div key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= visibleStep ? 1 : 0.25, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            {/* Step header */}
            <div className="flex items-center gap-2 py-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                done ? 'bg-[#CAFF32]' : active ? 'border border-[#CAFF32] bg-[#CAFF32]/10' : 'border border-zinc-700'
              }`}>
                {done
                  ? <span className="text-zinc-900 text-[8px] font-black">✓</span>
                  : active
                    ? <motion.div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32]"
                        animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    : null
                }
              </div>
              <span className={`text-sm font-medium ${done ? 'text-zinc-300' : active ? 'text-white' : 'text-zinc-600'}`}>
                {step.label}
              </span>
            </div>

            {/* Sub-steps — only show for active/done */}
            <AnimatePresence>
              {(done || active) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                  className="ml-6 border-l border-zinc-800 pl-3 mb-1 overflow-hidden">
                  {step.sub.map((s, j) => (
                    <motion.div key={j}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: j * 0.15 }}
                      className="flex items-center gap-2 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                      <span className="text-xs text-zinc-500">{s}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Right Panel (Reasoning + Results) ───────────────────────────────────────

function RightPanel({ phase, answers, result, onComplete, onError }: {
  phase: 'reasoning' | 'results'
  answers: Record<string, string>
  result: FinalStack | null
  onComplete: (r: FinalStack) => void
  onError: (e: ApiError) => void
}) {
  const [visibleStep, setVisibleStep] = useState(0)
  const [apiDone, setApiDone] = useState(false)
  const resultRef = useRef<FinalStack | null>(null)
  const allShown = useRef(false)

  const tryComplete = useCallback(() => {
    if (apiDone && allShown.current && resultRef.current) {
      setTimeout(() => onComplete(resultRef.current!), 600)
    }
  }, [apiDone, onComplete])

  useEffect(() => {
    if (phase !== 'reasoning') return

    // Fire API
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective: answers.objective, sector: answers.sector,
        budget: answers.budget, tech_level: answers.tech_level,
        team_size: 'solo', timeline: 'weeks', current_tools: [],
      }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) {
        onError(res.status === 429
          ? { type: 'rate-limit', message: data.error, plan: data.plan, resetAt: data.reset_at }
          : { type: 'server', message: data.error ?? 'Erreur serveur' })
        return
      }
      resultRef.current = data.result
      setApiDone(true)
    }).catch(() => onError({ type: 'server', message: 'Erreur réseau' }))

    // Advance steps
    REASONING_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleStep(i)
        if (i === REASONING_STEPS.length - 1) {
          allShown.current = true
        }
      }, 800 + i * 1400)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => { tryComplete() }, [apiDone, tryComplete])

  if (phase === 'results' && result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="h-full overflow-y-auto px-6 py-6 scrollbar-hide">
        <ArtifactGrid stack={result} />
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-10 gap-8">
      <div className="text-center">
        <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2">
          Raspquery AI · En cours
        </p>
        <p className="font-syne font-black text-white text-xl">
          Construction de ton stack
        </p>
      </div>

      <SiriOrb />

      <ReasoningSteps visibleStep={visibleStep} />
    </div>
  )
}

// ─── Artifact Grid ────────────────────────────────────────────────────────────

function ArtifactGrid({ stack }: { stack: FinalStack }) {
  const sections = [
    <StackSummary key="s" stackName={stack.stack_name} justification={stack.justification}
      total_cost={stack.total_cost} roi_estimate={stack.roi_estimate}
      time_saved_per_week={stack.time_saved_per_week} agentCount={stack.agents.length} />,
    <div key="a">
      <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em] mb-3">Agents recommandés</p>
      <div className="flex flex-col gap-1">
        {stack.agents.map((a, i) => (
          <AgentCard key={i} rank={a.rank} name={a.name} category={a.category}
            price_from={a.price_from} role={a.role} reason={a.reason}
            concrete_result={(a as any).concrete_result} website_domain={a.website_domain}
            setup_difficulty={a.setup_difficulty} time_to_value={a.time_to_value} score={a.score} />
        ))}
      </div>
    </div>,
    <ROIChart key="r" roiEstimate={stack.roi_estimate} totalCost={stack.total_cost} />,
    <StackFlow key="f" agents={stack.agents} stackName={stack.stack_name} />,
    <div key="w" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stack.quick_wins?.length > 0 && (
        <div className="bg-[#CAFF32]/5 border border-[#CAFF32]/15 rounded-xl p-5">
          <p className="font-dm-mono text-[9px] text-[#CAFF32] uppercase tracking-[0.15em] mb-3">✦ Quick wins</p>
          {stack.quick_wins.map((w, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="text-[#CAFF32] text-xs font-dm-mono flex-shrink-0">{i+1}.</span>
              <p className="text-xs text-zinc-300 leading-relaxed">{w}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em] mb-4">Résumé financier</p>
        {[
          { label: 'Coût mensuel', value: `${stack.total_cost}€`, color: 'text-white' },
          { label: 'ROI estimé', value: `+${stack.roi_estimate}%`, color: 'text-[#CAFF32]' },
          { label: 'Temps économisé', value: `${stack.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
        ].map((m, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
            <span className="text-xs text-zinc-500 font-dm-mono">{m.label}</span>
            <span className={`font-syne font-black text-sm ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>,
  ]

  return (
    <div className="flex flex-col gap-6">
      {sections.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}>
          {s}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Idle Screen ──────────────────────────────────────────────────────────────

function IdleScreen({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState('')
  const submit = () => { if (value.trim().length >= 10) onSubmit(value.trim()) }

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] blur-3xl rounded-full"
          style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="font-syne font-black text-4xl md:text-5xl text-white tracking-tight mb-4 leading-tight">
            Construis ton stack de<br /><span className="text-[#CAFF32]">super-pouvoirs</span> IA
          </h1>
          <p className="text-zinc-500 text-base font-dm-sans max-w-md mx-auto">
            Décris ton objectif — notre IA assemble le combo optimal en 30 secondes.
          </p>
        </div>

        <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden
                        focus-within:border-[#CAFF32]/50 transition-all duration-300 shadow-2xl mb-8">
          <textarea value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Ex: Je veux lancer une boutique Shopify et automatiser mon service client..."
            rows={3}
            className="w-full bg-transparent text-zinc-100 font-medium text-base px-6 pt-5 pb-2
                       outline-none resize-none placeholder:text-zinc-600 leading-relaxed" />
          <div className="flex justify-end px-5 pb-4">
            <button onClick={submit} disabled={value.trim().length < 10}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-syne font-bold text-sm
                         bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed">
              Générer mon stack →
            </button>
          </div>
        </div>

        {/* Suggestion carousel */}
        <div className="w-full overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          {[0, 1].map(row => (
            <div key={row} className="flex overflow-hidden mb-2">
              <motion.div
                animate={{ x: row === 0 ? [0, -900] : [-900, 0] }}
                transition={{ duration: row === 0 ? 40 : 50, repeat: Infinity, ease: 'linear' }}
                className="flex gap-2 whitespace-nowrap">
                {[...SUGGESTIONS, ...SUGGESTIONS, ...SUGGESTIONS].map((s, i) => (
                  <button key={i} onClick={() => setValue(s.prompt)}
                    className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-zinc-800/60
                               text-zinc-500 hover:text-zinc-200 hover:border-[#CAFF32]/30
                               text-xs font-medium transition-all">
                    {s.label}
                  </button>
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecommendPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [showTyping, setShowTyping] = useState(false)
  const [result, setResult] = useState<FinalStack | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const showRightPanel = phase === 'reasoning' || phase === 'results'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat, showTyping])

  const startChat = useCallback((objective: string) => {
    setAnswers({ objective })
    setChat([{ role: 'user', text: objective }])
    setPhase('questioning')
    setQIndex(0)
    setShowTyping(true)
    setTimeout(() => setShowTyping(false), 900)
  }, [])

  const submitAnswer = useCallback((label: string, value?: string) => {
    const q = QUESTIONS[qIndex]
    setAnswers(prev => ({ ...prev, [q.id]: value ?? label }))
    setChat(prev => [...prev, { role: 'ai', text: q.text }, { role: 'user', text: label }])
    const next = qIndex + 1
    if (next >= QUESTIONS.length) {
      setTimeout(() => setPhase('reasoning'), 300)
    } else {
      setQIndex(next)
      setShowTyping(true)
      setTimeout(() => setShowTyping(false), 900)
    }
  }, [qIndex])

  const reset = () => {
    setPhase('idle'); setQIndex(0); setAnswers({}); setChat([])
    setResult(null); setError(null); setShowTyping(false); setInputValue('')
  }

  if (phase === 'idle') return <IdleScreen onSubmit={startChat} />

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: Chat column ── */}
      <motion.div
        animate={{ width: showRightPanel ? '38%' : '100%' }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col h-full border-r border-zinc-800/60 flex-shrink-0">

        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#CAFF32] animate-pulse" />
            <span className="font-syne font-bold text-sm text-zinc-300">Raspquery AI</span>
          </div>
          <button onClick={reset}
            className="font-dm-mono text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors
                       border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg">
            ↺ Nouveau
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3 scrollbar-hide">

          {chat.map((entry, i) => (
            entry.role === 'user' ? (
              // User bubble — white/light
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-end">
                <div className="bg-white/90 text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-2.5
                               text-sm max-w-[80%] leading-relaxed font-medium shadow-sm">
                  {entry.text}
                </div>
              </motion.div>
            ) : (
              // AI message — plain text, no bubble
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="text-zinc-400 text-sm leading-relaxed px-1 max-w-[90%]">
                {entry.text}
              </motion.div>
            )
          ))}

          {/* Typing indicator */}
          {phase === 'questioning' && showTyping && (
            <div className="flex gap-1 px-1 py-2">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          )}

          {/* Current question */}
          {phase === 'questioning' && !showTyping && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-zinc-300 text-sm leading-relaxed px-1 font-medium">
              {QUESTIONS[qIndex].text}
            </motion.div>
          )}

          {/* Error in chat */}
          {phase === 'error' && error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
              {error.type === 'rate-limit' ? (
                <>
                  <p className="text-sm text-zinc-300">
                    Limite atteinte {error.plan ? `(plan ${error.plan})` : ''}.
                    {error.resetAt && ` Disponible le ${new Date(error.resetAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`}
                  </p>
                  <a href="/dashboard/settings"
                    className="inline-flex items-center gap-1 bg-[#CAFF32] text-zinc-900 font-bold
                               text-xs px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors w-fit">
                    Passer en Pro →
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-300">{error.message}</p>
                  <button onClick={() => { setError(null); setPhase('reasoning') }}
                    className="border border-zinc-700 text-zinc-400 font-dm-mono text-xs px-4 py-2
                               rounded-lg hover:border-zinc-500 transition-colors w-fit">
                    ↺ Réessayer
                  </button>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Input area */}
        <AnimatePresence>
          {phase === 'questioning' && !showTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex-shrink-0 border-t border-zinc-800/60 px-4 py-4">
              {QUESTIONS[qIndex].type === 'chips' && QUESTIONS[qIndex].chips ? (
                <div className="flex flex-wrap gap-2">
                  {QUESTIONS[qIndex].chips!.map(chip => (
                    <button key={chip.value} onClick={() => submitAnswer(chip.label, chip.value)}
                      className="px-4 py-2 rounded-full border border-zinc-700 text-xs text-zinc-400
                                 hover:border-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50
                                 transition-all font-dm-mono">
                      {chip.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input autoFocus value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
                        e.preventDefault(); submitAnswer(inputValue.trim()); setInputValue('')
                      }
                    }}
                    placeholder="Envoyer un message..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm
                               text-zinc-200 outline-none focus:border-zinc-600 placeholder:text-zinc-600
                               transition-colors" />
                  <button onClick={() => { if (inputValue.trim()) { submitAnswer(inputValue.trim()); setInputValue('') } }}
                    disabled={!inputValue.trim()}
                    className="bg-white text-zinc-900 font-bold px-4 py-2.5 rounded-xl text-sm
                               hover:bg-zinc-100 transition-colors disabled:opacity-30">
                    →
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── RIGHT: Reasoning / Results panel ── */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 h-full overflow-hidden bg-zinc-950">
            <RightPanel phase={phase as 'reasoning' | 'results'} answers={answers}
              result={result}
              onComplete={r => { setResult(r); setPhase('results') }}
              onError={e => { setError(e); setPhase('error') }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
