'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { SUGGESTIONS } from './_components/types'

// Load sidebar client-only — never SSR to avoid hydration mismatch
const RecentConversationsSidebar = dynamic(
  () => import('./_components/RecentConversationsSidebar'),
  { ssr: false }
)

export default function RecommendPage() {
  const router = useRouter()
  const [input, setInput] = useState('')

  const handleSend = () => {
    const text = input.trim()
    if (text.length < 2) return
    const sessionId = crypto.randomUUID()
    sessionStorage.setItem(`session_init_${sessionId}`, text)
    router.push(`/dashboard/recommend/${sessionId}`)
  }

  return (
    <div className="h-full flex relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Decorative backgrounds */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(202,255,50,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 20% 80%, rgba(202,255,50,0.04) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 80% 20%, rgba(202,255,50,0.03) 0%, transparent 50%)
          `,
        }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(rgba(202,255,50,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(202,255,50,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        } as React.CSSProperties} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(202,255,50,0.03) 0%, transparent 65%)' }} />
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(202,255,50,0.12) 0%, transparent 65%)' }} />
      <div className="absolute pointer-events-none dark:hidden"
        style={{ top: '10%', right: '8%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(202,255,50,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute pointer-events-none dark:hidden"
        style={{ bottom: '15%', left: '5%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(202,255,50,0.08) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Early adopter banner */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Accès Early Adopter</p>
      </div>

      {/* CENTER — main content */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-syne text-3xl md:text-4xl tracking-tight mb-6 leading-[1.1] text-zinc-900 dark:text-white font-medium">
              Ton stack IA,{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #7aaa00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>sur-mesure</span>
            </h1>
          </div>

          {/* Input */}
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            onFocusCapture={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid rgba(202,255,50,0.5)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 2px rgba(202,255,50,0.08), 0 2px 12px rgba(0,0,0,0.06)'
            }}
            onBlurCapture={e => {
              (e.currentTarget as HTMLElement).style.border = '1px solid var(--border)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ex: Je veux automatiser mon service client Shopify, budget 50€, débutant..."
              rows={3}
              className="w-full bg-transparent text-zinc-900 dark:text-white text-sm px-6 pt-5 pb-12 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 leading-relaxed"
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleSend}
                disabled={input.trim().length < 2}
                className="w-9 h-9 rounded-xl font-bold text-base bg-[#CAFF32] text-zinc-900 hover:bg-[#d4ff50] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >↑</button>
            </div>
          </div>

          {/* Suggestions carousel */}
          <div className="w-full overflow-hidden mt-4"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}>
            {[0, 1].map(row => (
              <div key={row} className="flex overflow-hidden mb-2">
                <motion.div
                  animate={{ x: row === 0 ? [-900, 0] : [0, -900] }}
                  transition={{ duration: row === 0 ? 45 : 55, repeat: Infinity, ease: 'linear' }}
                  className="flex gap-2 whitespace-nowrap"
                >
                  {[...SUGGESTIONS, ...SUGGESTIONS, ...SUGGESTIONS].map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(s.prompt)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-xs transition-all text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-[#CAFF32]/30 bg-transparent"
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT — Recent conversations sidebar (client-only, no SSR) */}
      <RecentConversationsSidebar />

    </div>
  )
}
