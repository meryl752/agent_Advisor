'use client'

import { useEffect, useState } from 'react'

interface DashboardCard {
  label: string
  value: string
  sub: string
  valueColor?: string
}

const CARDS: DashboardCard[] = [
  { label: 'ROI ce mois', value: '+340€', sub: '↑ 23% vs mois dernier', valueColor: '#C8F135' },
  { label: 'Outils actifs', value: '7', sub: 'sur 12 recommandés' },
  { label: 'Stack Score', value: '84/100', sub: '↑ +6 cette semaine', valueColor: '#ff6b2b' },
]

const BARS = [
  { height: 35, orange: false },
  { height: 52, orange: false },
  { height: 45, orange: false },
  { height: 70, orange: false },
  { height: 63, orange: false },
  { height: 90, orange: true },
]

const STACK_ITEMS = [
  { name: 'Claude Sonnet', score: 92 },
  { name: 'Make.com', score: 85 },
  { name: 'Perplexity Pro', score: 78 },
]

export default function DashboardMockup() {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="p-5 flex flex-col gap-[14px]">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-[10px]">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="p-[14px] flex flex-col"
            style={{ background: '#111', border: '1px solid #1a1a1a' }}
          >
            <span className="font-dm-mono text-[0.6rem] text-[#444] uppercase mb-[6px]">
              {card.label}
            </span>
            <span
              className="font-syne font-extrabold text-[1.4rem]"
              style={{ color: card.valueColor ?? '#f0ede6' }}
            >
              {card.value}
            </span>
            <span className="font-dm-mono text-[0.6rem] mt-[3px]" style={{ color: '#3a3a3a' }}>
              {card.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="p-4" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="font-dm-mono text-[0.6rem] text-[#444] uppercase mb-3">
          Économies générées — 6 derniers mois
        </div>
        <div className="flex items-end gap-[6px] h-[60px]">
          {BARS.map((bar, i) => (
            <div key={i} className="flex-1 relative" style={{ background: '#222' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bar-animated"
                style={{
                  height: animated ? `${bar.height}%` : '0%',
                  background: bar.orange ? '#ff6b2b' : '#C8F135',
                  opacity: 0.7,
                  transitionDelay: `${i * 120}ms`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Stack list */}
      <div className="p-[14px]" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
        <div className="font-dm-mono text-[0.6rem] text-[#444] uppercase mb-[10px]">
          Ton stack actuel
        </div>
        {STACK_ITEMS.map((item) => (
          <div
            key={item.name}
            className="flex items-center py-[7px]"
            style={{ borderBottom: '1px solid #161616' }}
          >
            <span className="font-dm-mono text-[0.68rem] text-[#999] flex-shrink-0 w-32">
              {item.name}
            </span>
            <div className="flex-1 mx-[10px] h-[3px]" style={{ background: '#222' }}>
              <div
                className="h-full"
                style={{ width: `${item.score}%`, background: '#C8F135', opacity: 0.6 }}
              />
            </div>
            <span className="font-syne font-bold text-[0.75rem] text-[#C8F135]">
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
