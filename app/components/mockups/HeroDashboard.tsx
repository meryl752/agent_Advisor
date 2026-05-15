'use client'

import MockupWindow from './MockupWindow'
import DashboardCard from './DashboardCard'
import BarChart from './BarChart'
import StackList from './StackList'
import { motion } from 'framer-motion'

const METRICS = [
  { label: 'ROI this month', value: '+340€', sub: '↑ 23% vs last month', variant: 'green' as const },
  { label: 'Active tools', value: '7', sub: 'out of 12 recommended', variant: 'default' as const },
  { label: 'Stack Score', value: '84/100', sub: '↑ +6 this week', variant: 'orange' as const },
]

const BARS = [
  { height: 35 }, { height: 52 }, { height: 45 },
  { height: 70 }, { height: 63 }, { height: 90, variant: 'orange' as const },
]

const STACK_ITEMS = [
  { name: 'Claude Sonnet', score: 92 },
  { name: 'Make.com', score: 85 },
  { name: 'Perplexity Pro', score: 78 },
]

export default function HeroDashboard() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <MockupWindow>
        <div className="p-5 flex flex-col gap-[14px]">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-[10px]">
            {METRICS.map((m) => (
              <DashboardCard key={m.label} {...m} />
            ))}
          </div>

          {/* Bar chart */}
          <BarChart bars={BARS} />

          {/* Stack list */}
          <StackList items={STACK_ITEMS} />
        </div>
      </MockupWindow>
    </motion.div>
  )
}
