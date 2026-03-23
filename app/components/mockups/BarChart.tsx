'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Bar {
  height: number
  orange?: boolean
}

const DEFAULT_BARS: Bar[] = [
  { height: 35 }, { height: 52 }, { height: 45 },
  { height: 70 }, { height: 63 }, { height: 90, orange: true },
]

export default function BarChart({ bars }: { bars?: Bar[] }) {
  const data = bars ?? DEFAULT_BARS
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const t = setTimeout(() => setAnimated(true), 800)
    return () => clearTimeout(t)
  }, [isInView])

  return (
    <div ref={ref} className="bg-bg-3 border border-border p-4">
      <p className="font-dm-mono text-[0.6rem] text-muted tracking-[0.08em] uppercase mb-3">
        Économies générées — 6 derniers mois
      </p>
      <div className="flex items-end gap-[6px] h-[60px]">
        {data.map((bar, i) => (
          <div key={i} className="flex-1 bg-border-2 relative">
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 opacity-70',
                bar.orange ? 'bg-accent-2' : 'bg-accent'
              )}
              style={{
                height: animated ? `${bar.height}%` : '0%',
                transition: `height 1200ms cubic-bezier(0.23,1,0.32,1) ${i * 100}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}