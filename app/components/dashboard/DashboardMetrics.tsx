'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MetricProps {
    label: string
    value: string
    sub: string
    trend?: string
    trendUp?: boolean
    sparklineData: number[]
    color?: string
    delay?: number
}

function Sparkline({ data, color }: { data: number[], color: string }) {
    if (data.length === 0) return null
    
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    
    const width = 100
    const height = 30
    const padding = 2
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - (((val - min) / range) * (height - padding * 2) + padding)
        return `${x},${y}`
    }).join(' ')

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-8 overflow-visible">
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Glow effect */}
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="opacity-20 blur-[2px]"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
        </svg>
    )
}

function MetricCard({ label, value, sub, trend, trendUp, sparklineData, color = '#fff', delay = 0 }: MetricProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="relative bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl rounded-none p-6 
                       border border-zinc-200 dark:border-white/[0.05]
                       hover:border-zinc-300 dark:hover:border-white/[0.1] 
                       transition-all overflow-hidden group/card shadow-sm dark:shadow-2xl"
        >
            {/* Liquid Highlight Effect (Aceternity style) */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
            
            {/* Hover subtle glow */}
            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at 50% 0%, ${color}08, transparent 70%)` }} />
            
            <div className="flex justify-between items-start mb-6">
                <p className="font-mono text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] font-bold">
                    {label}
                </p>
                <Sparkline data={sparklineData} color={color} />
            </div>

            <div className="flex items-end justify-between relative z-10">
                <div>
                    <p className="font-syne font-black text-4xl mb-1.5 tabular-nums tracking-tight text-zinc-900 dark:text-white"
                        style={{ color: color === '#fff' ? undefined : (color === '#CAFF32' ? 'var(--accent)' : color) }}>
                        {value}
                    </p>
                    <div className="flex items-center gap-2">
                        {trend && (
                            <div className={cn(
                                "flex items-center font-mono text-[9px] font-black px-1.5 py-0.5 rounded-sm border",
                                trendUp 
                                    ? "bg-green-500/5 text-green-500 border-green-500/10" 
                                    : "bg-red-500/5 text-red-500 border-red-500/10"
                            )}>
                                {trendUp ? '↑' : '↓'} {trend}
                            </div>
                        )}
                        <p className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">{sub}</p>
                    </div>
                </div>
                
                {/* Status indicator shadow */}
                <div className="w-2 h-2 rounded-full border border-black/10 dark:border-white/10" 
                     style={{ 
                         background: color,
                         boxShadow: `0 0 15px ${color}60`
                     }} />
            </div>
        </motion.div>
    )
}

export default function DashboardMetrics({ stackCount }: { stackCount: number }) {
    const metrics: MetricProps[] = [
        {
            label: 'ROI ce mois',
            value: stackCount > 0 ? '+340€' : '—',
            sub: 'vs mois dernier',
            trend: '23%',
            trendUp: true,
            sparklineData: [280, 290, 310, 305, 330, 340],
            color: '#CAFF32',
            delay: 0
        },
        {
            label: 'Stacks créés',
            value: String(stackCount),
            sub: stackCount === 0 ? 'Lance ton premier' : 'Stacks actifs',
            trend: stackCount > 0 ? '+12%' : undefined,
            trendUp: true,
            sparklineData: [2, 3, 2, 4, 5, stackCount || 4],
            color: '#38bdf8',
            delay: 0.1
        },
        {
            label: 'Stack Score',
            value: stackCount > 0 ? '84' : '—',
            sub: '/100 global',
            trend: '8%',
            trendUp: true,
            sparklineData: [72, 75, 78, 80, 79, 84],
            color: stackCount > 0 && 84 > 80 ? '#CAFF32' : '#FF6B35',
            delay: 0.2
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {metrics.map((m, i) => (
                <MetricCard key={i} {...m} />
            ))}
        </div>
    )
}
