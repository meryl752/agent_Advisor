'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Message, Phase, ApiError } from './types'
import { REASONING_STEPS } from './types'

export function AgentLog({ messages, reasoningStep, isTyping, phase, error, onRetry, onShowStack }: {
  messages: Message[]
  reasoningStep: number
  isTyping: boolean
  phase: Phase
  error: ApiError | null
  onRetry: () => void
  onShowStack?: (stackId: string) => void
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
            <div className="flex w-full min-w-0 justify-end">
              <div className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tr-sm px-4 py-3 text-left text-[14px] leading-relaxed font-medium shadow-sm w-fit max-w-[90%] break-words">
                {msg.text}
              </div>
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
                        className={`flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300`}>
                        {done
                          ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#CAFF32" strokeWidth="2" strokeLinecap="round">
                              <path d="M17 3.33782C15.5291 2.48697 13.8214 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10" />
                              <path d="M8 12.5C8 12.5 9.5 12.5 11.5 16C11.5 16 17.0588 6.83333 22 5" />
                            </svg>
                          : active
                            ? <div className="w-4 h-4 rounded-full border border-[#CAFF32]/60 flex items-center justify-center">
                                <motion.div
                                  animate={{ scale: [1, 1.8, 1] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  style={{ width: 4, height: 4, borderRadius: '50%', background: '#CAFF32' }}
                                />
                              </div>
                            : <div className="w-4 h-4 rounded-full border border-zinc-700" />}
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
            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{msg.text}</p>
              {msg.stackId && onShowStack && (
                <button
                  onClick={() => onShowStack(msg.stackId!)}
                  className="self-start text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 underline underline-offset-2"
                >
                  View Stack
                </button>
              )}
            </div>
          )}
        </motion.div>
      ))}

      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex gap-1 py-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#52525b', flexShrink: 0 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {phase === 'error' && error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs text-zinc-300">{error.message}</p>
          <button onClick={onRetry} className="text-[10px] text-zinc-400 hover:text-white transition-colors text-left">Retry</button>
        </motion.div>
      )}
    </div>
  )
}
