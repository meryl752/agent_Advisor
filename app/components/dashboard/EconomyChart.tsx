'use client'

import { motion } from 'framer-motion'

const data = [
    { month: 'Jan', value: 35 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 45 },
    { month: 'Apr', value: 70 },
    { month: 'May', value: 63 },
    { month: 'Jun', value: 90 },
]

export default function EconomyChart() {
    const min = 0
    const max = 100
    const width = 400
    const height = 150
    const padding = 20

    const getX = (index: number) => (index / (data.length - 1)) * (width - padding * 2) + padding
    const getY = (value: number) => height - padding - ((value - min) / (max - min)) * (height - padding * 2)

    // Generate path for the area
    const areaPath = data.reduce((path, point, i) => {
        const x = getX(i)
        const y = getY(point.value)
        return `${path} L ${x} ${y}`
    }, `M ${getX(0)} ${getY(data[0].value)}`) + ` L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`

    // Generate path for the line
    const linePath = data.reduce((path, point, i) => {
        const x = getX(i)
        const y = getY(point.value)
        return `${path} L ${x} ${y}`
    }, `M ${getX(0)} ${getY(data[0].value)}`)

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 relative min-h-[120px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#CAFF32" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#CAFF32" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines (horizontal) */}
                    {[0, 25, 50, 75, 100].map((v) => (
                        <line
                            key={v}
                            x1={padding}
                            y1={getY(v)}
                            x2={width - padding}
                            y2={getY(v)}
                            stroke="currentColor"
                            className="text-zinc-200 dark:text-white/5"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Area fill */}
                    <motion.path
                        d={areaPath}
                        fill="url(#areaGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />

                    {/* The main line */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke="#CAFF32"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Glow line */}
                    <motion.path
                        d={linePath}
                        fill="none"
                        stroke="#CAFF32"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-20 blur-[4px]"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    {/* Points */}
                    {data.map((point, i) => (
                        <motion.circle
                            key={i}
                            cx={getX(i)}
                            cy={getY(point.value)}
                            r="4"
                            className="fill-white dark:fill-zinc-950 stroke-[#CAFF32]"
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1 + i * 0.1 }}
                            whileHover={{ scale: 1.5 }}
                        />
                    ))}
                </svg>
            </div>

            {/* Labels */}
            <div className="flex justify-between px-[5%] mt-4">
                {data.map((point, i) => (
                    <span key={i} className="font-dm-mono text-[9px] text-zinc-400 dark:text-zinc-600 uppercase tracking-tight font-bold">
                        {point.month}
                    </span>
                ))}
            </div>
        </div>
    )
}
