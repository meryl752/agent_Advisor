'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AgentCardProps {
  rank: number
  name: string
  category: string
  price_from: number
  role: string
  reason: string
  concrete_result?: string
  website_domain?: string
  setup_difficulty?: string
  time_to_value?: string
  score: number
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Facile',  color: 'text-accent border-accent/30' },
  medium: { label: 'Moyen',   color: 'text-accent-2 border-accent-2/30' },
  hard:   { label: 'Avancé',  color: 'text-red-400 border-red-400/30' },
}

const CATEGORY_COLORS: Record<string, string> = {
  copywriting:      'bg-purple-500/10 text-purple-300',
  image:            'bg-pink-500/10 text-pink-300',
  automation:       'bg-blue-500/10 text-blue-300',
  analytics:        'bg-yellow-500/10 text-yellow-300',
  customer_service: 'bg-green-500/10 text-green-300',
  seo:              'bg-orange-500/10 text-orange-300',
  prospecting:      'bg-red-500/10 text-red-300',
  coding:           'bg-cyan-500/10 text-cyan-300',
  research:         'bg-indigo-500/10 text-indigo-300',
  video:            'bg-rose-500/10 text-rose-300',
}

export default function AgentCard({
  rank, name, category, price_from, role, reason,
  concrete_result, website_domain, setup_difficulty,
  time_to_value, score,
}: AgentCardProps) {
  const [imgError, setImgError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const diff = DIFFICULTY_CONFIG[(setup_difficulty ?? 'easy') as keyof typeof DIFFICULTY_CONFIG]

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'group relative bg-bg border border-border cursor-pointer',
        'hover:border-accent/30 transition-all duration-300',
        expanded && 'border-accent/40 bg-bg-2'
      )}
    >
      {/* Accent top line on hover */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px] bg-accent transition-all duration-300',
        expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
      )} />

      <div className="p-5 flex items-start gap-4">
        {/* Rank */}
        <div className="font-syne font-extrabold text-[2.5rem] leading-none text-border-2
                        flex-shrink-0 w-8 select-none">
          {rank}
        </div>

        {/* Logo */}
        <div className="w-11 h-11 bg-bg-3 border border-border flex items-center
                        justify-center overflow-hidden flex-shrink-0 rounded-sm">
          {website_domain && !imgError ? (
            <img
              src={`https://logo.clearbit.com/${website_domain}`}
              alt={name}
              className="w-7 h-7 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-syne font-extrabold text-accent text-lg">
              {name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-syne font-bold text-cream text-base">{name}</h3>
              <span className={cn(
                'font-dm-mono text-[0.58rem] uppercase tracking-[0.08em] px-2 py-[2px] rounded-sm',
                CATEGORY_COLORS[category] ?? 'bg-bg-3 text-muted'
              )}>
                {category}
              </span>
            </div>
            <span className="font-syne font-bold text-sm text-accent flex-shrink-0">
              {price_from === 0 ? 'Gratuit' : `${price_from}€/mois`}
            </span>
          </div>

          {/* Role */}
          <p className="font-dm-mono text-[0.68rem] text-accent/80 mb-2 leading-relaxed">
            {role}
          </p>

          {/* Score bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-[2px] bg-border-2">
              <div
                className="h-full bg-accent/60 transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="font-dm-mono text-[0.6rem] text-muted">{score}/100</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {diff && (
              <span className={cn('font-dm-mono text-[0.58rem] uppercase tracking-[0.08em] border px-2 py-[2px]', diff.color)}>
                {diff.label}
              </span>
            )}
            {time_to_value && (
              <span className="font-dm-mono text-[0.58rem] text-muted tracking-[0.06em]">
                ⏱ {time_to_value}
              </span>
            )}
            <span className="font-dm-mono text-[0.58rem] text-muted ml-auto">
              {expanded ? '↑ Réduire' : '↓ Voir détail'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 ml-[84px] flex flex-col gap-3 border-t border-border mt-2">
          <div className="pt-3">
            <p className="font-dm-mono text-[0.6rem] text-muted uppercase tracking-[0.08em] mb-2">
              Pourquoi cet outil pour ton projet
            </p>
            <p className="font-dm-sans text-sm text-muted-2 font-light leading-relaxed">
              {reason}
            </p>
          </div>

          {concrete_result && (
            <div className="border-l-2 border-accent/50 pl-4 py-1 bg-accent/5">
              <p className="font-dm-mono text-[0.6rem] text-accent uppercase tracking-[0.08em] mb-1">
                ✦ Résultat concret
              </p>
              <p className="font-dm-sans text-sm text-cream font-light leading-relaxed">
                {concrete_result}
              </p>
            </div>
          )}

          {website_domain && (
            <a
              href={`https://${website_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 font-dm-mono text-[0.65rem]
                         text-accent/60 hover:text-accent transition-colors w-fit"
            >
              Visiter {website_domain} ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}