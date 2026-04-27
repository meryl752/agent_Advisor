'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function WelcomeToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Clear any stored welcome message — we no longer show it
    localStorage.removeItem('stackai_welcome_message')
  }, [])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border border-zinc-800 shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch bg-[#CAFF32] rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-dm-mono text-[10px] text-[#CAFF32] uppercase tracking-widest mb-1">
                Welcome
              </p>
              <p className="text-zinc-300 text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none flex-shrink-0 mt-0.5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
