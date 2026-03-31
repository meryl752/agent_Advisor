'use client'

import { motion } from 'framer-motion'

interface ROIChartProps {
  roiEstimate: number   // percentage, e.g. 340
  totalCost: number     // monthly cost in euros
  timeSavedPerWeek?: number // hours saved per week
}

export default function ROIChart({ roiEstimate, totalCost, timeSavedPerWeek = 0 }: ROIChartProps) {
  const months = [1, 2, 3, 4, 5, 6]

  // If tools are free, calculate savings based on time saved (valued at 25€/hour)
  const hourlyRate = 25
  const monthlySavingsBase = totalCost > 0
    ? totalCost * (roiEstimate / 100)
    : timeSavedPerWeek * hourlyRate * 4 // 4 weeks per month

  const savings = months.map(m => Math.round(m * monthlySavingsBase))

  const maxSaving = savings[savings.length - 1] || 1
  const chartWidth = 320
  const chartHeight = 160
  const barWidth = 36
  const gap = (chartWidth - months.length * barWidth) / (months.length + 1)
  const paddingBottom = 28
  const paddingTop = 12

  const availableHeight = chartHeight - paddingBottom - paddingTop

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
      <p className="font-dm-mono text-[0.6rem] text-zinc-500 uppercase tracking-[0.15em] mb-4">
        ✦ Projection ROI — 6 mois
      </p>
      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="block mx-auto"
          aria-label="ROI projection chart"
        >
          {/* Y-axis grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingTop + availableHeight * (1 - ratio)
            return (
              <line
                key={ratio}
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
            )
          })}

          {/* Bars */}
          {savings.map((saving, i) => {
            const barHeight = Math.max(4, (saving / maxSaving) * availableHeight)
            const x = gap + i * (barWidth + gap)
            const y = paddingTop + availableHeight - barHeight

            return (
              <g key={i}>
                {/* Bar background */}
                <rect
                  x={x}
                  y={paddingTop}
                  width={barWidth}
                  height={availableHeight}
                  fill="rgba(255,255,255,0.02)"
                  rx={4}
                />
                {/* Animated bar */}
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#barGradient)"
                  rx={4}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                  style={{ transformOrigin: `${x + barWidth / 2}px ${paddingTop + availableHeight}px` }}
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="#CAFF32"
                  fontSize="8"
                  fontFamily="monospace"
                  opacity={0.8}
                >
                  {saving >= 1000 ? `${(saving / 1000).toFixed(1)}k` : saving}€
                </text>
                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  M{i + 1}
                </text>
              </g>
            )
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CAFF32" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#CAFF32" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className="font-dm-mono text-[0.58rem] text-zinc-600 text-center mt-2">
        Économies cumulées estimées (€)
      </p>
    </div>
  )
}
