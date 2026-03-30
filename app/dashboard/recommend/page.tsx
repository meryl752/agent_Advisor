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
interface ChatEntry { role: 'ai' | 'user'; text: string; isTyping?: boolean }
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

const REASONING_AGENTS = [
  { icon: '◈', name: 'Analyzer',   message: 'Analyse de 200+ agents IA...' },
  { icon: '↑', name: 'ROI Engine', message: 'Calcul du ROI pour ton profil...' },
  { icon: '⚙', name: 'Optimizer',  message: 'Optimisation du budget...' },
  { icon: '✦', name: 'Builder',    message: 'Assemblage du stack final...' },
]

// ─── Small components ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-2 h-2 rounded-full bg-[#CAFF32]/60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  )
}

function AIBubble({ text, isTyping }: { text?: string; isTyping?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 max-w-[85%]">
      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                      bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-0.5">
        <span className="text-[#CAFF32] text-[8px] font-black">AI</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3
                      text-sm text-zinc-200 leading-relaxed">
        {isTyping ? <TypingDots /> : text}
      </div>
    </motion.div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex justify-end">
      <div className="bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-2xl rounded-tr-sm
                      px-4 py-3 text-sm text-[#CAFF32] max-w-[75%]">
        {text}
      </div>
    </motion.div>
  )
}

function ChipRow({ chips, onSelect }: { chips: ChipOption[]; onSelect: (c: ChipOption) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 pl-10">
      {chips.map(chip => (
        <button key={chip.value} onClick={() => onSelect(chip)}
          className="px-4 py-2 rounded-full border border-zinc-700 text-xs text-zinc-300 font-dm-mono
                     hover:border-[#CAFF32]/50 hover:text-[#CAFF32] hover:bg-[#CAFF32]/5 transition-all">
          {chip.label}
        </button>
      ))}
    </motion.div>
  )
}

// ─── Reasoning Panel ──────────────────────────────────────────────────────────

function ReasoningPanel({ answers, onComplete, onError }: {
  answers: Record<string, string>
  onComplete: (r: FinalStack) => void
  onError: (e: ApiError) => void
}) {
  const [visible, setVisible] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)

  const tryComplete = useCallback(() => {
    if (apiDone.current && allShown.current && resultRef.current) {
      setDone(true)
      setTimeout(() => onComplete(resultRef.current!), 500)
    }
  }, [onComplete])

  useEffect(() => {
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
      apiDone.current = true
      tryComplete()
    }).catch(() => onError({ type: 'server', message: 'Erreur réseau' }))

    REASONING_AGENTS.forEach((_, i) => {
      setTimeout(() => {
        setVisible(prev => [...prev, i])
        if (i === REASONING_AGENTS.length - 1) { allShown.current = true; tryComplete() }
      }, 600 + i * 1200)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex items-start gap-3">
      <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                      bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-0.5">
        <span className="text-[#CAFF32] text-[8px] font-black">AI</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-4 flex-1">
        <div className="flex flex-col gap-3">
          {visible.length === 0 && <TypingDots />}
          {REASONING_AGENTS.map((agent, i) => (
            <AnimatePresence key={i}>
              {visible.includes(i) && (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3">
                  <span className="text-[#CAFF32] w-5 text-center text-sm">{agent.icon}</span>
                  <div className="flex-1">
                    <p className="font-dm-mono text-[9px] text-[#CAFF32]/50 uppercase tracking-wider">{agent.name}</p>
                    <p className="text-sm text-zinc-300">{agent.message}</p>
                  </div>
                  {i === visible[visible.length - 1] && !done && (
                    <div className="flex gap-1">
                      {[0,1,2].map(j => (
                        <motion.div key={j} className="w-1.5 h-1.5 rounded-full bg-[#CAFF32]/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.2 }} />
                      ))}
                    </div>
                  )}
                  {done && i === REASONING_AGENTS.length - 1 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="text-[#CAFF32] text-sm">✓</motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Artifact Grid ────────────────────────────────────────────────────────────

function ArtifactGrid({ stack }: { stack: FinalStack }) {
  return (
    <div className="flex flex-col gap-6 w-full">
      {[
        <StackSummary key="summary" stackName={stack.stack_name} justification={stack.justification}
          total_cost={stack.total_cost} roi_estimate={stack.roi_estimate}
          time_saved_per_week={stack.time_saved_per_week} agentCount={stack.agents.length} />,

        <div key="agents">
          <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em] mb-3">Les agents recommandés</p>
          <div className="flex flex-col gap-1">
            {stack.agents.map((a, i) => (
              <AgentCard key={i} rank={a.rank} name={a.name} category={a.category}
                price_from={a.price_from} role={a.role} reason={a.reason}
                concrete_result={(a as any).concrete_result} website_domain={a.website_domain}
                setup_difficulty={a.setup_difficulty} time_to_value={a.time_to_value} score={a.score} />
            ))}
          </div>
        </div>,

        <ROIChart key="roi" roiEstimate={stack.roi_estimate} totalCost={stack.total_cost} />,

        <StackFlow key="flow" agents={stack.agents} stackName={stack.stack_name} />,

        <div key="wins" className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      ].map((section, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}>
          {section}
        </motion.div>
      ))}
    </div>
  )
}

// ─── IDLE STATE — Centered input like before ──────────────────────────────────

function IdleScreen({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (value.trim().length >= 10) onSubmit(value.trim())
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] blur-3xl rounded-full"
          style={{ background: 'radial-gradient(ellipse, #CAFF32, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-syne font-black text-4xl md:text-5xl text-white tracking-tight mb-4 leading-tight">
            Construis ton stack de<br /><span className="text-[#CAFF32]">super-pouvoirs</span> IA
          </h1>
          <p className="text-zinc-500 text-base font-dm-sans max-w-md mx-auto">
            Décris ton objectif — notre IA assemble le combo optimal en 30 secondes.
          </p>
        </div>

        {/* Input */}
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
                         transition-all bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50]
                         disabled:opacity-30 disabled:cursor-not-allowed">
              Générer mon stack →
            </button>
          </div>
        </div>

        {/* Suggestion carousel — two rows auto-scrolling */}
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

// ─── CHAT STATE — After first message sent ────────────────────────────────────

export default function RecommendPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [showTyping, setShowTyping] = useState(false)
  const [result, setResult] = useState<FinalStack | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat, phase, showTyping])

  // Start chat after idle submit
  const startChat = useCallback((objective: string) => {
    setAnswers({ objective })
    setChat([{ role: 'user', text: objective }])
    setPhase('questioning')
    setQIndex(0)
    setShowTyping(true)
    setTimeout(() => setShowTyping(false), 900)
  }, [])

  // Submit a chat answer
  const submitAnswer = useCallback((label: string, value?: string) => {
    const q = QUESTIONS[qIndex]
    const apiValue = value ?? label

    setAnswers(prev => ({ ...prev, [q.id]: apiValue }))
    setChat(prev => [...prev, { role: 'user', text: label }])

    const next = qIndex + 1
    if (next >= QUESTIONS.length) {
      setTimeout(() => setPhase('reasoning'), 400)
    } else {
      setQIndex(next)
      setShowTyping(true)
      setTimeout(() => setShowTyping(false), 900)
    }
  }, [qIndex])

  const reset = () => {
    setPhase('idle')
    setQIndex(0)
    setAnswers({})
    setChat([])
    setResult(null)
    setError(null)
    setShowTyping(false)
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} className="h-full">
        <IdleScreen onSubmit={startChat} />
      </motion.div>
    )
  }

  // ── CHAT MODE (questioning / reasoning / results / error) ─────────────────
  return (
    <AnimatePresence mode="wait">
      <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col h-full bg-zinc-950">

        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3
                        border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#CAFF32] animate-pulse" />
            <span className="font-syne font-bold text-sm text-zinc-300">Raspquery AI</span>
          </div>
          <button onClick={reset}
            className="font-dm-mono text-xs text-zinc-600 hover:text-[#CAFF32] transition-colors
                       border border-zinc-800 hover:border-[#CAFF32]/30 px-3 py-1.5 rounded-lg">
            ↺ Nouveau
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-4
                     max-w-3xl mx-auto w-full scrollbar-hide">

          {/* Chat history */}
          {chat.map((entry, i) =>
            entry.role === 'ai'
              ? <AIBubble key={i} text={entry.text} />
              : <UserBubble key={i} text={entry.text} />
          )}

          {/* Typing indicator before next AI question */}
          {phase === 'questioning' && showTyping && <AIBubble isTyping />}

          {/* Current AI question */}
          {phase === 'questioning' && !showTyping && (
            <AIBubble text={QUESTIONS[qIndex].text} />
          )}

          {/* Reasoning */}
          {phase === 'reasoning' && (
            <ReasoningPanel answers={answers}
              onComplete={r => { setResult(r); setPhase('results') }}
              onError={e => { setError(e); setPhase('error') }} />
          )}

          {/* Results */}
          {phase === 'results' && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <ArtifactGrid stack={result} />
            </motion.div>
          )}

          {/* Error */}
          {phase === 'error' && error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 max-w-[85%]">
              <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center
                              bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-0.5">
                <span className="text-[#CAFF32] text-[8px] font-black">AI</span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-4 flex flex-col gap-3">
                {error.type === 'rate-limit' ? (
                  <>
                    <p className="text-sm text-zinc-200">
                      Tu as atteint ta limite {error.plan ? `(plan ${error.plan})` : ''}.
                      Passe en Pro pour continuer.
                    </p>
                    {error.resetAt && (
                      <p className="font-dm-mono text-xs text-zinc-500">
                        Disponible le {new Date(error.resetAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    )}
                    <a href="/dashboard/settings"
                      className="inline-flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-bold
                                 text-xs px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors w-fit">
                      Passer en Pro →
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-200">Une erreur est survenue : {error.message}</p>
                    <button onClick={() => { setError(null); setPhase('reasoning') }}
                      className="border border-zinc-700 text-zinc-300 font-dm-mono text-xs px-4 py-2
                                 rounded-lg hover:border-[#CAFF32]/40 hover:text-[#CAFF32] transition-colors w-fit">
                      ↺ Réessayer
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Input bar — only during questioning */}
        <AnimatePresence>
          {phase === 'questioning' && !showTyping && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex-shrink-0 border-t border-zinc-900 px-4 md:px-8 py-4
                         max-w-3xl mx-auto w-full">
              {QUESTIONS[qIndex].type === 'chips' && QUESTIONS[qIndex].chips ? (
                <ChipRow chips={QUESTIONS[qIndex].chips!}
                  onSelect={c => submitAnswer(c.label, c.value)} />
              ) : (
                <ChatInput onSubmit={submitAnswer} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

function ChatInput({ onSubmit }: { onSubmit: (label: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input autoFocus value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && value.trim()) { e.preventDefault(); onSubmit(value.trim()); setValue('') } }}
        placeholder="Envoyer un message..."
        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm
                   text-zinc-200 outline-none focus:border-[#CAFF32]/40 placeholder:text-zinc-600
                   transition-colors font-dm-mono" />
      <button onClick={() => { if (value.trim()) { onSubmit(value.trim()); setValue('') } }}
        disabled={!value.trim()}
        className="bg-[#CAFF32] text-zinc-900 font-bold px-5 py-3 rounded-xl
                   hover:bg-[#d4ff50] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        →
      </button>
    </div>
  )
}
