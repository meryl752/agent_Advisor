'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface StackChatProps {
  stackContext: {
    stack_name: string
    objective: string
    total_cost: number
    agents: Array<{ name: string; role: string }>
  }
}

const QUICK_QUESTIONS = [
  'Par où commencer ?',
  'Quel est le ROI réaliste ?',
  'Des alternatives moins chères ?',
  'Délai de mise en place ?',
]

export default function StackChat({ stackContext }: StackChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/stack-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, stackContext }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response ?? data.error ?? 'Erreur inattendue.'
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur réseau — réessaie dans un instant.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/60 transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.15em]">
            Expert StackAI — Pose une question
          </p>
        </div>
        <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">
          {open ? '↑' : '↓'}
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-800">
          {/* Quick questions (si aucun message) */}
          {messages.length === 0 && (
            <div className="p-3 flex flex-col gap-1.5">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
                  className="text-left text-xs text-zinc-400 hover:text-zinc-200
                             bg-zinc-900 hover:bg-zinc-800 border border-zinc-800
                             hover:border-[#CAFF32]/20 px-3 py-2 transition-all"
                >
                  <span className="text-[#CAFF32]/60 mr-2 font-mono text-[10px]">→</span>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div className="p-3 flex flex-col gap-3 max-h-56 overflow-y-auto scrollbar-hide">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    m.role === 'user' && 'justify-end'
                  )}
                >
                  {m.role === 'assistant' && (
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5
                                    bg-[#CAFF32]/10 border border-[#CAFF32]/20">
                      <span className="text-[#CAFF32] text-[7px] font-black tracking-tight">AI</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'text-xs leading-relaxed max-w-[85%] px-3 py-2',
                      m.role === 'user'
                        ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0
                                  bg-[#CAFF32]/10 border border-[#CAFF32]/20">
                    <span className="text-[#CAFF32] text-[7px] font-black">AI</span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 px-3 py-2 flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-[#CAFF32]/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-zinc-800">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Une question sur ce stack..."
              className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs
                         px-3 py-2 outline-none focus:border-[#CAFF32]/30
                         placeholder:text-zinc-600 transition-colors font-mono"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="bg-[#CAFF32] text-zinc-900 font-black text-xs px-3 py-2
                         hover:bg-[#d4ff50] transition-colors disabled:opacity-40
                         disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
