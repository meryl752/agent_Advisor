'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StackUpdatesFeedProps {
  stack: { id: string; name: string } | null
}

// Mock data — sera remplacé par de vraies données plus tard
const MOCK_UPDATES = [
  {
    id: '1',
    type: 'price_drop',
    agent_name: 'Make.com',
    message: 'Prix réduit de 29€ à 19€/mois',
    impact: 'Économie de 10€/mois',
    timestamp: '2h',
    color: '#10b981',
  },
  {
    id: '2',
    type: 'better_alternative',
    agent_name: 'Zapier',
    replacement: 'n8n',
    message: 'Alternative open source disponible',
    impact: 'Économie de 49€/mois + plus de flexibilité',
    timestamp: '1j',
    color: '#3b82f6',
  },
  {
    id: '3',
    type: 'new_integration',
    agent_name: 'Notion AI',
    message: 'Nouvelle intégration Slack disponible',
    impact: 'Automatisation des notes de réunion',
    timestamp: '3j',
    color: '#8b5cf6',
  },
]

export function StackUpdatesFeed({ stack }: StackUpdatesFeedProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!stack) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center">
        <p className="text-sm text-zinc-400">No active stacks</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          {/* Bell icon */}
          <div className="relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-zinc-600 dark:text-zinc-400"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Notification badge */}
            {MOCK_UPDATES.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#CAFF32] rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-900">
                {MOCK_UPDATES.length}
              </span>
            )}
          </div>
          
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            Updates
          </span>
        </div>

        {/* Dropdown chevron */}
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      {/* Dropdown content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              {MOCK_UPDATES.map((update, i) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 hover:border-[#CAFF32]/20 transition-colors group"
                >
                  <div
                    className="w-1 h-full rounded-full flex-shrink-0"
                    style={{ background: update.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-900 dark:text-white mb-0.5">
                      {update.agent_name}
                      {update.replacement && (
                        <span className="text-zinc-500"> → {update.replacement}</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">{update.message}</p>
                    <p className="text-[10px] text-[#CAFF32] font-medium">{update.impact}</p>
                  </div>
                  <span className="text-[9px] text-zinc-400 flex-shrink-0">{update.timestamp}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
