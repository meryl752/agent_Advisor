'use client'

import { Link } from '@/lib/i18n/navigation'
import { scoreColor, scoreHeadline, type StackScoreResult } from '@/lib/stacks/stackScore'
import type { AppLocale } from '@/lib/i18n/locale'
import { overviewCardClass } from '@/lib/ui/overview-card'

type Props = {
  stackName: string
  score: StackScoreResult
  locale?: AppLocale
  tracked?: boolean
}

export function StackHealthPanel({ stackName, score, locale = 'en', tracked }: Props) {
  const color = scoreColor(score.overall)
  const headline = scoreHeadline(locale, score.overall)

  return (
    <div className={`${overviewCardClass} p-6 flex flex-col gap-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {locale === 'fr' ? 'Score stack' : 'Stack health'}
            {tracked && (
              <span className="ml-2 text-[#CAFF32]">
                · {locale === 'fr' ? 'suivi' : 'tracked'}
              </span>
            )}
          </p>
          <p className="font-syne font-bold text-zinc-900 dark:text-white text-lg mt-1 truncate">
            {stackName}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">{headline}</p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${color} ${score.overall * 3.6}deg, rgba(161,161,170,0.2) 0deg)`,
            }}
          >
            <div className="absolute inset-1.5 rounded-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
              <span className="font-syne font-black text-2xl" style={{ color }}>
                {score.overall}
              </span>
              <span className="text-[9px] text-zinc-400">/100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {score.dimensions.map((d) => (
          <div key={d.id} className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px]">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{d.label}</span>
              <span className="text-zinc-500">{d.score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${d.score}%`, backgroundColor: scoreColor(d.score) }}
              />
            </div>
            <p className="text-[9px] text-zinc-400">{d.hint}</p>
          </div>
        ))}
      </div>

      {score.tips.length > 0 && (
        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 border-t border-zinc-100/60 dark:border-zinc-800 pt-4">
          {score.tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#CAFF32] shrink-0">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/dashboard/stack"
        className="text-xs font-semibold text-[#CAFF32] hover:underline self-start"
      >
        {locale === 'fr' ? 'Gérer le suivi · Mes stacks' : 'Manage tracking · My Stacks'} →
      </Link>
    </div>
  )
}
