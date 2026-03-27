'use client'

/**
 * Skeleton — composant de chargement shimmer pour le dashboard.
 * Utilisé pendant le chargement des recommandations IA.
 */

interface SkeletonProps {
  className?: string
}

// ─── Bloc de base ─────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`shimmer ${className}`} />
}

// ─── Skeleton d'une AgentCard ─────────────────────────────────────────────────
export function SkeletonAgentCard() {
  return (
    <div className="border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Logo placeholder */}
        <Skeleton className="w-12 h-12 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-1">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        {/* Badge placeholder */}
        <Skeleton className="h-5 w-14 flex-shrink-0" />
      </div>

      {/* Description lines */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>

      {/* Score bar */}
      <div className="pt-1 flex flex-col gap-2">
        <div className="flex justify-between">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full" />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-24" />
      </div>
    </div>
  )
}

// ─── Skeleton du StackSummary ─────────────────────────────────────────────────
export function SkeletonSummary() {
  return (
    <div className="border-2 border-zinc-800 bg-zinc-950 overflow-hidden mb-6">
      <div className="p-6 flex flex-col gap-4">
        {/* Label */}
        <Skeleton className="h-3 w-32" />
        {/* Title */}
        <Skeleton className="h-8 w-3/4" />
        {/* Subtitle lines */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-[1px] bg-zinc-800 mt-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900 px-5 py-4 flex flex-col gap-2">
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="h-7 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton de la colonne droite (flow & filters) ───────────────────────────
export function SkeletonRightColumn() {
  return (
    <div className="flex flex-col gap-4">
      {/* StackFlow skeleton */}
      <div className="border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-col gap-2 mt-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-2.5 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter panel skeleton */}
      <div className="border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-4">
        <Skeleton className="h-3 w-28" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-20" />
            <div className="flex gap-2">
              {[0, 1, 2].map(j => (
                <Skeleton key={j} className="h-7 w-16" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
