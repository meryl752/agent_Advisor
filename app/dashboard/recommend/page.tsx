'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FinalStack } from '@/lib/agents/types'
import AgentCard from '@/app/components/ui/AgentCard'

// Lazy load heavy components — only loaded when results are shown
const StackFlow = dynamic(() => import('@/app/components/ui/StackFlow'), { ssr: false })
const StackSummary = dynamic(() => import('@/app/components/ui/StackSummary'), { ssr: false })
const ROIChart = dynamic(() => import('@/app/components/ui/ROIChart'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'chat' | 'reasoning' | 'results' | 'error'

interface Message {
  role: 'user' | 'ai'
  text: string
  isTyping?: boolean
}

interface ApiError {
  type: 'rate-limit' | 'server'
  message: string
  plan?: string
  resetAt?: string
}

// ─── Reasoning steps ─────────────────────────────────────────────────────────

const REASONING_STEPS = [
  { label: 'Analyse de ton objectif', sub: ['Extraction des mots-clés métier', 'Identification des cas d\'usage', 'Détection du secteur et contexte'] },
  { label: 'Recherche dans la base d\'agents', sub: ['Scan de 200+ outils IA', 'Filtrage par budget et niveau technique', 'Scoring ROI par profil'] },
  { label: 'Optimisation du stack', sub: ['Calcul des synergies entre outils', 'Vérification de la compatibilité', 'Ajustement au budget'] },
  { label: 'Assemblage du stack final', sub: ['Classement par priorité d\'implémentation', 'Génération des quick wins', 'Calcul du ROI projeté'] },
]

// ─── Siri Orb ─────────────────────────────────────────────────────────────────

function SiriOrb() {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 mx-auto select-none">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: `${96 + i * 44}px`, height: `${96 + i * 44}px`,
            background: `radial-gradient(circle, transparent 40%, rgba(202,255,50,${0.07 - i * 0.02}) 100%)`,
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5 + i * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }} />
      ))}
      <motion.div className="relative w-20 h-20 rounded-full"
        animate={{ scale: [1, 1.06, 0.97, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at 35% 30%, #f0ffb0, #CAFF32 25%, #4ade80 50%, #06b6d4 72%, #818cf8 100%)',
          boxShadow: '0 0 35px rgba(202,255,50,0.55), 0 0 70px rgba(202,255,50,0.18), 0 0 100px rgba(129,140,248,0.12)',
        }}>
        <motion.div className="absolute inset-0 rounded-full"
          animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          style={{ background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.28) 18%, transparent 38%, rgba(255,255,255,0.12) 58%, transparent 78%)' }} />
        <div className="absolute top-2.5 left-3.5 w-5 h-3 rounded-full bg-white/35 blur-sm" />
      </motion.div>
      {[...Array(5)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-[#CAFF32]"
          style={{ left: `${18 + i * 14}%`, top: `${12 + (i % 3) * 28}%` }}
          animate={{ y: [0, -10, 0, 6, 0], opacity: [0, 1, 0.4, 1, 0], scale: [0.4, 1, 0.6, 1, 0.4] }}
          transition={{ duration: 2.2 + i * 0.4, repeat: Infinity, delay: i * 0.35 }} />
      ))}
    </div>
  )
}

// ─── Reasoning Steps ──────────────────────────────────────────────────────────

