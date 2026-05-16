'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { FinalStack } from '@/lib/agents/types'
import { useSidebar } from '@/app/dashboard/layout'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/app/components/ThemeToggle'
import { AgentLog } from '../_components/AgentLog'
import { ConversationSidebar } from '../_components/ConversationSidebar'
import { type Phase, type Message, type ApiError, REASONING_STEPS, extractContext } from '../_components/types'
import { SUPPORTED_REASONING_MODELS, type ReasoningModelId } from '@/lib/constants'
import { useTheme } from 'next-themes'
import type { AppLocale } from '@/lib/i18n/locale'

const StackRoadmap = dynamic(() => import('@/app/components/ui/StackRoadmap'), { ssr: false })
const StackArtifact = dynamic(() => import('@/app/components/ui/StackArtifact'), { ssr: false })
const StackFeedback = dynamic(() => import('@/app/components/ui/StackFeedback'), { ssr: false })

// ─── Agent tasks log ──────────────────────────────────────────────────────────

function AgentTasksLog({ phase, result }: { phase: Phase; result: FinalStack | null }) {
  const [open, setOpen] = useState(false)
  const tasks = [
    { id: 'analyze', label: 'Analyzing your needs', done: phase !== 'chat' },
    { id: 'match', label: 'Matching AI agents', done: phase === 'reasoning' || phase === 'results' || phase === 'error' },
    { id: 'build', label: 'Building your stack', done: phase === 'results' },
    { id: 'roadmap', label: result ? `Roadmap with ${result.agents.length} agents` : 'Building your stack', done: phase === 'results' && !!result },
    { id: 'guides', label: 'Implementation guides', done: phase === 'results' && !!result?.agents.some(a => a.implementation_steps?.length) },
  ].filter(t => t.done || phase === 'reasoning')

  if (tasks.length === 0) return null

  return (
    <div className="mt-2 mx-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
        style={{ border: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Agent Tasks</span>
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

// ─── Stack directory ──────────────────────────────────────────────────────────

interface StackInConversation {
  session_id: string
  title: string
  stack_id: string
  created_at: string
}

function StackDirectory({ currentSessionId, onSelectStack }: { currentSessionId: string; onSelectStack: (sessionId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [stacks, setStacks] = useState<StackInConversation[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (open && stacks.length === 0) {
      setLoading(true)
      fetch('/api/conversations')
        .then(r => r.json())
        .then(d => {
          const stackConvs = (d.conversations ?? [])
            .filter((c: any) => c.stack_generated && c.stack_id)
            .map((c: any) => ({
              session_id: c.session_id,
              title: c.title,
              stack_id: c.stack_id,
              created_at: c.created_at,
            }))
          setStacks(stackConvs)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600">
        <span className="text-sm">⬡</span>
        <span className="text-[10px] tracking-wider">Stacks</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden z-50 min-w-[240px] max-w-[280px] shadow-2xl">
            <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Generated Stacks</p>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {loading ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-zinc-500">Loading...</p>
                </div>
              ) : stacks.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs text-zinc-500">No stacks yet</p>
                </div>
              ) : (
                stacks.map(stack => (
                  <button
                    key={stack.session_id}
                    onClick={() => { onSelectStack(stack.session_id); setOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${
                      stack.session_id === currentSessionId ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-900 dark:text-white truncate">{stack.title}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(stack.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Chat Model Selector ──────────────────────────────────────────────────────

function ChatModelSelector() {
  const [model, setModel] = useState<ReasoningModelId>('qwen-235b')
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => { setMounted(true) }, [])

  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.top - 8, left: rect.left })
    }
    setOpen(v => !v)
  }

  const iconFor = (id: string) =>
    id.startsWith('qwen') ? 'qwen-stroke-rounded.svg' :
    id.startsWith('llama') ? 'meta-stroke-rounded.svg' :
    id.startsWith('gpt') ? 'chat-gpt-stroke-rounded (1).svg' :
    'google-gemini-stroke-rounded.svg'

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <img
          src={`/assets/icons svg/${iconFor(model)}`}
          alt="icon"
          className="w-3 h-3 dark:invert opacity-70"
        />
        <span className="text-[11px] font-dm-sans text-zinc-600 dark:text-zinc-300 lowercase">
          {SUPPORTED_REASONING_MODELS.find(m => m.id === model)?.name.toLowerCase()}
        </span>
        <svg className={`w-2.5 h-2.5 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  bottom: `calc(100vh - ${pos.top}px)`,
                  left: pos.left,
                  zIndex: 999,
                  width: '208px',
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `2px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ padding: '6px 12px 6px', borderBottom: `1px solid ${isDark ? '#27272a' : '#f0f0f0'}`, marginBottom: 4 }}>
                  <p style={{ fontSize: 9, fontFamily: 'var(--font-dm-sans)', fontWeight: 700, color: '#71717a', textTransform: 'lowercase' }}>moteur de raisonnement</p>
                </div>
                {SUPPORTED_REASONING_MODELS.map(m => {
                  const active = m.id === model
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id); setOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: '8px', textAlign: 'left',
                        background: active ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
                        cursor: 'pointer', border: 'none', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <img
                        src={`/assets/icons svg/${iconFor(m.id)}`}
                        alt={m.name}
                        style={{ width: 14, height: 14, opacity: active ? 1 : 0.4, filter: isDark ? 'invert(1)' : 'none' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-sans)', fontWeight: 500, color: isDark ? (active ? '#fff' : '#71717a') : (active ? '#18181b' : '#71717a'), textTransform: 'lowercase' }}>
                          {m.name.toLowerCase()}
                        </span>
                        <span style={{ fontSize: 9, color: '#71717a' }}>{m.provider.toLowerCase()}</span>
                      </div>
                    </button>
                  )
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// ─── Main session page ────────────────────────────────────────────────────────

export default function SessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string

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
  const [sessionLocale, setSessionLocale] = useState<AppLocale>('en')

  const resultRef = useRef<FinalStack | null>(null)
  const apiDone = useRef(false)
  const allShown = useRef(false)
  const reasoningTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const { setCollapsed } = useSidebar()

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
        if (data.conversation?.locale === 'fr') setSessionLocale('fr')
        if (data.conversation?.messages?.length > 0) {
          const restored: Message[] = data.conversation.messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' as const : 'ai' as const,
            text: m.content,
          }))
          // Attach stackId to the last AI message if conversation has a stack
          if (data.conversation.stack_id) {
            const lastAiIdx = [...restored].reverse().findIndex(m => m.role === 'ai')
            if (lastAiIdx !== -1) {
              const idx = restored.length - 1 - lastAiIdx
              restored[idx] = { ...restored[idx], stackId: data.conversation.stack_id }
            }
          }
          console.log('[session] restoring', restored.length, 'messages')
          setMessages(restored)

          // If a stack was generated in this session, load it
          if (data.conversation.stack_id) {
            console.log('[session] loading stack:', data.conversation.stack_id)
            try {
              const stackRes = await fetch(`/api/stacks/${data.conversation.stack_id}`)
              console.log('[session] stack fetch status:', stackRes.status)
              if (stackRes.ok) {
                const stackData = await stackRes.json()
                console.log('[session] stack data:', stackData)
                if (stackData.stack) {
                  console.log('[session] stack agents:', stackData.stack.agents)
                  setResult(stackData.stack)
                  setSavedStackId(data.conversation.stack_id)
                  setPhase('results')
                  setStreamedCount(stackData.stack.agents.length)
                  if (stackData.objective) {
                    setAnswers(prev => ({ ...prev, objective: stackData.objective }))
                  }

                  // Load implementation guides for the stack
                  console.log('[session] loading guides for', stackData.stack.agents.length, 'agents')
                  fetch('/api/guides', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      agents: stackData.stack.agents, 
                      ctx: { 
                        objective: stackData.objective || stackData.stack.stack_name, 
                        tech_level: 'intermediate',
                        locale: data.conversation?.locale === 'fr' ? 'fr' : 'en',
                        preferred_model: sessionStorage.getItem(`session_model_${sessionId}`) || undefined
                      } 
                    }),
                  }).then(async res => {
                    if (!res.ok || !res.body) {
                      console.warn('[Guides] Response not ok or no body:', res.status)
                      return
                    }
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
                          console.log('[Guides] Updated agent', idx, ':', agent.name)
                          setResult(prev => {
                            if (!prev) return prev
                            const agents = [...prev.agents]
                            agents[idx] = agent
                            return { ...prev, agents }
                          })
                        } catch (e) { 
                          console.warn('[Guides] Parse error:', e, 'line:', line)
                        }
                      }
                    }
                  }).catch(err => console.warn('[Guides] Stream error on reload:', err))
                } else {
                  console.warn('[session] stack data has no stack property')
                }
              } else {
                console.warn('[session] stack fetch failed:', stackRes.status, stackRes.statusText)
              }
            } catch (err) { 
              console.error('[session] stack load error:', err)
            }
          } else {
            console.log('[session] no stack_id in conversation')
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
      .then(r => {
        if (!r.ok) {
          console.error('[saveSession] HTTP error:', r.status, r.statusText)
          return { ok: false, error: `HTTP ${r.status}` }
        }
        return r.json()
      })
      .then(data => { 
        if (data?.locale === 'fr' || data?.locale === 'en') setSessionLocale(data.locale)
        if (data && !data.ok) console.error('[saveSession] API error:', data) 
      })
      .catch(err => console.error('[saveSession] fetch error:', err))
  }, [sessionId])

  const revealStack = useCallback((stack: FinalStack, stackId?: string) => {
    setResult(stack); setSavedStackId(stackId); setPhase('results'); setStreamedCount(0)
    stack.agents.forEach((_, idx) => { setTimeout(() => setStreamedCount(idx + 1), idx * 220) })
    fetch('/api/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        agents: stack.agents, 
        ctx: { 
          objective: stack.stack_name, 
          tech_level: 'intermediate',
          locale: sessionLocale,
          preferred_model: sessionStorage.getItem(`session_model_${sessionId}`) || undefined
        } 
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
          } catch { /* skip */ }
        }
      }
    }).catch(err => console.warn('[Guides] Stream error:', err))
  }, [sessionId, sessionLocale])

  const launchReasoning = useCallback((ans: Record<string, string>) => {
    reasoningTimers.current.forEach(t => clearTimeout(t))
    reasoningTimers.current = []
    setPhase('reasoning'); setReasoningStep(0)
    apiDone.current = false; allShown.current = false; resultRef.current = null
    setMessages(prev => {
      const hasReasoning = prev.some(m => m.role === 'reasoning')
      return hasReasoning ? prev : [...prev, { role: 'reasoning' }]
    })
    const preferred_model = sessionStorage.getItem(`session_model_${sessionId}`) || undefined
    fetch('/api/recommend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        objective: ans.objective, 
        sector: ans.sector ?? 'general', 
        budget: ans.budget ?? 'medium', 
        tech_level: ans.tech_level ?? 'intermediate', 
        team_size: 'solo', 
        timeline: 'weeks', 
        current_tools: [], 
        session_id: sessionId,
        preferred_model
      }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) {
        setError({ type: 'server', message: data.error ?? 'Server error occurred' })
        setPhase('error'); return
      }
      resultRef.current = data.result
      ;(resultRef.current as any)._stackId = data.stackId
      apiDone.current = true
      if (allShown.current) {
        const t = setTimeout(() => {
          setMessages(prev => {
            const updated = [...prev, { role: 'ai' as const, text: `Your stack with ${data.result.agents.length} agents is ready!`, stackId: data.stackId }]
            saveSession(updated, true, data.stackId)
            return updated
          })
          revealStack(data.result, data.stackId)
        }, 400)
        reasoningTimers.current.push(t)
      }
    }).catch(() => { setError({ type: 'server', message: 'Network error occurred' }); setPhase('error') })

    REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setReasoningStep(i)
        if (i === REASONING_STEPS.length - 1) {
          allShown.current = true
          if (apiDone.current && resultRef.current) {
            const stackId = (resultRef.current as any)._stackId
            const t2 = setTimeout(() => {
              setMessages(prev => {
                const updated = [...prev, { role: 'ai' as const, text: `Your stack with ${resultRef.current!.agents.length} agents is ready!`, stackId }]
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
  }, [revealStack, saveSession, sessionId])

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
      .filter(m => m.text && m.text.trim().length > 0)
      .slice(-10)
      .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text ?? '' }))

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId,
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

        const aiText = data.response ?? "I'm not sure I understand. Could you rephrase?"
        setMessages(prev => {
          const updated = [...prev, { role: 'ai' as const, text: aiText }]
          saveSession(updated)
          return updated
        })

        // Auto-generate stack if LLM decided it's ready — like Claude creating an artifact
        if (data.generate_stack === true && !result) {
          const objective = data.objective || answers.objective ||
            messages.filter(m => m.role === 'user').map(m => m.text ?? '').join(' ').slice(0, 500)

          if (objective.trim().length >= 10) {
            const ctx = extractContext(objective)
            const ans = {
              ...answers,
              objective,
              sector: ctx.sector ?? answers.sector ?? 'general',
              budget: ctx.budget ?? answers.budget ?? 'medium',
              tech_level: ctx.tech ?? answers.tech_level ?? 'intermediate',
            }
            setAnswers(ans)
            setTimeout(() => launchReasoning(ans), 600)
          }
        }
      })
      .catch(() => {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: 'ai', text: 'Network error occurred' }])
      })
  }, [messages, answers, result, saveSession, phase, launchReasoning, sessionId])

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
              onRetry={() => { setError(null); if (Object.keys(answers).length > 0) launchReasoning(answers) }}
              onShowStack={async (stackId) => {
                // Load and display the stack for this stackId
                try {
                  const res = await fetch(`/api/stacks/${stackId}`)
                  if (res.ok) {
                    const data = await res.json()
                    if (data.stack) {
                      setResult(data.stack)
                      setSavedStackId(stackId)
                      setPhase('results')
                      setStreamedCount(data.stack.agents.length)
                      if (data.objective) setAnswers(prev => ({ ...prev, objective: data.objective }))
                    }
                  }
                } catch { /* silent */ }
              }}
            />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-3 pb-3 pt-2">
            <div className="relative rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={phase === 'results' ? 'Ask about your stack or request changes...' : 'Describe what you want to build...'}
                rows={2} disabled={phase === 'reasoning'}
                className="w-full bg-transparent text-zinc-800 dark:text-zinc-200 text-sm px-4 pt-3 pb-10 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 leading-relaxed disabled:opacity-40" />
              <div className="absolute bottom-2.5 left-3 right-12 flex items-center">
                <ChatModelSelector />
              </div>
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
          <StackDirectory currentSessionId={sessionId} onSelectStack={(sid) => router.push(`/dashboard/recommend/${sid}`)} />
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
                className="h-full overflow-y-auto px-6 py-6 scrollbar-hide">
                <div className="max-w-2xl mx-auto">
                  <StackArtifact
                    agents={result.agents}
                    stackName={result.stack_name}
                    objective={answers.objective ?? result.justification ?? ''}
                    totalCost={result.total_cost}
                    roiEstimate={result.roi_estimate}
                    timeSaved={result.time_saved_per_week}
                    streamedCount={streamedCount}
                    stackId={savedStackId}
                    onRegenerate={() => {
                      if (Object.keys(answers).length > 0) {
                        setResult(null)
                        setPhase('chat')
                        launchReasoning(answers)
                      }
                    }}
                  />
                  {savedStackId && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                      className="mt-6">
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
                    <p className="text-zinc-500 text-sm">Building your roadmap...</p>
                  </motion.div>
                ) : (
                  <p className="text-zinc-700 text-sm">Building your roadmap...</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
