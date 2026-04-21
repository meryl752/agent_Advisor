import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks, getTopAgents } from '@/lib/supabase/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseService } from '@/lib/supabase/server'
import OnboardingBanner from '@/app/components/dashboard/OnboardingBanner'
import { MetricCard } from '@/app/components/dashboard/MetricCard'
import { StackUpdatesFeed } from '@/app/components/dashboard/StackUpdatesFeed'
import { TrendingAgents } from '@/app/components/dashboard/TrendingAgents'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const { getToken } = await auth()
  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    console.error('Clerk currentUser() failed:', err instanceof Error ? err.message : 'Unknown')
    redirect('/sign-in')
  }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const firstName = user.firstName ?? 'toi'
  const userEmail = user.emailAddresses[0]?.emailAddress

  const [stacks, topAgents] = await Promise.all([
    getUserStacks(user.id, clerkToken, userEmail),
    getTopAgents(8),
  ])

  let onboardingCompleted = true
  try {
    const { data } = await (supabaseService as any)
      .from('users')
      .select('onboarding_completed')
      .eq('clerk_id', user.id)
      .single()
    onboardingCompleted = data?.onboarding_completed ?? true
  } catch { /* fail open */ }

  const stackCount = stacks.length
  const totalMonthlyCost = stacks.reduce((sum, s) => sum + (s.total_cost ?? 0), 0)
  const avgRoi = stackCount > 0
    ? Math.round(stacks.reduce((sum, s) => sum + (s.roi_estimate ?? 0), 0) / stackCount)
    : null
  const avgScore = stackCount > 0
    ? Math.round(stacks.reduce((sum, s) => sum + (s.score ?? 0), 0) / stackCount)
    : null

  const latestStack = stacks[0] ?? null

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <OnboardingBanner show={!onboardingCompleted} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-1">
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-sm text-zinc-500">
          {stackCount > 0
            ? `Tu as ${stackCount} stack${stackCount > 1 ? 's' : ''} actif${stackCount > 1 ? 's' : ''}.`
            : 'Aucun stack configuré pour le moment.'}
        </p>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {stackCount === 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-between gap-6">
          <div>
            <p className="font-medium text-zinc-900 dark:text-white mb-1">Crée ton premier stack</p>
            <p className="text-sm text-zinc-500 max-w-sm">
              Décris ton objectif métier et on génère un stack d'agents IA sur-mesure.
            </p>
          </div>
          <Link href="/dashboard/recommend"
            className="flex-shrink-0 bg-[#CAFF32] text-zinc-900 font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#d4ff50] transition-colors">
            Construire →
          </Link>
        </div>
      )}

      {/* ── Metrics ─────────────────────────────────────────────────────────── */}
      {stackCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Stacks" value={String(stackCount)} />
          <MetricCard label="Coût mensuel" value={`${totalMonthlyCost}€`} />
          <MetricCard
            label="ROI moyen estimé"
            value={avgRoi !== null ? `${avgRoi}%` : '—'}
            accent
            tooltip="Le ROI estime le gain financier par rapport au coût mensuel de tes stacks."
          />
          <MetricCard
            label="Score moyen"
            value={avgScore !== null ? `${avgScore}/100` : '—'}
            tooltip="Évalue la qualité globale de tes stacks : fiabilité, popularité et adéquation avec tes besoins."
          />
        </div>
      )}

      {/* ── Stack Updates + Latest stack ────────────────────────────────────── */}
      {stackCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Latest stack */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Dernier stack</p>
            {latestStack ? (
              <Link href={`/dashboard/stack/${latestStack.id}`} className="flex flex-col gap-2 group flex-1">
                <p className="font-semibold text-zinc-900 dark:text-white group-hover:text-[#CAFF32] transition-colors">
                  {latestStack.name}
                </p>
                <p className="text-sm text-zinc-500 line-clamp-2">{latestStack.objective}</p>
                <div className="flex gap-4 mt-auto pt-3 text-sm border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400">Coût <span className="text-zinc-900 dark:text-white font-medium">{latestStack.total_cost}€/mois</span></span>
                  <span className="text-zinc-400">ROI <span className="text-[#CAFF32] font-medium">{latestStack.roi_estimate}%</span></span>
                  <span className="text-zinc-400">Score <span className="text-zinc-900 dark:text-white font-medium">{latestStack.score}/100</span></span>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-500">Aucun stack.</p>
            )}
          </div>

          {/* Stack Updates Feed */}
          <StackUpdatesFeed stack={latestStack} />
        </div>
      )}

      {/* ── All stacks list ──────────────────────────────────────────────────── */}
      {stackCount > 1 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-4">Tous tes stacks</p>
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {stacks.map((s, i) => (
              <Link key={i} href={`/dashboard/stack/${s.id}`}
                className="flex items-center justify-between py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 -mx-2 px-2 rounded-lg transition-colors group">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-[#CAFF32] transition-colors">{s.name}</p>
                  <p className="text-xs text-zinc-500 line-clamp-1">{s.objective}</p>
                </div>
                <div className="flex gap-4 text-xs text-zinc-400 flex-shrink-0 ml-4 items-center">
                  <span>{s.total_cost}€/mois</span>
                  <span className="text-[#CAFF32]">ROI {s.roi_estimate}%</span>
                  <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Trending Agents ──────────────────────────────────────────────────── */}
      <TrendingAgents agents={topAgents} />
    </div>
  )
}
