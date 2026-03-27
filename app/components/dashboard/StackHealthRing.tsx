'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DimensionProps {
    label: string
    value: number
    color: string
    delay?: number
}

function DimensionIndicator({ label, value, color, delay = 0 }: DimensionProps) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.5 }}
            className="flex items-center gap-3"
        >
            <div className="flex flex-col">
                <span className="font-dm-mono text-[8px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest font-bold mb-0.5">{label}</span>
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 w-16 bg-zinc-100 dark:bg-white/5 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: delay + 0.8, ease: "easeOut" }}
                            className="h-full"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                    <span className="font-mono text-[10px] font-black dark:text-zinc-300 text-zinc-900">{value}%</span>
                </div>
            </div>
        </motion.div>
    )
}

export default function StackHealthRing({ score = 84 }: { score?: number }) {
    const radius = 80
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div className="relative flex items-center justify-between gap-12 p-8 bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-white/[0.05] shadow-sm dark:shadow-2xl overflow-hidden group">
            {/* Liquid Highlight */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Background Pattern */}
            <div className="absolute -right-8 -bottom-8 w-64 h-64 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <svg viewBox="0 0 200 200" className="w-full h-full text-current">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                </svg>
            </div>

            {/* Left: Dimensions */}
            <div className="flex flex-col gap-6 relative z-10">
                <DimensionIndicator label="ROI Boost" value={92} color="#CAFF32" delay={0.1} />
                <DimensionIndicator label="Workflow Coverage" value={78} color="#38bdf8" delay={0.2} />
                <DimensionIndicator label="Tool Synergy" value={86} color="#FF6B35" delay={0.3} />
                <DimensionIndicator label="Efficiency" value={81} color="#A78BFA" delay={0.4} />
            </div>

            {/* Center/Right: The Ring */}
            <div className="relative flex items-center justify-center min-w-[200px]">
                <svg className="w-48 h-48 -rotate-90">
                    {/* Background Ring */}
                    <circle
                        cx="96"
                        cy="96"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-zinc-100 dark:text-white/[0.03]"
                    />
                    {/* Progress Ring */}
                    <motion.circle
                        cx="96"
                        cy="96"
                        r={radius}
                        fill="none"
                        stroke="#CAFF32"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                        strokeLinecap="square"
                        className="drop-shadow-[0_0_8px_rgba(202,255,50,0.4)]"
                    />
                </svg>
                
                {/* Score Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                        className="font-syne font-black text-6xl dark:text-white text-zinc-900 tracking-tighter"
                    >
                        {score}
                    </motion.span>
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold"
                    >
                        Stack Score
                    </motion.span>
                </div>
            </div>

            {/* Info Badge */}
            <div className="absolute bottom-6 left-8 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse" />
                <span className="font-dm-mono text-[9px] text-zinc-400 uppercase tracking-widest font-black">
                    Optimal Health
                </span>
            </div>
        </div>
    )
}
