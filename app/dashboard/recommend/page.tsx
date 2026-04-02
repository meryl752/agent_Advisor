'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FinalStack } from '@/lib/agents/types'
import { useSidebar } from '@/app/dashboard/layout'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/app/components/ThemeToggle'
import Link from 'next/link'

const StackRoadmap = dynamic(() => import('@/app/components/ui/StackRoadmap'), { ssr: false })
const StackFeedback = dynamic(() => import('@/app/components/ui/StackFeedback'), { ssr: false })

type Phase = 'idle' | 'chat' | 'reasoning' | 'results' | 'error'
interface Message { role: 'user' | 'ai' | 'reasoning'; text?: string }
interface ApiError { type: 'rate-limit' | 'server'; message: string; plan?: string; resetAt?: string }

const REASONING_STEPS = [
  'Analyse de ton objectif...',
  'Scan de 200+ agents IA...',
  'Optimisation du budget...',
  'Assemblage du stack final...',
  'Recherche de documentation...',
  'Génération des guides d\'implémentation...',
]

const SUGGESTIONS = [
  { label: 'Automatiser mon service client Shopify', prompt: "J'aimerais automatiser le service client au niveau de ma plateforme Shopify" },
  { label: 'Augmenter ma prospection B2B', prompt: "J'aimerais augmenter la rapidité à laquelle j'atteins mes clients dans mon business B2B" },
  { label: 'Créer du contenu Instagram en masse', prompt: "Je veux créer du contenu Instagram de qualité en grande quantité avec l'IA" },
  { label: "Automatiser ma gestion d'inventaire", prompt: "Mettre en place un système intelligent pour automatiser ma gestion d'inventaire" },
  { label: 'Analyser mes données clients', prompt: "J'aimerais analyser mes données clients pour prédire les futures tendantes" },
  { label: 'Optimiser mes processus de vente', prompt: "Je souhaite optimiser mes processus de vente avec l'IA pour gagner du temps" },
]

const MODELS = ['Gemini 2.0', 'Llama 3.3', 'GPT-4o']

function extractContext(text: string) {
  const lower = text.toLowerCase()
  const sector =
    lower.includes('ecommerce') || lower.includes('shopify') || lower.includes('boutique') ? 'e-commerce'
    : lower.includes('saas') || lower.includes('logiciel') ? 'saas'
    : lower.includes('agence') ? 'agence'
    : lower.includes('consultant') || lower.includes('freelance') ? 'consultant'
    : lower.includes('créateur') || lower.includes('youtube') || lower.includes('instagram') ? 'createur'
    : lower.includes('b2b') || lower.includes('entreprise') || lower.includes('prospection') ? 'b2b'
    : null
  const budget =
    lower.includes('gratuit') || lower.includes('0€') ? 'zero'
    : lower.includes('200') ? 'medium'
    : lower.includes('50') ? 'low'
    : lower.includes('500') || lower.includes('1000') ? 'high'
    : null
  const tech =
    lower.includes('débutant') || lower.includes('novice') ? 'beginner'
    : lower.includes('avancé') || lower.includes('développeur') ? 'advanced'
    : lower.includes('intermédiaire') || lower.includes('no-code') ? 'intermediate'
    : null
  return { sector, budget, tech }
}

