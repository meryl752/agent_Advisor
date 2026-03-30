'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { FinalStack } from '@/lib/agents/types'
import AgentCard from '@/app/components/ui/AgentCard'
import StackFlow from '@/app/components/ui/StackFlow'
import StackSummary from '@/app/components/ui/StackSummary'
import ROIChart from '@/app/components/ui/ROIChart'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationPhase = 'questioning' | 'reasoning' | 'results' | 'error'

interface ChipOption {
  label: string
  value: string
}

interface Question {
  id: string
  text: string
  type: 'free-text' | 'chips'
  chips?: ChipOption[]
}

interface ConversationEntry {
  role: 'question' | 'answer'
  text: string
}

interface ApiError {
  type: 'rate-limit' | 'server'
  message: string
  plan?: string
  resetAt?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  { id: 'objective', text: "Quel est ton objectif principal ?", type: 'free-text' },
  {
    id: 'sector', text: "Dans quel secteur opères-tu ?", type: 'chips',
    chips: [
      { label: 'E-commerce', value: 'e-commerce' },
      { label: 'SaaS', value: 'saas' },
      { label: 'Agence', value: 'agence' },
      { label: 'Consultant', value: 'consultant' },
      { label: 'Créateur', value: 'createur' },
      { label: 'B2B', value: 'b2b' },
    ],
  },
  {
    id: 'budget', text: "Quel est ton budget mensuel pour les outils IA ?", type: 'chips',
    chips: [
      { label: 'Gratuit', value: 'zero' },
      { label: '<50€', value: 'low' },
      { label: '<200€', value: 'medium' },
      { label: '200€+', value: 'high' },
    ],
  },
  {
    id: 'tech_level', text: "Quel est ton niveau technique ?", type: 'chips',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#CAFF32]/60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function QuestionBubble({ text, isTyping }: { text: string; isTyping?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-2 max-w-[80%]"
    >
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center
                      bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-1">
        <span className="text-[#CAFF32] text-[7px] font-black">AI</span>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3
                      text-sm text-zinc-200 leading-relaxed">
        {isTyping ? <TypingIndicator /> : text}
      </div>
    </motion.div>
  )
}

function AnswerBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end"
    >
      <div className="bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-2xl rounded-tr-sm
                      px-4 py-3 text-sm text-[#CAFF32] max-w-[70%]">
        {text}
      </div>
    </motion.div>
  )
}

