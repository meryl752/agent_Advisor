import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks, getTopAgents } from '@/lib/supabase/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseService } from '@/lib/supabase/server'
import OnboardingBanner from '@/app/components/dashboard/OnboardingBanner'

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
    getTopAgents(5),
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

  // ── Compute real metrics from stacks ──────────────────────────────────────
  const stackCount = stacks.length
  const totalMonthlyCost = stacks.reduce((sum, s) => sum + (s.total_cost ?? 0), 0)
  const avgRoi = stackCount > 0
    ? Math.round(stacks.reduce((sum, s) => sum + (s.roi_estimate ?? 0), 0) / stackCount)
    : null
  const avgScore = stackCount > 0
    ? Math.round(stacks.reduce((sum, s) => sum + (s.score ?? 0), 0) / stackCount)
    : null

  // Most recent stack
  const latestStack = stacks[0] ?? null

  // Top agents from DB (real scores)
  const stackItems = topAgents.map(a => ({
    name: a.name,
    score: a.score,
    category: a.category,
  }))

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto">
      <OnboardingBanner show={!onboardingCompleted} />

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-1">
          Bonjour, {firstName}
        </h1>
        <p className="text-sm text-zinc-500">
          {stackCount > 0
            ? `Tu as ${stackCount} stack${stackCount > 1 ? 's' : ''} actif${stackCount > 1 ? 's' : ''}.`
            : 'Aucun stack configuré pour le moment.'}
        </p>
      </div>

      {/* Empty state */}
      {stackCount === 0 && (
        <div className="mb-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 flex items-center justify-between gap-6">
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

      {/* Metrics */}
      {stackCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Stacks" value={String(stackCount)} />
          <MetricCard label="Coût mensuel" value={`${totalMonthlyCost}€`} />
          <MetricCard label="ROI moyen estimé" value={avgRoi !== null ? `${avgRoi}%` : '—'} accent />
          <MetricCard label="Score moyen" value={avgScore !== null ? `${avgScore}/100` : '—'} />
        </div>
      )}

      {/* Latest stack + top agents */}
      {stackCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Latest stack */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Dernier stack</p>
            {latestStack ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-zinc-900 dark:text-white">{latestStack.name}</p>
                <p className="text-sm text-zinc-500 line-clamp-2">{latestStack.objective}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-zinc-400">Coût <span className="text-zinc-900 dark:text-white font-medium">{latestStack.total_cost}€/mois</span></span>
                  <span className="text-zinc-400">ROI <span className="text-[#CAFF32] font-medium">{latestStack.roi_estimate}%</span></span>
                  <span className="text-zinc-400">Score <span className="text-zinc-900 dark:text-white font-medium">{latestStack.score}/100</span></span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Aucun stack.</p>
            )}
          </div>

          {/* Top agents from DB */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Top agents</p>
            <div className="flex flex-col gap-3">
              {stackItems.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#CAFF32]">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All stacks list */}
      {stackCount > 1 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Tous tes stacks</p>
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {stacks.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-zinc-500 line-clamp-1">{s.objective}</p>
                </div>
                <div className="flex gap-4 text-xs text-zinc-400 flex-shrink-0 ml-4">
                  <span>{s.total_cost}€/mois</span>
                  <span className="text-[#CAFF32]">ROI {s.roi_estimate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${accent ? 'text-[#CAFF32]' : 'text-zinc-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  )
}
