'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  easy: { label: 'Facile', color: 'text-accent border-accent/20' },
  medium: { label: 'Moyen', color: 'text-accent-2 border-accent-2/20' },
  hard: { label: 'Avancé', color: 'text-red-400 border-red-400/20' },
}

const CATEGORY_COLORS: Record<string, string> = {
  copywriting: 'bg-purple-500/10 text-purple-300',
  image: 'bg-pink-500/10 text-pink-300',
  automation: 'bg-blue-500/10 text-blue-300',
  analytics: 'bg-yellow-500/10 text-yellow-300',
  customer_service: 'bg-green-500/10 text-green-300',
  seo: 'bg-orange-500/10 text-orange-300',
  prospecting: 'bg-red-500/10 text-red-300',
  coding: 'bg-cyan-500/10 text-cyan-300',
  research: 'bg-indigo-500/10 text-indigo-300',
  video: 'bg-rose-500/10 text-rose-300',
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-none mb-3',
        // Aceternity Liquid Glass base
        'bg-white/[0.02] backdrop-blur-xl border border-white/[0.05]',
        'shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]',
        'hover:bg-white/[0.04] hover:shadow-[0_8px_32px_0_rgba(200,241,53,0.05)] transition-all duration-500',
        expanded && 'bg-white/[0.05] border-white/[0.1]'
      )}
    >
      {/* Liquid Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Glossy Top Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Animated Gradient Border (Aceternity Style) */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent transition-all duration-500 ease-in-out',
        expanded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-100'
      )} />

      <div className="p-5 flex items-start gap-4 relative z-10">
        {/* Rank */}
        <div className="font-syne font-extrabold text-[2.5rem] leading-none text-white/5
                        flex-shrink-0 w-8 select-none">
          {rank}
        </div>

        {/* Logo */}
        <div className="w-11 h-11 bg-black/40 border border-white/10 flex items-center
                        justify-center overflow-hidden flex-shrink-0 rounded-lg backdrop-blur-md shadow-inner">
          {website_domain && !imgError ? (
            <img
              src={`https://img.logo.dev/${website_domain}?token=pk_aJ8Bl7ROS6-FE3fLWji9tQ`}
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
              <h3 className="font-syne font-bold text-cream text-base drop-shadow-sm">{name}</h3>
              <span className={cn(
                'font-dm-mono text-[0.58rem] uppercase px-2 py-[2px] rounded-full border border-white/5',
                CATEGORY_COLORS[category] ?? 'bg-white/5 text-muted'
              )}>
                {category}
              </span>
            </div>
            <span className="font-syne font-bold text-sm text-accent flex-shrink-0 bg-accent/10 px-2 py-1 rounded-full border border-accent/20">
              {price_from === 0 ? 'Gratuit' : `${price_from}€/m`}
            </span>
          </div>

          <p className="font-dm-mono text-[0.68rem] text-accent/80 mb-2 leading-relaxed">
            {role}
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-[2px] bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-accent/40 to-accent"
              />
            </div>
            <span className="font-dm-mono text-[0.6rem] text-muted-2">{score}/100</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {diff && (
              <span className={cn('font-dm-mono text-[0.58rem] uppercase border rounded-full px-2 py-[2px] bg-black/20', diff.color)}>
                {diff.label}
              </span>
            )}
            {time_to_value && (
              <span className="font-dm-mono text-[0.58rem] text-muted-2 bg-black/20 px-2 py-[2px] rounded-full border border-white/5">
                ⏱ {time_to_value}
              </span>
            )}
            <span className="font-dm-mono text-[0.58rem] text-muted ml-auto group-hover:text-accent transition-colors">
              {expanded ? '↑ Réduire' : '↓ Voir détail'}
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 ml-[84px] flex flex-col gap-3 border-t border-white/5 mt-2 relative z-10">
              <div className="pt-3">
                <p className="font-dm-mono text-[0.6rem] text-muted uppercase mb-2">
                  Pourquoi cet outil pour ton projet
                </p>
                <p className="font-dm-sans text-sm text-muted-2 font-light leading-relaxed">
                  {reason}
                </p>
              </div>

              {concrete_result && (
                <div className="border-l-2 border-accent/50 pl-4 py-2 bg-gradient-to-r from-accent/10 to-transparent rounded-r-lg">
                  <p className="font-dm-mono text-[0.6rem] text-accent uppercase mb-1 drop-shadow-sm">
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
                             text-accent/60 hover:text-accent transition-colors w-fit mt-1"
                >
                  Visiter {website_domain} ↗
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}