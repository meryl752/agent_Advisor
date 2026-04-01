'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FinalStack } from '@/lib/agents/types'
import AgentCard from '@/app/components/ui/AgentCard'

const StackFlow = dynamic(() => import('@/app/components/ui/StackFlow'), { ssr: false })
const StackSummary = dynamic(() => import('@/app/components/ui/StackSummary'), { ssr: false })
const ROIChart = dynamic(() => import('@/app/components/ui/ROIChart'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'chat' | 'reasoning' | 'results' | 'error'

interface Message {
  role: 'user' | 'ai' | 'reasoning'
  text?: string
  steps?: { label: string; done: boolean; active: boolean }[]
}

interface ApiError {
  type: 'rate-limit' | 'server'
  message: string
  plan?: string
  resetAt?: string
}

// ─── Reasoning steps ─────────────────────────────────────────────────────────

const REASONING_STEPS = [
  'Analyse de ton objectif...',
  'Scan de 200+ agents IA...',
  'Optimisation du budget...',
  'Assemblage du stack final...',
]

// ─── Context extraction ───────────────────────────────────────────────────────

function extractContext(text: string) {
  const lower = text.toLowerCase()
  const sector =
    lower.includes('ecommerce') || lower.includes('shopify') || lower.includes('boutique') || lower.includes('dropshipping') ? 'e-commerce'
    : lower.includes('saas') || lower.includes('logiciel') ? 'saas'
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
    lower.includes('débutant') || lower.includes('novice') || lower.includes('pas technique') ? 'beginner'
    : lower.includes('avancé') || lower.includes('développeur') || lower.includes('expert') ? 'advanced'
    : lower.includes('intermédiaire') || lower.includes('no-code') ? 'intermediate'
    : null
  return { sector, budget, tech }
}

// ─── Inline Reasoning Message ─────────────────────────────────────────────────

function ReasoningMessage({ visibleStep }: { visibleStep: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 max-w-[90%]">
      {REASONING_STEPS.map((step, i) => {
        if (i > visibleStep) return null
        const done = i < visibleStep
        const active = i === visibleStep
        return (
          <motion.div key={i}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            className="flex items-center gap-2.5">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              done ? 'bg-[#CAFF32]' : active ? 'border border-[#CAFF32]/60' : 'border border-zinc-700'
            }`}>
              {done
                ? <span className="text-zinc-900 text-[7px] font-black">✓</span>
                : active
                  ? <motion.div className="w-1 h-1 rounded-full bg-[#CAFF32]"
                      animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                  : null}
            </div>
            <span className={`text-xs transition-colors duration-300 ${done ? 'text-zinc-500' : active ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {step}
            </span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({ result }: { result: FinalStack }) {
  const sections = [
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
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="h-full overflow-y-auto px-6 py-6 scrollbar-hide">
      <div className="flex flex-col gap-6">
        {sections.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.12, ease: [0.4, 0, 0.2, 1] }}>
            {s}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecommendPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FinalStack | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [reasoningStep, setReasoningStep] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)

  const showRight = phase === 'results'

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, 100)
  }, [messages, isTyping, reasoningStep])

  const addAIMessage = useCallback((text: string, delay = 700) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { role: 'ai', text }])
    }, delay)
  }, [])

  // Launch API + reasoning animation
  const launchReasoning = useCallback((ans: Record<string, string>) => {
    setPhase('reasoning')
    setReasoningStep(0)
    apiDone.current = false
    allShown.current = false
    resultRef.current = null

    // Add reasoning message to chat
    setMessages(prev => [...prev, { role: 'reasoning' }])

    // API call
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objective: ans.objective,
        sector: ans.sector ?? 'général',
        budget: ans.budget ?? 'medium',
        tech_level: ans.tech_level ?? 'intermediate',
        team_size: 'solo', timeline: 'weeks', current_tools: [],
      }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 429
          ? { type: 'rate-limit', message: data.error, plan: data.plan, resetAt: data.reset_at }
          : { type: 'server', message: data.error ?? 'Erreur serveur' })
        setPhase('error')
        return
      }
      resultRef.current = data.result
      apiDone.current = true
      if (allShown.current) {
        setTimeout(() => {
          setResult(resultRef.current)
          setMessages(prev => [...prev, { role: 'ai', text: `Voilà ton stack **${data.result.stack_name}** — ${data.result.agents.length} outils sélectionnés pour toi.` }])
          setTimeout(() => setPhase('results'), 800)
        }, 500)
      }
    }).catch(() => {
      setError({ type: 'server', message: 'Erreur réseau' })
      setPhase('error')
    })

    // Animate steps
    REASONING_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setReasoningStep(i)
        if (i === REASONING_STEPS.length - 1) {
          allShown.current = true
          if (apiDone.current && resultRef.current) {
            setTimeout(() => {
              setResult(resultRef.current)
              setMessages(prev => [...prev, { role: 'ai', text: `Voilà ton stack — ${resultRef.current!.agents.length} outils sélectionnés pour toi.` }])
              setTimeout(() => setPhase('results'), 800)
            }, 500)
          }
        }
      }, 600 + i * 1200)
    })
  }, [])

  const handleFirstSend = useCallback((text: string) => {
    if (!text.trim()) return
    setPhase('chat')
    setMessages([{ role: 'user', text }])
    setInput('')
    const ctx = extractContext(text)
    const ans: Record<string, string> = {
      objective: text,
      sector: ctx.sector ?? 'général',
      budget: ctx.budget ?? 'medium',
      tech_level: ctx.tech ?? 'intermediate',
    }
    setAnswers(ans)

    if (ctx.sector && ctx.budget) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'ai', text: "Parfait, j'analyse ça maintenant." }])
        setTimeout(() => launchReasoning(ans), 600)
      }, 700)
    } else {
      const missing = []
      if (!ctx.sector) missing.push('ton secteur')
      if (!ctx.budget) missing.push('ton budget mensuel')
      addAIMessage(`Pour affiner les recommandations, dis-moi ${missing.join(' et ')}.`, 800)
    }
  }, [addAIMessage, launchReasoning])

  const handleContextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const ctx = extractContext(text)
      const ans = {
        ...answers,
        sector: ctx.sector ?? answers.sector ?? 'général',
        budget: ctx.budget ?? answers.budget ?? 'medium',
        tech_level: ctx.tech ?? answers.tech_level ?? 'intermediate',
      }
      setAnswers(ans)
      setMessages(prev => [...prev, { role: 'ai', text: "Super, je construis ton stack." }])
      setTimeout(() => launchReasoning(ans), 600)
    }, 700)
  }, [answers, launchReasoning])

  // After results: continue chatting with AI about the stack
  const handleFollowUp = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setIsTyping(true)

    // Use stack-chat API if we have a result, otherwise answer generically
    if (result) {
      fetch('/api/stack-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          stackContext: {
            stack_name: result.stack_name,
            objective: answers.objective ?? '',
            total_cost: result.total_cost,
            agents: result.agents.map(a => ({ name: a.name, role: a.role })),
          },
        }),
      })
        .then(r => r.json())
        .then(data => {
          setIsTyping(false)
          setMessages(prev => [...prev, { role: 'ai', text: data.response ?? "Je ne peux pas répondre à ça pour l'instant." }])
        })
        .catch(() => {
          setIsTyping(false)
          setMessages(prev => [...prev, { role: 'ai', text: "Une erreur est survenue. Réessaie." }])
        })
    } else {
      setTimeout(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'ai', text: "Génère d'abord un stack pour que je puisse répondre à tes questions." }])
      }, 600)
    }
  }, [result, answers])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    if (phase === 'idle') { handleFirstSend(text); return }
    if (phase === 'chat') { handleContextMessage(text); return }
    if (phase === 'results') { handleFollowUp(text); return }
  }, [input, phase, handleFirstSend, handleContextMessage, handleFollowUp])

  const reset = () => {
    setPhase('idle'); setMessages([]); setAnswers({})
    setResult(null); setError(null); setInput(''); setIsTyping(false)
    setReasoningStep(0); apiDone.current = false; allShown.current = false
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
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>
            {/* Inner glass highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ex: Je veux automatiser mon service client Shopify, budget 50€, débutant..."
              rows={3}
              className="w-full bg-transparent text-white font-medium text-base px-6 pt-5 pb-2
                         outline-none resize-none placeholder:text-zinc-500 leading-relaxed" />
            <div className="flex justify-end px-5 pb-4">
              <button onClick={handleSend} disabled={input.trim().length < 5}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-syne font-bold text-sm
                           bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed">
                Générer →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── CHAT + OPTIONAL SPLIT ─────────────────────────────────────────────────
  return (
    <motion.div layout className="flex h-full overflow-hidden">

      {/* Left: Chat — always visible */}
      <motion.div layout
        animate={{ width: showRight ? '42%' : '100%' }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col h-full border-r border-zinc-800/50 overflow-hidden flex-shrink-0">

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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-6 scrollbar-hide">
          <div className="max-w-lg mx-auto px-4 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {msg.role === 'user' ? (
                  <div className="bg-white/90 text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-3
                                  text-sm max-w-[85%] leading-relaxed font-medium shadow-sm">
                    {msg.text}
                  </div>
                ) : msg.role === 'reasoning' ? (
                  <ReasoningMessage visibleStep={reasoningStep} />
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-zinc-300 text-sm leading-relaxed max-w-[90%]">
                    {msg.text}
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Typing dots */}
            <AnimatePresence>
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} className="flex gap-1.5 py-1">
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
                  ? <a href="/dashboard/billing" className="inline-flex items-center gap-1 bg-[#CAFF32] text-zinc-900 font-bold text-xs px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors w-fit">Passer en Pro →</a>
                  : <button onClick={() => { setError(null); if (Object.keys(answers).length > 0) launchReasoning(answers) }}
                      className="border border-zinc-700 text-zinc-400 font-dm-mono text-xs px-4 py-2 rounded-lg hover:border-zinc-500 transition-colors w-fit">↺ Réessayer</button>
                }
              </motion.div>
            )}
          </div>
        </div>

        {/* Input — always visible in chat/results */}
        <AnimatePresence>
          {(phase === 'chat' || phase === 'results') && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.35 }}
              className="flex-shrink-0 border-t border-zinc-800/50 px-4 py-3">
              <div className="max-w-lg mx-auto">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <textarea ref={inputRef} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={phase === 'results' ? "Pose une question sur ce stack..." : "Envoyer un message..."}
                    rows={2}
                    className="w-full bg-transparent text-zinc-200 text-sm px-4 pt-3 pb-10
                               outline-none resize-none placeholder:text-zinc-600 leading-relaxed" />
                  <div className="absolute bottom-2.5 right-2.5">
                    <button onClick={handleSend} disabled={!input.trim()}
                      className="w-8 h-8 rounded-lg bg-[#CAFF32] text-zinc-900 font-bold text-sm
                                 hover:bg-[#d4ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed
                                 flex items-center justify-center">
                      ↑
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right: Results — slides in smoothly */}
      <AnimatePresence>
        {showRight && result && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            className="flex-1 h-full overflow-hidden bg-zinc-950/80 border-l border-zinc-800/30">
            <ResultsPanel result={result} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