function ReasoningSteps({ visibleStep }: { visibleStep: number }) {
  return (
    <div className="flex flex-col gap-0.5 w-full max-w-xs mx-auto">
      {REASONING_STEPS.map((step, i) => {
        const done = i < visibleStep
        const active = i === visibleStep
        return (
          <motion.div key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: i <= visibleStep ? 1 : 0.2, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}>
            <div className="flex items-center gap-2.5 py-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                done ? 'bg-[#CAFF32]' : active ? 'border border-[#CAFF32]/60 bg-[#CAFF32]/10' : 'border border-zinc-700'
              }`}>
                {done ? <span className="text-zinc-900 text-[8px] font-black">✓</span>
                  : active ? <motion.div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32]"
                      animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
                  : null}
              </div>
              <span className={`text-sm font-medium transition-colors duration-300 ${done ? 'text-zinc-400' : active ? 'text-white' : 'text-zinc-600'}`}>
                {step.label}
              </span>
            </div>
            <AnimatePresence>
              {(done || active) && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }}
                  className="ml-6 border-l border-zinc-800 pl-3 mb-1 overflow-hidden">
                  {step.sub.map((s, j) => (
                    <motion.div key={j} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: j * 0.12 }} className="flex items-center gap-2 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-zinc-700 flex-shrink-0" />
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

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({ answers, result, isResults, onComplete, onError }: {
  answers: Record<string, string>
  result: FinalStack | null
  isResults: boolean
  onComplete: (r: FinalStack) => void
  onError: (e: ApiError) => void
}) {
  const [visibleStep, setVisibleStep] = useState(0)
  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)

  const tryComplete = useCallback(() => {
    if (apiDone.current && allShown.current && resultRef.current) {
      setTimeout(() => onComplete(resultRef.current!), 500)
    }
  }, [onComplete])

  useEffect(() => {
    if (isResults) return
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective: answers.objective, sector: answers.sector ?? 'général',
        budget: answers.budget ?? 'medium', tech_level: answers.tech_level ?? 'intermediate',
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
      apiDone.current = true
      tryComplete()
    }).catch(() => onError({ type: 'server', message: 'Erreur réseau' }))

    REASONING_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleStep(i)
        if (i === REASONING_STEPS.length - 1) { allShown.current = true; tryComplete() }
      }, 700 + i * 1300)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isResults && result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="h-full overflow-y-auto px-6 py-6 scrollbar-hide">
        <div className="flex flex-col gap-6">
          {[
            <StackSummary key="s" stackName={result.stack_name} justification={result.justification}
              total_cost={result.total_cost} roi_estimate={result.roi_estimate}
              time_saved_per_week={result.time_saved_per_week} agentCount={result.agents.length} />,
            <div key="a">
              <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em] mb-3">Agents recommandés</p>
              <div className="flex flex-col gap-1">
                {result.agents.map((a, i) => (
                  <AgentCard key={i} rank={a.rank} name={a.name} category={a.category}
                    price_from={a.price_from} role={a.role} reason={a.reason}
                    concrete_result={(a as any).concrete_result} website_domain={a.website_domain}
                    setup_difficulty={a.setup_difficulty} time_to_value={a.time_to_value} score={a.score} />
                ))}
              </div>
            </div>,
            <ROIChart key="r" roiEstimate={result.roi_estimate} totalCost={result.total_cost} timeSavedPerWeek={result.time_saved_per_week} />,
            <StackFlow key="f" agents={result.agents} stackName={result.stack_name} />,
            <div key="w" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.quick_wins?.length > 0 && (
                <div className="bg-[#CAFF32]/5 border border-[#CAFF32]/15 rounded-xl p-5">
                  <p className="font-dm-mono text-[9px] text-[#CAFF32] uppercase tracking-[0.15em] mb-3">✦ Quick wins</p>
                  {result.quick_wins.map((w, i) => (
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
                  { label: 'Coût mensuel', value: `${result.total_cost}€`, color: 'text-white' },
                  { label: 'ROI estimé', value: `+${result.roi_estimate}%`, color: 'text-[#CAFF32]' },
                  { label: 'Temps économisé', value: `${result.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
                ].map((m, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-xs text-zinc-500 font-dm-mono">{m.label}</span>
                    <span className={`font-syne font-black text-sm ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>,
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}>{s}</motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-10 gap-8">
      <div className="text-center">
        <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-1">En cours</p>
        <p className="font-syne font-black text-white text-xl">Construction de ton stack</p>
      </div>
      <SiriOrb />
      <ReasoningSteps visibleStep={visibleStep} />
    </div>
  )
}

// ─── Context extraction from any message ─────────────────────────────────────

function extractContext(text: string): {
  sector: string | null
  budget: string | null
  tech: string | null
} {
  const lower = text.toLowerCase()

  const sector =
    lower.includes('ecommerce') || lower.includes('shopify') || lower.includes('boutique') || lower.includes('dropshipping') ? 'e-commerce'
    : lower.includes('saas') || lower.includes('logiciel') || lower.includes('software') ? 'saas'
    : lower.includes('agence') ? 'agence'
    : lower.includes('consultant') || lower.includes('freelance') ? 'consultant'
    : lower.includes('créateur') || lower.includes('youtube') || lower.includes('instagram') || lower.includes('tiktok') ? 'createur'
    : lower.includes('b2b') || lower.includes('entreprise') || lower.includes('prospection') ? 'b2b'
    : null

  const budget =
    lower.includes('gratuit') || lower.includes('0€') || lower.includes('sans budget') ? 'zero'
    : lower.includes('200') ? 'medium'
    : lower.includes('50') ? 'low'
    : lower.includes('500') || lower.includes('1000') || lower.includes('illimité') ? 'high'
    : null

  const tech =
    lower.includes('débutant') || lower.includes('novice') || lower.includes('pas technique') || lower.includes('non technique') ? 'beginner'
    : lower.includes('avancé') || lower.includes('développeur') || lower.includes('dev ') || lower.includes('expert') ? 'advanced'
    : lower.includes('intermédiaire') || lower.includes('no-code') ? 'intermediate'
    : null

  return { sector, budget, tech }
}

export default function RecommendPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FinalStack | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const showRight = phase === 'reasoning' || phase === 'results'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  // Add AI message with typing delay
  const addAIMessage = useCallback((text: string, delay = 600) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'ai', text }])
    }, delay)
  }, [])

  // Start: user sends first message from idle
  const handleFirstSend = useCallback((text: string) => {
    if (!text.trim()) return
    setPhase('chat')
    setMessages([{ role: 'user', text }])
    setInput('')

    // Try to extract context from the first message itself
    const ctx = extractContext(text)
    const newAnswers: Record<string, string> = {
      objective: text,
      sector: ctx.sector ?? 'général',
      budget: ctx.budget ?? 'medium',
      tech_level: ctx.tech ?? 'intermediate',
    }
    setAnswers(newAnswers)

    // If we got enough context, go straight to reasoning
    if (ctx.sector && ctx.budget) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'ai', text: "Parfait, j'ai tout ce qu'il me faut. Je construis ton stack..." }])
        setTimeout(() => setPhase('reasoning'), 400)
      }, 600)
    } else {
      // Ask only for what's missing
      const missing = []
      if (!ctx.sector) missing.push('ton secteur d\'activité')
      if (!ctx.budget) missing.push('ton budget mensuel pour les outils IA')
      addAIMessage(`Pour affiner les recommandations, dis-moi ${missing.join(' et ')}.`, 800)
    }
  }, [addAIMessage])

  // Second message: extract remaining context and launch
  const handleContextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const ctx = extractContext(text)
      setAnswers(prev => ({
        ...prev,
        sector: ctx.sector ?? prev.sector ?? 'général',
        budget: ctx.budget ?? prev.budget ?? 'medium',
        tech_level: ctx.tech ?? prev.tech_level ?? 'intermediate',
      }))
      setMessages(prev => [...prev, { role: 'ai', text: "Super, je construis ton stack maintenant..." }])
      setTimeout(() => setPhase('reasoning'), 400)
    }, 700)
  }, [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    if (phase === 'idle') { handleFirstSend(text); return }
    if (phase === 'chat') { handleContextMessage(text); return }
  }, [input, phase, handleFirstSend, handleContextMessage])

  const reset = () => {
    setPhase('idle'); setMessages([]); setAnswers({})
    setResult(null); setError(null); setInput(''); setIsTyping(false)
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent 70%)' }} />
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="font-syne font-black text-4xl md:text-5xl text-white tracking-tight mb-4 leading-tight">
              Quel est ton objectif ?
            </h1>
            <p className="text-zinc-500 text-base font-dm-sans max-w-md mx-auto">
              Décris ce que tu veux accomplir — on s'occupe du reste.
            </p>
          </div>
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden
                          focus-within:border-[#CAFF32]/50 transition-all duration-300 shadow-2xl">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ex: Je veux lancer une boutique Shopify et automatiser mon service client..."
              rows={3}
              className="w-full bg-transparent text-zinc-100 font-medium text-base px-6 pt-5 pb-2
                         outline-none resize-none placeholder:text-zinc-600 leading-relaxed" />
            <div className="flex justify-end px-5 pb-4">
              <button onClick={handleSend} disabled={input.trim().length < 5}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-syne font-bold text-sm
                           bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed">
                Générer mon stack →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── CHAT + SPLIT LAYOUT ───────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Chat */}
      <motion.div
        layout
        animate={{ width: showRight ? '40%' : '100%' }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col h-full border-r border-zinc-800/50 overflow-hidden">

        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <motion.div className="w-2 h-2 rounded-full bg-[#CAFF32]"
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="font-syne font-bold text-sm text-zinc-300">Raspquery AI</span>
          </div>
          <button onClick={reset}
            className="font-dm-mono text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors
                       border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg">
            ↺ Nouveau
          </button>
        </div>

        {/* Messages — centered column */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          <div className="max-w-lg mx-auto px-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {msg.role === 'user' ? (
                  <div className="bg-white/90 text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-3
                                  text-sm max-w-[85%] leading-relaxed font-medium shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="text-zinc-300 text-sm leading-relaxed max-w-[90%]">
                    {msg.text}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }} className="flex gap-1.5 py-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-zinc-600"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {phase === 'error' && error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-sm text-zinc-300">
                  {error.type === 'rate-limit'
                    ? `Limite atteinte${error.plan ? ` (plan ${error.plan})` : ''}.${error.resetAt ? ` Disponible le ${new Date(error.resetAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : ''}`
                    : error.message}
                </p>
                {error.type === 'rate-limit'
                  ? <a href="/dashboard/settings" className="inline-flex items-center gap-1 bg-[#CAFF32] text-zinc-900 font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors w-fit">Passer en Pro →</a>
                  : <button onClick={() => { setError(null); setPhase('reasoning') }} className="border border-zinc-700 text-zinc-400 font-dm-mono text-xs px-4 py-2 rounded-lg hover:border-zinc-500 transition-colors w-fit">↺ Réessayer</button>
                }
              </motion.div>
            )}
          </div>
        </div>

        {/* Input — always visible during chat */}
        <AnimatePresence>
          {phase === 'chat' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }}
              className="flex-shrink-0 border-t border-zinc-800/50 px-4 py-3">
              <div className="max-w-lg mx-auto flex gap-2 items-end">
                <textarea ref={inputRef} value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Envoyer un message..."
                  rows={1}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm
                             text-zinc-200 outline-none focus:border-zinc-600 placeholder:text-zinc-600
                             transition-colors resize-none leading-relaxed" />
                <button onClick={handleSend} disabled={!input.trim()}
                  className="bg-white text-zinc-900 font-bold px-4 py-3 rounded-xl text-sm
                             hover:bg-zinc-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
                  →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right: Reasoning / Results */}
      <AnimatePresence>
        {showRight && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 h-full overflow-hidden bg-zinc-950/80">
            <RightPanel answers={answers} result={result} isResults={phase === 'results'}
              onComplete={r => { setResult(r); setPhase('results') }}
              onError={e => { setError(e); setPhase('error') }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
