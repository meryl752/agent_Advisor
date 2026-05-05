'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FinalStack } from '@/lib/agents/types'
import { useSidebar } from '@/app/[locale]/dashboard/layout'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/app/components/ThemeToggle'
import { Link } from '@/lib/i18n/navigation'
import { AgentLog } from '../_components/AgentLog'
import { ConversationSidebar } from '../_components/ConversationSidebar'
import { type Phase, type Message, type ApiError, REASONING_STEPS, extractContext } from '../_components/types'

const StackRoadmap = dynamic(() => import('@/app/components/ui/StackRoadmap'), { ssr: false })
const StackFeedback = dynamic(() => import('@/app/components/ui/StackFeedback'), { ssr: false })

// ─── Agent tasks log ──────────────────────────────────────────────────────────

function AgentTasksLog({ phase, result }: { phase: Phase; result: FinalStack | null }) {
  const [open, setOpen] = useState(false)
  const tasks = [
    { id: 'analyze', label: 'Analyse de la requête', done: phase !== 'chat' },
    { id: 'match', label: 'Sélection des agents', done: phase === 'reasoning' || phase === 'results' || phase === 'error' },
    { id: 'build', label: 'Construction du stack', done: phase === 'results' },
    { id: 'roadmap', label: `Roadmap générée${result ? ` — ${result.agents.length} outils` : ''}`, done: phase === 'results' && !!result },
    { id: 'guides', label: "Guides d'implémentation", done: phase === 'results' && !!result?.agents.some(a => a.implementation_steps?.length) },
  ].filter(t => t.done || phase === 'reasoning')

  if (tasks.length === 0) return null

  return (
    <div className="mt-2 mx-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
        style={{ border: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Tâches de l'agent</span>
          <span className="text-[10px] text-zinc-600">({tasks.filter(t => t.done).length}/{tasks.length})</span>
        </div>
        <span className="text-zinc-600 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-1 flex flex-col gap-1">
              {tasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg3)' }}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${task.done ? 'bg-[#CAFF32]' : 'border border-zinc-600'}`}>
                    {task.done && <span className="text-zinc-900 text-[7px] font-black">✓</span>}
                  </div>
                  <span className={`text-xs ${task.done ? 'text-zinc-300' : 'text-zinc-600'}`}>{task.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Nav menu ─────────────────────────────────────────────────────────────────

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

function NavMenu({ onNew }: { onNew: () => void }) {
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
        className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600">
        <span className="text-sm">{open ? '✕' : '☰'}</span>
        <span className="text-[10px] tracking-wider">Menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden z-50 min-w-[200px] shadow-2xl">
            {NAV_LINKS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => { setOpen(false); onNew() }}
                className="flex items-center gap-3 px-4 py-2.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
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

// ─── Main session page ────────────────────────────────────────────────────────

export default function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string
  const { setCollapsed } = useSidebar()

  const [phase, setPhase] = useState<Phase>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<FinalStack | null>(null)
  const [savedStackId, setSavedStackId] = useState<string | undefined>()
  const [error, setError] = useState<ApiError | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [reasoningStep, setReasoningStep] = useState(0)
  const [streamedCount, setStreamedCount] = useState(0)
  const [initialized, setInitialized] = useState(false)

  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)
  const reasoningTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Always collapse sidebar in session
  useEffect(() => { setCollapsed(true) }, [setCollapsed])

  // Load existing conversation on mount, or send initial message if new session
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/conversations/${sessionId}`)
      .then(r => {
        console.log('[session] fetch status:', r.status)
        return r.json()
      })
      .then(async data => {
        console.log('[session] conversation data:', data)
        if (data.conversation?.messages?.length > 0) {
          const restored: Message[] = data.conversation.messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' as const : 'ai' as const,
            text: m.content,
          }))
          console.log('[session] restoring', restored.length, 'messages')
          setMessages(restored)

          // If a stack was generated in this session, load it
          if (data.conversation.stack_id) {
            try {
              const stackRes = await fetch(`/api/stacks/${data.conversation.stack_id}`)
              if (stackRes.ok) {
                const stackData = await stackRes.json()
                if (stackData.stack) {
                  setResult(stackData.stack)
                  setSavedStackId(data.conversation.stack_id)
                  setPhase('results')
                  setStreamedCount(stackData.stack.agents.length)
                  if (stackData.objective) {
                    setAnswers(prev => ({ ...prev, objective: stackData.objective }))
                  }
                }
              }
            } catch { /* silent — stack load is non-critical */ }
          }

          setInitialized(true)
        } else {
          const initMsg = sessionStorage.getItem(`session_init_${sessionId}`)
          if (initMsg) {
            sessionStorage.removeItem(`session_init_${sessionId}`)
            setInitialized(true)
            handleSendMessage(initMsg)
          } else {
            setInitialized(true)
          }
        }
      })
      .catch(err => { console.error('[session] fetch error:', err); setInitialized(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Auto-save after each exchange
  const saveSession = useCallback((updatedMessages: Message[], stackGenerated = false, stackId?: string) => {
    const chatMessages = updatedMessages
      .filter(m => m.role === 'user' || m.role === 'ai')
      .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text ?? '' }))
    if (chatMessages.length === 0) return
    fetch('/api/memory/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages: chatMessages, stackGenerated, stackId }),
    })
      .then(r => r.json())
      .then(data => { if (!data.ok) console.error('[saveSession] API error:', data) })
      .catch(err => console.error('[saveSession] fetch error:', err))
  }, [sessionId])

  const revealStack = useCallback((stack: FinalStack, stackId?: string) => {
    setResult(stack); setSavedStackId(stackId); setPhase('results'); setStreamedCount(0)
    stack.agents.forEach((_, idx) => { setTimeout(() => setStreamedCount(idx + 1), idx * 220) })
    fetch('/api/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents: stack.agents, ctx: { objective: stack.stack_name, tech_level: 'intermediate' } }),
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
          } catch { /* skip */ }
        }
      }
    }).catch(err => console.warn('[Guides] Stream error:', err))
  }, [])

  const launchReasoning = useCallback((ans: Record<string, string>) => {
    reasoningTimers.current.forEach(t => clearTimeout(t))
    reasoningTimers.current = []
    setPhase('reasoning'); setReasoningStep(0)
    apiDone.current = false; allShown.current = false; resultRef.current = null
    setMessages(prev => {
      const hasReasoning = prev.some(m => m.role === 'reasoning')
      return hasReasoning ? prev : [...prev, { role: 'reasoning' }]
    })
    fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objective: ans.objective, sector: ans.sector ?? 'général', budget: ans.budget ?? 'medium', tech_level: ans.tech_level ?? 'intermediate', team_size: 'solo', timeline: 'weeks', current_tools: [], session_id: sessionId }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) {
        setError(res.status === 429 ? { type: 'rate-limit', message: data.error, plan: data.plan, resetAt: data.reset_at } : { type: 'server', message: data.error ?? 'Erreur serveur' })
        setPhase('error'); return
      }
      resultRef.current = data.result
      ;(resultRef.current as any)._stackId = data.stackId
      apiDone.current = true
      if (allShown.current) {
        const t = setTimeout(() => {
          setMessages(prev => {
            const updated = [...prev, { role: 'ai' as const, text: `Stack prêt — ${data.result.agents.length} outils avec guides d'implémentation.` }]
            saveSession(updated, true, data.stackId)
            return updated
          })
          revealStack(data.result, data.stackId)
        }, 400)
        reasoningTimers.current.push(t)
      }
    }).catch(() => { setError({ type: 'server', message: 'Erreur réseau' }); setPhase('error') })

    REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setReasoningStep(i)
        if (i === REASONING_STEPS.length - 1) {
          allShown.current = true
          if (apiDone.current && resultRef.current) {
            const stackId = (resultRef.current as any)._stackId
            const t2 = setTimeout(() => {
              setMessages(prev => {
                const updated = [...prev, { role: 'ai' as const, text: `Stack prêt — ${resultRef.current!.agents.length} outils avec guides d'implémentation.` }]
                saveSession(updated, true, stackId)
                return updated
              })
              revealStack(resultRef.current!, stackId)
            }, 400)
            reasoningTimers.current.push(t2)
          }
        }
      }, 500 + i * 1000)
      reasoningTimers.current.push(t)
    })
  }, [revealStack, saveSession])

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return
    // Clear any previous error and reset phase to chat when user sends a new message
    setError(null)
    if (phase === 'error') setPhase('chat')
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setIsTyping(true)

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'ai')
      .filter(m => m.text && m.text.trim().length > 0) // skip empty messages
      .slice(-10) // keep only last 10 exchanges to avoid context overflow
      .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text ?? '' }))

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history,
        stackContext: result ? {
          stack_name: result.stack_name,
          objective: answers.objective ?? '',
          total_cost: result.total_cost,
          agents: result.agents.map(a => ({ name: a.name, role: a.role })),
        } : undefined,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.objective?.trim()) setAnswers(prev => ({ ...prev, objective: data.objective }))
        setIsTyping(false)
        setMessages(prev => {
          const updated = [...prev, { role: 'ai' as const, text: data.response ?? "Je ne comprends pas. Peux-tu reformuler ?" }]
          saveSession(updated)
          return updated
        })
      })
      .catch(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'ai', text: "Erreur réseau. Réessaie." }])
      })
  }, [messages, answers, result, saveSession, phase])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    handleSendMessage(text)
  }, [input, handleSendMessage])

  const handleNew = useCallback(() => {
    router.push('/dashboard/recommend')
  }, [router])

  if (!initialized) {
    return (
      <div className="fixed inset-0 flex z-10" style={{ background: 'var(--bg)' }}>
        {/* Sidebar shimmer */}
        <div className="flex-shrink-0 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-700/40"
          style={{ width: 220, background: 'var(--bg2)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700/40">
            <div className="h-2 w-16 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="h-2 w-10 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <div className="flex-1 py-2 px-3 flex flex-col gap-3">
            {['75%', '55%', '80%', '60%', '70%'].map((w, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2.5 rounded-full relative overflow-hidden" style={{ background: 'var(--border)', width: w }}>
                  <div className="absolute inset-0 animate-shimmer"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
                </div>
                <div className="h-2 rounded-full relative overflow-hidden" style={{ background: 'var(--border)', width: '45%' }}>
                  <div className="absolute inset-0 animate-shimmer"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat shimmer */}
        <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-700/40"
          style={{ width: 420, background: 'var(--bg2)' }}>
          <div className="flex-1 py-5 px-4 flex flex-col gap-5">
            {/* User bubble shimmer */}
            <div className="flex justify-end">
              <div className="h-10 w-48 rounded-2xl rounded-tr-sm relative overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
              </div>
            </div>
            {/* AI message shimmer */}
            <div className="flex flex-col gap-2">
              {['85%', '70%', '55%'].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full relative overflow-hidden" style={{ background: 'var(--border)', width: w }}>
                  <div className="absolute inset-0 animate-shimmer"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }} />
                </div>
              ))}
            </div>
            {/* User bubble shimmer */}
            <div className="flex justify-end">
              <div className="h-10 w-36 rounded-2xl rounded-tr-sm relative overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="absolute inset-0 animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%' }} />
              </div>
            </div>
            {/* AI message shimmer */}
            <div className="flex flex-col gap-2">
              {['90%', '65%'].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full relative overflow-hidden" style={{ background: 'var(--border)', width: w }}>
                  <div className="absolute inset-0 animate-shimmer"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)', backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas placeholder */}
        <div className="flex-1 h-full" style={{ background: 'var(--bg)' }} />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex z-10"
      style={{
        background: 'var(--bg)',
        backgroundImage: 'radial-gradient(circle, rgba(128,128,128,0.055) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>

      {/* LEFT — Conversation history */}
      <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }} className="flex-shrink-0 h-full" style={{ minWidth: 0 }}>
        <ConversationSidebar onNew={handleNew} />
      </motion.div>

      {/* CENTER — Chat */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
        className="flex flex-col h-full" style={{ width: 420, minWidth: 320, flexShrink: 0 }}>
        <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-200 dark:border-zinc-700/40"
          style={{ background: 'var(--bg2)' }}>

          <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-6 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, var(--bg2), transparent)' }} />
            <div className="absolute inset-x-0 bottom-0 h-6 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to top, var(--bg2), transparent)' }} />
            <AgentLog messages={messages} reasoningStep={reasoningStep} isTyping={isTyping}
              phase={phase} error={error}
              onRetry={() => { setError(null); if (Object.keys(answers).length > 0) launchReasoning(answers) }} />
          </div>

          {/* Generate stack button — visible during chat or error phase */}
          {(phase === 'chat' || phase === 'error') && (
            <div className="flex-shrink-0 px-3 pt-2">
              <button
                onClick={() => {
                  // Use saved objective if available, otherwise extract from user messages only (not AI responses)
                  // and truncate to 500 chars max to stay within validation limits
                  const userMessages = messages.filter(m => m.role === 'user').map(m => m.text ?? '').join(' ')
                  const rawObjective = answers.objective || userMessages
                  const objective = rawObjective.slice(0, 500).trim()
                  const ctx = extractContext(objective)
                  const ans = { ...answers, objective, sector: ctx.sector ?? answers.sector ?? 'général', budget: ctx.budget ?? answers.budget ?? 'medium', tech_level: ctx.tech ?? answers.tech_level ?? 'intermediate' }
                  setAnswers(ans)
                  launchReasoning(ans)
                }}
                className="w-full flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 hover:border-[#CAFF32]/50 dark:hover:border-[#CAFF32]/40 hover:bg-[#CAFF32]/5"
              >
                Générer mon stack
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 px-3 pb-3 pt-2">
            <div className="relative rounded-xl" style={{ background: 'var(--border2)', border: '1px solid var(--border)' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={phase === 'results' ? "Pose une question..." : "Envoyer un message..."}
                rows={2} disabled={phase === 'reasoning'}
                className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 text-sm px-4 pt-3 pb-10 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed disabled:opacity-40" />
              <div className="absolute bottom-2.5 right-3">
                <button onClick={handleSend} disabled={!input.trim() || phase === 'reasoning'}
                  className="w-8 h-8 rounded-lg bg-[#CAFF32] text-zinc-900 font-bold text-sm hover:bg-[#d4ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center">↑</button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-2" style={{ background: 'var(--bg2)' }}>
          <AgentTasksLog phase={phase} result={result} />
        </div>
      </motion.div>

      {/* RIGHT — Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 relative z-20">
          <NavMenu onNew={handleNew} />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserButton appearance={{
              elements: {
                avatarBox: 'w-7 h-7 rounded-lg',
                userButtonPopoverCard: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl',
              }
            }} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === 'results' && result ? (
              <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                className="h-full overflow-y-auto px-6 py-4 scrollbar-hide">
                <div className="max-w-4xl mx-auto flex flex-col gap-8">
                  <StackRoadmap agents={result.agents} stackName={result.stack_name} objective={answers.objective ?? ''} streamedCount={streamedCount} />
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700/50 p-5" style={{ background: 'var(--bg3)' }}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Résumé financier</p>
                    {[
                      { label: 'Coût mensuel', value: `${result.total_cost}€`, color: 'text-zinc-900 dark:text-white' },
                      { label: 'ROI estimé', value: `+${result.roi_estimate}%`, color: 'text-[#CAFF32]' },
                      { label: 'Temps économisé', value: `${result.time_saved_per_week}h/sem`, color: 'text-[#38bdf8]' },
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700/40 last:border-0">
                        <span className="text-xs text-zinc-500">{m.label}</span>
                        <span className={`font-semibold text-sm ${m.color}`}>{m.value}</span>
                      </div>
                    ))}
                  </motion.div>
                  {savedStackId && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                      <StackFeedback stackId={savedStackId} agents={result.agents} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center">
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
    </div>
  )
}
