'use client'

import { motion } from 'framer-motion'

interface CoverageRingProps {
  covered: number
  total: number
  score: number
}

export default function CoverageRing({ covered, total, score }: CoverageRingProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#CAFF32'
    : score >= 50 ? '#38bdf8'
    : '#f97316'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          {/* Track */}
          <circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            className="dark:[stroke:rgba(255,255,255,0.05)]"
            strokeWidth="10"
          />
          {/* Progress */}
          <motion.circle
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="font-syne font-black text-3xl text-zinc-900 dark:text-white leading-none"
          >
            {score}%
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5"
          >
            couverture
          </motion.span>
        </div>
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="font-dm-mono text-xs text-zinc-400 text-center"
      >
        <span className="text-zinc-900 dark:text-white font-bold">{covered}</span>
        <span className="text-zinc-400 dark:text-zinc-600">/{total}</span>
        {' '}tâches couvertes
      </motion.p>
    </div>
  )
}
