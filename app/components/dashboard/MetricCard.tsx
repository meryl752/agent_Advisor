'use client'

import { useState } from 'react'

interface MetricCardProps {
  label: string
  value: string
  accent?: boolean
  tooltip?: string
}

export function MetricCard({ label, value, accent, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 relative">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-xs text-zinc-400">{label}</p>
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex items-center justify-center text-[9px] font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              aria-label="Plus d'infos"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-zinc-900 text-zinc-200 text-xs p-3 rounded-xl shadow-2xl z-50 border border-zinc-700/60 leading-relaxed">
                {tooltip}
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1.5 w-3 h-3 bg-zinc-900 border-l border-t border-zinc-700/60 rotate-45" />
              </div>
            )}
          </div>
        )}
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-[#CAFF32]' : 'text-zinc-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}
