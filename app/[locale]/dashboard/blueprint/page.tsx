'use client'

import { useEffect, useState } from 'react'
import { Link } from '@/lib/i18n/navigation'
import { SECTORS } from '@/lib/blueprint/sectors'
import type { SectorConfig } from '@/lib/blueprint/sectors'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const SECTOR_LIST = Object.values(SECTORS)

// ── Task card inside a sector ─────────────────────────────────────────────────
function TaskCard({ task, index }: { task: SectorConfig['tasks'][number]; index: number }) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all duration-150">
      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] text-zinc-500 font-bold">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="font-syne font-bold text-sm text-zinc-900 dark:text-white leading-snug">{task.label}</p>
          <span className="flex-shrink-0 text-[10px] font-medium text-[#CAFF32] bg-[#CAFF32]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
            {task.roi_estimate}
          </span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{task.roi_detail}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {task.task_category}
          </span>
          {task.use_cases.slice(0, 3).map((uc, i) => (
            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 border border-zinc-100 dark:border-zinc-700/60">
              {uc}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sector detail panel ───────────────────────────────────────────────────────
function SectorPanel({ sector }: { sector: SectorConfig }) {
  const t = useTranslations('dashboard.blueprint')

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Panel header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-syne font-black text-2xl text-zinc-900 dark:text-white tracking-tight mb-2">
              {sector.label}
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
              {sector.description}
            </p>
          </div>
          <Link
            href={`/dashboard/blueprint/${sector.slug}`}
            className="flex-shrink-0 flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#d4ff50] transition-colors whitespace-nowrap"
          >
            {t('viewFullGuide')}
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5">
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">{t('tasks')}</p>
            <p className="font-syne font-bold text-lg text-zinc-900 dark:text-white">{sector.tasks.length}</p>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">{t('useCases')}</p>
            <p className="font-syne font-bold text-lg text-zinc-900 dark:text-white">
              {sector.tasks.reduce((acc: number, t2: SectorConfig['tasks'][number]) => acc + t2.use_cases.length, 0)}
            </p>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-0.5">{t('sector')}</p>
            <p className="font-syne font-bold text-sm text-zinc-900 dark:text-white">{sector.label}</p>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 px-8 py-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">{t('dailyTasks')}</p>
        <div className="flex flex-col gap-3">
          {sector.tasks.map((task: SectorConfig['tasks'][number], i: number) => (
            <TaskCard key={i} task={task} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Empty state for panel ─────────────────────────────────────────────────────
function EmptyPanel() {
  const t = useTranslations('dashboard.blueprint')

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <span className="text-xl">◉</span>
      </div>
      <div>
        <p className="font-syne font-bold text-zinc-900 dark:text-white mb-1">{t('emptyState.title')}</p>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          {t('emptyState.description')}
        </p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BlueprintPage() {
  const t = useTranslations('dashboard.blueprint')
  const [selected, setSelected] = useState<string | null>(null)
  const [lastViewed, setLastViewed] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('blueprint_last_sector')
    if (stored && SECTORS[stored as keyof typeof SECTORS]) {
      setLastViewed(stored)
      setSelected(stored)
    }
    document.title = `${t('title')} | Raspquery`
  }, [t])

  const activeSector = selected ? SECTORS[selected as keyof typeof SECTORS] : null

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60">

        {/* Sidebar header */}
        <div className="px-5 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h1 className="font-syne font-black text-lg text-zinc-900 dark:text-white tracking-tight">
            {t('title')}
          </h1>
        </div>

        {/* Sector list */}
        <div className="flex-1 overflow-y-auto py-3 scrollbar-hide">
          {SECTOR_LIST.map((sector) => {
            const isActive = selected === sector.slug
            const isLast = lastViewed === sector.slug && !isActive

            return (
              <button
                key={sector.slug}
                onClick={() => {
                  setSelected(sector.slug)
                  localStorage.setItem('blueprint_last_sector', sector.slug)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 relative',
                  isActive
                    ? 'bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#CAFF32] rounded-r-full" />
                )}

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isActive ? 'text-zinc-900 dark:text-white' : '')}>
                    {sector.label}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{sector.tasks.length} {t('tasks').toLowerCase()}</p>
                </div>

                {isLast && (
                  <span className="text-[9px] text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {t('recentLabel')}
                  </span>
                )}

                {isActive && (
                  <span className="text-zinc-400 text-xs flex-shrink-0">→</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            {SECTOR_LIST.length} {t('sector').toLowerCase()}s · {SECTOR_LIST.reduce((acc, s) => acc + s.tasks.length, 0)} {t('tasks').toLowerCase()}
          </p>
        </div>
      </div>

      {/* ── RIGHT CONTENT PANEL ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {activeSector ? (
          <SectorPanel sector={activeSector} />
        ) : (
          <EmptyPanel />
        )}
      </div>
    </div>
  )
}
