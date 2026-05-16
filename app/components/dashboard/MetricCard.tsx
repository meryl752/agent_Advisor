'use client'

import { useState } from 'react'

interface MetricCardProps {
  label: string
  value: string
  accent?: boolean
  tooltip?: string
  icon?: string
  /** Borderless polished surface (Overview light mode). */
  polished?: boolean
}

export function MetricCard({ label, value, accent, tooltip, icon, polished }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const surface = polished
    ? 'rounded-2xl border-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] dark:border dark:border-zinc-800 dark:shadow-none dark:bg-zinc-900/30 p-5 relative flex flex-col gap-3 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.05),0_12px_28px_rgba(0,0,0,0.06)] dark:hover:border-zinc-700'
    : 'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-5 relative flex flex-col gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors'

  return (
    <div className={surface}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p suppressHydrationWarning className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
          {tooltip && (
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="w-3.5 h-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center text-[9px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                aria-label="More info"
              >
                ?
              </button>
              {showTooltip && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-zinc-900 text-zinc-200 text-xs p-3 rounded-xl shadow-2xl z-50 border border-zinc-700/60 leading-relaxed">
                  {tooltip}
                  <div className="absolute -top-1.5 left-1.5 w-3 h-3 bg-zinc-900 border-l border-t border-zinc-700/60 rotate-45" />
                </div>
              )}
            </div>
          )}
        </div>
        {icon && (
          <span className={`text-sm ${accent ? 'text-[#CAFF32]' : 'text-zinc-300 dark:text-zinc-600'}`}>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <p suppressHydrationWarning className={`text-3xl font-syne font-black tracking-tight leading-none ${accent ? 'text-[#CAFF32]' : 'text-zinc-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}
