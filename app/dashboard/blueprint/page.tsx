'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SECTORS } from '@/lib/blueprint/sectors'
import type { SectorConfig } from '@/lib/blueprint/sectors'
import { cn } from '@/lib/utils'

const SECTOR_LIST = Object.values(SECTORS)

function SectorCard({ sector, isLast }: { sector: SectorConfig; isLast?: boolean }) {
  return (
    <Link
      href={`/dashboard/blueprint/${sector.slug}`}
      className={cn(
        'group relative flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-200',
        'bg-zinc-900/50 border-zinc-800',
        'hover:border-[#CAFF32]/40 hover:bg-zinc-900 hover:shadow-[0_0_24px_rgba(202,255,50,0.06)]'
      )}
    >
      {/* Icon */}
      <div className="text-3xl">{sector.icon}</div>

      {/* Label + description */}
      <div className="flex-1">
        <h3 className="font-syne font-black text-white text-lg mb-1 group-hover:text-[#CAFF32] transition-colors">
          {sector.label}
        </h3>
        <p className="font-dm-sans text-sm text-zinc-500 leading-relaxed">
          {sector.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        <span className="font-dm-mono text-[10px] text-zinc-600 uppercase tracking-widest">
          {sector.tasks.length} tâches
        </span>
        <span className="font-dm-mono text-[10px] text-zinc-700 group-hover:text-[#CAFF32] transition-colors">
          Explorer →
        </span>
      </div>

      {/* Hover accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#CAFF32]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
    </Link>
  )
}

export default function BlueprintPage() {
  const [lastViewed, setLastViewed] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('blueprint_last_sector')
    if (stored) setLastViewed(stored)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-dm-mono text-[10px] text-[#CAFF32] uppercase tracking-[0.2em]">
            ◉ AI Playbook
          </span>
          <span className="font-dm-mono text-[9px] bg-[#CAFF32]/10 text-[#CAFF32] border border-[#CAFF32]/20 px-2 py-[2px] rounded-full">
            Nouveau
          </span>
        </div>
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-3">
          Your AI Playbook
        </h1>
        <p className="font-dm-sans text-sm text-zinc-500 max-w-xl leading-relaxed">
          Pick your business type and get the complete map of daily tasks you can automate with AI — with the best tool for each one.
        </p>
      </div>

      {/* Last viewed */}
      {lastViewed && SECTORS[lastViewed as keyof typeof SECTORS] && (
        <div className="mb-6 flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
          <span className="text-lg">{SECTORS[lastViewed as keyof typeof SECTORS].icon}</span>
          <div className="flex-1">
            <p className="font-dm-mono text-[10px] text-zinc-600 uppercase tracking-widest mb-0.5">Dernière visite</p>
            <p className="font-syne font-bold text-sm text-white">
              {SECTORS[lastViewed as keyof typeof SECTORS].label}
            </p>
          </div>
          <Link
            href={`/dashboard/blueprint/${lastViewed}`}
            className="font-dm-mono text-[10px] text-[#CAFF32] hover:underline"
          >
            Reprendre →
          </Link>
        </div>
      )}

      {/* Sector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTOR_LIST.map((sector, i) => (
          <SectorCard key={sector.slug} sector={sector} isLast={i === SECTOR_LIST.length - 1} />
        ))}
      </div>
    </div>
  )
}