function ModelSelector() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(MODELS[0])
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-zinc-300 hover:text-white transition-colors">
        <span className="text-[10px] tracking-wider">{selected}</span>
        <span className="text-zinc-500 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 min-w-[120px]">
          {MODELS.map(m => (
            <button key={m} onClick={() => { setSelected(m); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-zinc-800 ${m === selected ? 'text-white' : 'text-zinc-400'}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Agent log — floating, no borders ────────────────────────────────────────

function AgentLog({ messages, reasoningStep, isTyping, phase, error, onRetry }: {
  messages: Message[]
  reasoningStep: number
  isTyping: boolean
  phase: Phase
  error: ApiError | null
  onRetry: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setTimeout(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, 80)
  }, [messages, isTyping, reasoningStep])

  return (
    <div ref={ref} className="flex-1 overflow-y-auto py-5 px-4 scrollbar-hide flex flex-col gap-4">
      {messages.map((msg, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {msg.role === 'user' ? (
            /* User bubble — white with dark text like the screenshot */
            <div className="bg-white text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed font-medium shadow-sm self-end max-w-[90%] ml-auto">
              {msg.text}
            </div>
          ) : msg.role === 'reasoning' ? (
            /* Reasoning steps with dotted timeline */
            <div className="flex flex-col">
              {REASONING_STEPS.map((step, si) => {
                if (si > reasoningStep) return null
                const done = si < reasoningStep
                const active = si === reasoningStep
                return (
                  <div key={si} className="relative flex items-start gap-2.5">
                    {/* Dotted line between steps */}
                    {si > 0 && (
                      <div className="absolute left-[7px] -top-3 w-px h-3"
                        style={{ background: 'repeating-linear-gradient(to bottom, #3f3f46 0px, #3f3f46 2px, transparent 2px, transparent 5px)' }} />
                    )}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
                        done ? 'bg-[#CAFF32]' : active ? 'border border-[#CAFF32]/60' : 'border border-zinc-700'
                      }`}>
                      {done ? <span className="text-zinc-900 text-[7px] font-black">✓</span>
                        : active ? <motion.div className="w-1 h-1 rounded-full bg-[#CAFF32]"
                            animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} /> : null}
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-xs pb-3 leading-relaxed ${done ? 'text-zinc-600' : active ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {step}
                    </motion.p>
                  </div>
                )
              })}
            </div>
          ) : (
            /* AI message */
            <p className="text-xs text-zinc-400 leading-relaxed">{msg.text}</p>
          )}
        </motion.div>
      ))}

      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 py-1">
          {[0,1,2].map(i => <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />)}
        </motion.div>
      )}

      {phase === 'error' && error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs text-zinc-300">{error.type === 'rate-limit' ? 'Limite atteinte.' : error.message}</p>
          {error.type === 'rate-limit'
            ? <a href="/dashboard/billing" className="text-[10px] text-[#CAFF32] hover:underline">Passer en Pro →</a>
            : <button onClick={onRetry} className="text-[10px] text-zinc-400 hover:text-white transition-colors text-left">↺ Réessayer</button>}
        </motion.div>
      )}
    </div>
  )
}

// ─── Canvas area ──────────────────────────────────────────────────────────────

function CanvasArea({ result, objective, streamedCount, stackId }: {
  result: FinalStack | null; objective: string; streamedCount: number; stackId?: string
}) {
  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-700 text-sm">La roadmap apparaîtra ici...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-hide">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <StackRoadmap agents={result.agents} stackName={result.stack_name} objective={objective} streamedCount={streamedCount} />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-zinc-800 p-5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Résumé financier</p>
          {[
            { label: 'Coût mensuel', value: `${result.total_cost}€`, color: 'text-white' },
            { label: 'ROI estimé', value: `+${result.roi_estimate}%`, color: 'text-[#CAFF32]' },
            { label: 'Temps économisé', value: `${result.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
          ].map((m, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500">{m.label}</span>
              <span className={`font-semibold text-sm ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </motion.div>

        {stackId && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
            <StackFeedback stackId={stackId} agents={result.agents} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── Bottom input ─────────────────────────────────────────────────────────────

function BottomInput({ value, onChange, onSend, phase, disabled }: {
  value: string; onChange: (v: string) => void; onSend: () => void; phase: Phase; disabled?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex-shrink-0 px-6 py-4">
      <div className="max-w-2xl mx-auto relative rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
          placeholder={phase === 'results' ? "Pose une question sur ce stack..." : "Envoyer un message..."}
          rows={2} disabled={disabled}
          className="w-full bg-transparent text-zinc-200 text-sm px-4 pt-3 pb-10 outline-none resize-none placeholder:text-zinc-600 leading-relaxed disabled:opacity-40" />
        <div className="absolute bottom-2.5 right-3">
          <button onClick={onSend} disabled={!value.trim() || disabled}
            className="w-8 h-8 rounded-lg bg-[#CAFF32] text-zinc-900 font-bold text-sm hover:bg-[#d4ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center">↑</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

// ─── Nav menu (sidebar links in session mode) ─────────────────────────────────

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/recommend', label: 'Construis ton stack', icon: '✦' },
  { href: '/dashboard/stack', label: 'Mes stacks', icon: '⬡' },
  { href: '/dashboard/blueprint', label: 'StackMap', icon: '◉' },
  { href: '/dashboard/alerts', label: 'Stack Alerts', icon: '◎' },
  { href: '/dashboard/score', label: 'Stack Score', icon: '◐' },
  { href: '/dashboard/billing', label: 'Facturation', icon: '◈' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: '⚙' },
]

function NavMenu({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600">
        <span className="text-sm">{open ? '✕' : '☰'}</span>
        <span className="text-[10px] tracking-wider">Menu</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden z-50 min-w-[200px] shadow-2xl"
          >
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => { setOpen(false); onReset() }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function RecommendPage() {
  const { setCollapsed } = useSidebar()
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FinalStack | null>(null)
  const [savedStackId, setSavedStackId] = useState<string | undefined>()
  const [error, setError] = useState<ApiError | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [reasoningStep, setReasoningStep] = useState(0)
  const [streamedCount, setStreamedCount] = useState(0)
  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)
  const inSession = phase !== 'idle'

  // Collapse sidebar when session starts, restore on reset
  useEffect(() => { setCollapsed(inSession) }, [inSession, setCollapsed])

  const addAIMessage = useCallback((text: string, delay = 700) => {
    setIsTyping(true)
    setTimeout(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'ai', text }]) }, delay)
  }, [])

  const revealStack = useCallback((stack: FinalStack, stackId?: string) => {
    setResult(stack); setSavedStackId(stackId); setPhase('results'); setStreamedCount(0)
    stack.agents.forEach((_, idx) => { setTimeout(() => setStreamedCount(idx + 1), idx * 220) })

    // Fetch guides async — stream results back and enrich agents one by one
    fetch('/api/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agents: stack.agents,
        ctx: { objective: stack.stack_name, tech_level: 'intermediate' },
      }),
    }).then(async res => {
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const { idx, agent } = JSON.parse(line)
            setResult(prev => {
              if (!prev) return prev
              const agents = [...prev.agents]
              agents[idx] = agent
              return { ...prev, agents }
            })
          } catch { /* skip malformed line */ }
        }
      }
    }).catch(err => console.warn('[Guides] Stream error:', err))
  }, [])

  const launchReasoning = useCallback((ans: Record<string, string>) => {
    setPhase('reasoning'); setReasoningStep(0)
    apiDone.current = false; allShown.current = false; resultRef.current = null
    setMessages(prev => [...prev, { role: 'reasoning' }])

    fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective: ans.objective, sector: ans.sector ?? 'général', budget: ans.budget ?? 'medium', tech_level: ans.tech_level ?? 'intermediate', team_size: 'solo', timeline: 'weeks', current_tools: [] }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 429 ? { type: 'rate-limit', message: data.error, plan: data.plan, resetAt: data.reset_at } : { type: 'server', message: data.error ?? 'Erreur serveur' })
        setPhase('error'); return
      }
      resultRef.current = data.result; apiDone.current = true
      if (allShown.current) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: `Stack prêt — ${data.result.agents.length} outils avec guides d'implémentation.` }])
          revealStack(data.result, data.stackId)
        }, 400)
      }
    }).catch(() => { setError({ type: 'server', message: 'Erreur réseau' }); setPhase('error') })

    REASONING_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setReasoningStep(i)
        if (i === REASONING_STEPS.length - 1) {
          allShown.current = true
          if (apiDone.current && resultRef.current) {
            setTimeout(() => {
              setMessages(prev => [...prev, { role: 'ai', text: `Stack prêt — ${resultRef.current!.agents.length} outils avec guides d'implémentation.` }])
              revealStack(resultRef.current!)
            }, 400)
          }
        }
      }, 500 + i * 1000)
    })
  }, [revealStack])

  const handleFirstSend = useCallback((text: string) => {
    if (!text.trim()) return
    setPhase('chat'); setMessages([{ role: 'user', text }]); setInput('')
    const ctx = extractContext(text)
    const ans: Record<string, string> = { objective: text, sector: ctx.sector ?? 'général', budget: ctx.budget ?? 'medium', tech_level: ctx.tech ?? 'intermediate' }
    setAnswers(ans)
    if (ctx.sector && ctx.budget) {
      setIsTyping(true)
      setTimeout(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'ai', text: "Parfait, j'analyse ça maintenant." }]); setTimeout(() => launchReasoning(ans), 500) }, 600)
    } else {
      const missing: string[] = []
      if (!ctx.sector) missing.push('ton secteur')
      if (!ctx.budget) missing.push('ton budget mensuel')
      addAIMessage(`Pour affiner, dis-moi ${missing.join(' et ')}.`, 700)
    }
  }, [addAIMessage, launchReasoning])

  const handleContextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]); setInput(''); setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const ctx = extractContext(text)
      const ans = { ...answers, sector: ctx.sector ?? answers.sector ?? 'général', budget: ctx.budget ?? answers.budget ?? 'medium', tech_level: ctx.tech ?? answers.tech_level ?? 'intermediate' }
      setAnswers(ans)
      setMessages(prev => [...prev, { role: 'ai', text: "Super, je construis ton stack." }])
      setTimeout(() => launchReasoning(ans), 500)
    }, 600)
  }, [answers, launchReasoning])

  const handleFollowUp = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]); setInput(''); setIsTyping(true)
    if (result) {
      fetch('/api/stack-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, stackContext: { stack_name: result.stack_name, objective: answers.objective ?? '', total_cost: result.total_cost, agents: result.agents.map(a => ({ name: a.name, role: a.role })) } }) })
        .then(r => r.json()).then(data => { setIsTyping(false); setMessages(prev => [...prev, { role: 'ai', text: data.response ?? "Je ne peux pas répondre à ça." }]) })
        .catch(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'ai', text: "Erreur. Réessaie." }]) })
    } else {
      setTimeout(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'ai', text: "Génère d'abord un stack." }]) }, 500)
    }
  }, [result, answers])

  const handleSend = useCallback(() => {
    const text = input.trim(); if (!text) return
    if (phase === 'idle') { handleFirstSend(text); return }
    if (phase === 'chat') { handleContextMessage(text); return }
    if (phase === 'results') { handleFollowUp(text); return }
  }, [input, phase, handleFirstSend, handleContextMessage, handleFollowUp])

  const reset = () => {
    setPhase('idle'); setMessages([]); setAnswers({}); setResult(null); setSavedStackId(undefined)
    setError(null); setInput(''); setIsTyping(false); setReasoningStep(0); setStreamedCount(0)
    apiDone.current = false; allShown.current = false
  }

  // ── IDLE — centered input ──────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-2xl z-10">
          <div className="text-center mb-8">
            <h1 className="font-syne font-black text-4xl md:text-5xl text-white tracking-tight mb-3 leading-tight">Quel est ton objectif ?</h1>
            <p className="text-zinc-500 text-base max-w-md mx-auto">Décris ce que tu veux accomplir — on s'occupe du reste.</p>
          </div>

          {/* Suggestion chips */}
          <div className="w-full overflow-hidden mb-5"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
            {[0, 1].map(row => (
              <div key={row} className="flex overflow-hidden mb-2">
                <motion.div animate={{ x: row === 0 ? [0, -900] : [-900, 0] }} transition={{ duration: row === 0 ? 40 : 50, repeat: Infinity, ease: 'linear' }} className="flex gap-2 whitespace-nowrap">
                  {[...SUGGESTIONS, ...SUGGESTIONS, ...SUGGESTIONS].map((s, i) => (
                    <button key={i} onClick={() => setInput(s.prompt)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl border border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:text-zinc-200 hover:border-[#CAFF32]/30 text-xs transition-all">
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ex: Je veux automatiser mon service client Shopify, budget 50€, débutant..."
              rows={3} className="w-full bg-transparent text-white text-base px-6 pt-5 pb-2 outline-none resize-none placeholder:text-zinc-500 leading-relaxed" />
            <div className="flex items-center justify-between px-5 pb-4">
              <ModelSelector />
              <button onClick={handleSend} disabled={input.trim().length < 5}
                className="w-9 h-9 rounded-xl font-bold text-base bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center">↑</button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── SESSION — full screen layout ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 z-10"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>

      {/* Top bar — just quick actions, no title */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 relative z-20">
        {/* Left — nav menu button */}
        <NavMenu onReset={reset} />

        {/* Right — profile + theme + reset */}
        <div className="flex items-center gap-3">
          <button onClick={reset}
            className="text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg">
            ↺ Nouveau
          </button>
          <ThemeToggle />
          <UserButton appearance={{
            elements: {
              avatarBox: 'w-7 h-7 rounded-lg',
              userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
            }
          }} />
        </div>
      </div>

      {/* Body — chat left + canvas right, both on dot background */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Agent log — wider, offset from left, reduced radius */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0 flex flex-col overflow-hidden pt-2 pb-4 pl-6 pr-3"
          style={{ minWidth: 0 }}
        >
          <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-zinc-700/50"
            style={{ background: 'rgba(18,18,20,0.92)', backdropFilter: 'blur(16px)' }}>
            <AgentLog
              messages={messages}
              reasoningStep={reasoningStep}
              isTyping={isTyping}
              phase={phase}
              error={error}
              onRetry={() => { setError(null); if (Object.keys(answers).length > 0) launchReasoning(answers) }}
            />
          </div>
        </motion.div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {phase === 'results' && result ? (
              <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                className="flex-1 overflow-hidden flex flex-col">
                <CanvasArea result={result} objective={answers.objective ?? ''} streamedCount={streamedCount} stackId={savedStackId} />
              </motion.div>
            ) : (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center">
                {phase === 'reasoning' ? (
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <p className="text-zinc-500 text-sm">Génération de ta roadmap...</p>
                  </motion.div>
                ) : (
                  <p className="text-zinc-700 text-sm">La roadmap apparaîtra ici</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom input — no border-top */}
      <BottomInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        phase={phase}
        disabled={phase === 'reasoning'}
      />
    </div>
  )
}
