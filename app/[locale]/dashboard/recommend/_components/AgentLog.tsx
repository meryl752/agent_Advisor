'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Message, Phase, ApiError } from './types'
import { REASONING_STEPS } from './types'

export function AgentLog({ messages, reasoningStep, isTyping, phase, error, onRetry }: {
  messages: Message[]
  reasoningStep: number
  isTyping: boolean
  phase: Phase
  error: ApiError | null
  onRetry: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTimeout(() => {
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
    }, 80)
  }, [messages, isTyping, reasoningStep])

  return (
    <div ref={ref} className="flex-1 overflow-y-auto py-5 px-4 scrollbar-hide flex flex-col gap-4">
      {messages.map((msg, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {msg.role === 'user' ? (
            <div className="bg-white text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed font-medium shadow-sm self-end max-w-[90%] ml-auto">
              {msg.text}
            </div>
          ) : msg.role === 'reasoning' ? (
            phase === 'error' ? null : (
              <div className="flex flex-col">
                {REASONING_STEPS.map((step, si) => {
                  if (si > reasoningStep) return null
                  const done = si < reasoningStep || (si === reasoningStep && phase === 'results')
                  const active = si === reasoningStep && phase === 'reasoning'
                  return (
                    <div key={si} className="relative flex items-start gap-2.5">
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
                        {done
                          ? <span className="text-zinc-900 text-[7px] font-black">✓</span>
                          : active
                            ? <motion.div className="w-1 h-1 rounded-full bg-[#CAFF32]"
                                animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                            : null}
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`text-sm pb-3 leading-relaxed ${done ? 'text-zinc-600' : active ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {step}
                      </motion.p>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{msg.text}</p>
          )}
        </motion.div>
      ))}

      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1 py-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </motion.div>
      )}

      {phase === 'error' && error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs text-zinc-300">
            {error.type === 'rate-limit' ? 'Limite atteinte.' : error.message}
          </p>
          {error.type === 'rate-limit'
            ? <a href="/dashboard/billing" className="text-[10px] text-[#CAFF32] hover:underline">Passer en Pro →</a>
            : <button onClick={onRetry} className="text-[10px] text-zinc-400 hover:text-white transition-colors text-left">↺ Réessayer</button>}
        </motion.div>
      )}
    </div>
  )
}