function ChipSelector({ chips, onSelect, disabled }: {
  chips: ChipOption[]
  onSelect: (chip: ChipOption) => void
  disabled?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 pl-8"
    >
      {chips.map(chip => (
        <button
          key={chip.value}
          onClick={() => !disabled && onSelect(chip)}
          disabled={disabled}
          className="px-4 py-2 rounded-full border border-zinc-700 text-sm text-zinc-300
                     hover:border-[#CAFF32]/50 hover:text-[#CAFF32] hover:bg-[#CAFF32]/5
                     transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                     font-dm-mono text-xs"
        >
          {chip.label}
        </button>
      ))}
    </motion.div>
  )
}

// ─── ReasoningPanel ───────────────────────────────────────────────────────────

function ReasoningPanel({
  answers,
  onComplete,
  onError,
}: {
  answers: Record<string, string>
  onComplete: (result: FinalStack) => void
  onError: (err: ApiError) => void
}) {
  const [visibleAgents, setVisibleAgents] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const apiResultRef = useRef<FinalStack | null>(null)
  const apiDoneRef = useRef(false)
  const allShownRef = useRef(false)

  const tryComplete = useCallback(() => {
    if (apiDoneRef.current && allShownRef.current && apiResultRef.current) {
      setDone(true)
      setTimeout(() => onComplete(apiResultRef.current!), 400)
    }
  }, [onComplete])

  useEffect(() => {
    // Fire API call
    const payload = {
      objective: answers.objective,
      sector: answers.sector,
      budget: answers.budget,
      tech_level: answers.tech_level,
      team_size: 'solo',
      timeline: 'weeks',
      current_tools: [],
    }

    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 429) {
            onError({
              type: 'rate-limit',
              message: data.error ?? 'Limite atteinte',
              plan: data.plan,
              resetAt: data.reset_at,
            })
          } else {
            onError({ type: 'server', message: data.error ?? 'Erreur serveur' })
          }
          return
        }
        apiResultRef.current = data.result
        apiDoneRef.current = true
        tryComplete()
      })
      .catch(() => {
        onError({ type: 'server', message: 'Erreur réseau' })
      })

    // Show agents sequentially
    REASONING_AGENTS.forEach((_, i) => {
      setTimeout(() => {
        setVisibleAgents(prev => [...prev, i])
        if (i === REASONING_AGENTS.length - 1) {
          allShownRef.current = true
          tryComplete()
        }
      }, 800 + i * 1200)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 py-4"
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center
                        bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-1">
          <span className="text-[#CAFF32] text-[7px] font-black">AI</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
          <div className="flex flex-col gap-3">
            {visibleAgents.length === 0 && <TypingIndicator />}
            {REASONING_AGENTS.map((agent, i) => (
              <AnimatePresence key={i}>
                {visibleAgents.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-[#CAFF32] text-base w-5 text-center">{agent.icon}</span>
                    <div>
                      <span className="font-dm-mono text-[0.6rem] text-[#CAFF32]/60 uppercase tracking-wider">
                        {agent.name}
                      </span>
                      <p className="text-sm text-zinc-300">{agent.message}</p>
                    </div>
                    {i === visibleAgents[visibleAgents.length - 1] && !done && (
                      <div className="ml-auto flex gap-1">
                        {[0, 1, 2].map(j => (
                          <motion.div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full bg-[#CAFF32]/40"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </div>
                    )}
                    {done && i === REASONING_AGENTS.length - 1 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto text-[#CAFF32] text-sm"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── ArtifactGrid ─────────────────────────────────────────────────────────────

function FinancialSummary({ stack }: { stack: FinalStack }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
      <p className="font-dm-mono text-[0.6rem] text-zinc-500 uppercase tracking-[0.15em] mb-4">
        Résumé financier
      </p>
      <div className="flex flex-col gap-3">
        {[
          { label: 'Coût mensuel', value: `${stack.total_cost}€`, color: 'text-white' },
          { label: 'ROI estimé', value: `+${stack.roi_estimate}%`, color: 'text-[#CAFF32]' },
          { label: 'Temps économisé', value: `${stack.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
        ].map((m, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
            <span className="text-xs text-zinc-500 font-dm-mono">{m.label}</span>
            <span className={`font-syne font-black text-sm ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArtifactGrid({ stack }: { stack: FinalStack }) {
  const sections = [
    'summary', 'agents', 'roi', 'flow', 'wins',
  ]

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section, i) => (
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          {section === 'summary' && (
            <StackSummary
              stackName={stack.stack_name}
              justification={stack.justification}
              total_cost={stack.total_cost}
              roi_estimate={stack.roi_estimate}
              time_saved_per_week={stack.time_saved_per_week}
              agentCount={stack.agents.length}
            />
          )}

          {section === 'agents' && (
            <div>
              <p className="font-dm-mono text-[0.6rem] text-zinc-500 uppercase tracking-[0.15em] mb-3">
                Les agents recommandés
              </p>
              <div className="flex flex-col gap-1">
                {stack.agents.map((agent, j) => (
                  <AgentCard
                    key={j}
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
          )}

          {section === 'roi' && (
            <ROIChart roiEstimate={stack.roi_estimate} totalCost={stack.total_cost} />
          )}

          {section === 'flow' && (
            <StackFlow agents={stack.agents} stackName={stack.stack_name} />
          )}

          {section === 'wins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stack.quick_wins?.length > 0 && (
                <div className="bg-[#CAFF32]/5 border border-[#CAFF32]/15 rounded-xl p-5">
                  <p className="font-dm-mono text-[0.6rem] text-[#CAFF32] uppercase tracking-[0.15em] mb-3">
                    ✦ Quick wins
                  </p>
                  <div className="flex flex-col gap-2">
                    {stack.quick_wins.map((w, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-[#CAFF32] text-xs mt-0.5 flex-shrink-0 font-dm-mono">{j + 1}.</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FinancialSummary stack={stack} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatRecommendPage() {
  const [phase, setPhase] = useState<ConversationPhase>('questioning')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<ConversationEntry[]>([])
  const [showTyping, setShowTyping] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [result, setResult] = useState<FinalStack | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Show first question after mount
  useEffect(() => {
    const t = setTimeout(() => setShowTyping(false), 800)
    return () => clearTimeout(t)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, showTyping, phase])

  const submitAnswer = useCallback((label: string, value?: string) => {
    const trimmed = label.trim()
    if (!trimmed) {
      setInputError('Merci de saisir une réponse.')
      return
    }
    setInputError('')

    const apiValue = value ?? trimmed
    const questionId = QUESTIONS[currentQuestionIndex].id

    const newAnswers = { ...answers, [questionId]: apiValue }
    setAnswers(newAnswers)

    setHistory(prev => [
      ...prev,
      { role: 'question', text: QUESTIONS[currentQuestionIndex].text },
      { role: 'answer', text: label },
    ])

    const nextIndex = currentQuestionIndex + 1

    if (nextIndex >= QUESTIONS.length) {
      // All questions answered — go to reasoning
      setTimeout(() => setPhase('reasoning'), 400)
    } else {
      setCurrentQuestionIndex(nextIndex)
      setShowTyping(true)
      setTimeout(() => setShowTyping(false), 800)
    }

    setInputValue('')
  }, [answers, currentQuestionIndex])

  const handleTextSubmit = () => {
    submitAnswer(inputValue)
  }

  const reset = () => {
    setPhase('questioning')
    setCurrentQuestionIndex(0)
    setAnswers({})
    setHistory([])
    setShowTyping(true)
    setInputValue('')
    setInputError('')
    setResult(null)
    setError(null)
    setTimeout(() => setShowTyping(false), 800)
  }

  const retry = () => {
    setError(null)
    setPhase('reasoning')
  }

  const currentQuestion = QUESTIONS[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#CAFF32] animate-pulse" />
          <span className="font-syne font-bold text-sm text-zinc-300">Raspquery AI</span>
        </div>
        {(phase === 'results' || phase === 'error') && (
          <button
            onClick={reset}
            className="font-dm-mono text-xs text-zinc-500 hover:text-[#CAFF32] transition-colors
                       border border-zinc-800 hover:border-[#CAFF32]/30 px-3 py-1.5 rounded-lg"
          >
            ↺ Recommencer
          </button>
        )}
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-4 max-w-3xl mx-auto w-full"
      >
        {/* Conversation history */}
        {history.map((entry, i) => (
          entry.role === 'question'
            ? <QuestionBubble key={i} text={entry.text} />
            : <AnswerBubble key={i} text={entry.text} />
        ))}

        {/* Current question / active phase */}
        {phase === 'questioning' && (
          <>
            {showTyping
              ? <QuestionBubble text="" isTyping />
              : <QuestionBubble text={currentQuestion.text} />
            }
          </>
        )}

        {phase === 'reasoning' && (
          <ReasoningPanel
            answers={answers}
            onComplete={(stack) => {
              setResult(stack)
              setPhase('results')
            }}
            onError={(err) => {
              setError(err)
              setPhase('error')
            }}
          />
        )}

        {phase === 'results' && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <ArtifactGrid stack={result} />
          </motion.div>
        )}

        {phase === 'error' && error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 max-w-[85%]"
          >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center
                            bg-[#CAFF32]/10 border border-[#CAFF32]/20 rounded-full mt-1">
              <span className="text-[#CAFF32] text-[7px] font-black">AI</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-4 flex flex-col gap-3">
              {error.type === 'rate-limit' ? (
                <>
                  <p className="text-sm text-zinc-200">
                    Tu as atteint ta limite mensuelle
                    {error.plan ? ` (plan ${error.plan})` : ''}.
                    Passe en Pro pour continuer sans limite.
                  </p>
                  {error.resetAt && (
                    <p className="font-dm-mono text-xs text-zinc-500">
                      Disponible le {new Date(error.resetAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long',
                      })}
                    </p>
                  )}
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-syne font-bold
                               text-xs px-4 py-2 rounded-lg hover:bg-[#d4ff50] transition-colors w-fit"
                  >
                    Passer en Pro →
                  </a>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-200">
                    Une erreur est survenue : {error.message}
                  </p>
                  <button
                    onClick={retry}
                    className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300
                               font-dm-mono text-xs px-4 py-2 rounded-lg hover:border-[#CAFF32]/40
                               hover:text-[#CAFF32] transition-colors w-fit"
                  >
                    ↺ Réessayer
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area — only shown during questioning */}
      <AnimatePresence>
        {phase === 'questioning' && !showTyping && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="flex-shrink-0 border-t border-zinc-900 px-4 md:px-8 py-4 max-w-3xl mx-auto w-full"
          >
            {currentQuestion.type === 'chips' && currentQuestion.chips ? (
              <ChipSelector
                chips={currentQuestion.chips}
                onSelect={(chip) => submitAnswer(chip.label, chip.value)}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={e => { setInputValue(e.target.value); setInputError('') }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleTextSubmit()
                      }
                    }}
                    placeholder="Décris ton objectif..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3
                               text-sm text-zinc-200 outline-none focus:border-[#CAFF32]/40
                               placeholder:text-zinc-600 transition-colors font-dm-mono"
                  />
                  <button
                    onClick={handleTextSubmit}
                    disabled={!inputValue.trim()}
                    className="bg-[#CAFF32] text-zinc-900 font-syne font-bold text-sm px-5 py-3
                               rounded-xl hover:bg-[#d4ff50] transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    →
                  </button>
                </div>
                {inputError && (
                  <p className="font-dm-mono text-xs text-red-400 pl-1">{inputError}</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
