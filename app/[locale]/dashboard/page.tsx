import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { Link } from '@/lib/i18n/navigation'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseService } from '@/lib/supabase/server'
import OnboardingBanner from '@/app/components/dashboard/OnboardingBanner'
import { MetricCard } from '@/app/components/dashboard/MetricCard'
import { StackUpdatesFeed } from '@/app/components/dashboard/StackUpdatesFeed'
import { getTranslations } from 'next-intl/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })
  return {
    title: t('dashboard.title'),
    description: t('dashboard.description'),
  }
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')

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

  const [stacks] = await Promise.all([
    getUserStacks(user.id, clerkToken, userEmail),
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
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-syne font-black text-3xl text-zinc-900 dark:text-white tracking-tight">
            {t('greeting', { name: firstName })}
          </h1>
        </div>
        {stackCount > 0 && (
          <Link href="/dashboard/recommend"
            className="flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#d4ff50] transition-colors">
            <span>{t('sidebar.newStack')}</span>
          </Link>
        )}
      </div>

      {/* ── Empty state ── */}
      {stackCount === 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#CAFF32]/0 via-[#CAFF32] to-[#CAFF32]/0" />
          <div className="px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="font-syne font-black text-zinc-900 dark:text-white text-base mb-0.5">
                {t('emptyState.title')}
              </p>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                {t('emptyState.description')}
              </p>
            </div>
            <Link href="/dashboard/recommend"
              className="flex-shrink-0 bg-[#CAFF32] text-zinc-900 font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#d4ff50] transition-colors">
              {t('emptyState.cta')}
            </Link>
          </div>
        </div>
      )}

      {/* ── Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label={t('metrics.activeStacks', { count: stackCount })} value={String(stackCount)} />
        <MetricCard label={t('metrics.monthlyCost')} value={`${totalMonthlyCost}€`} />
        <MetricCard
          label={t('metrics.avgRoi')}
          value={avgRoi !== null ? `+${avgRoi}%` : '—'}
          accent
          tooltip={t('metrics.roiTooltip')}
        />
        <MetricCard
          label={t('metrics.avgScore')}
          value={avgScore !== null ? `${avgScore}/100` : '—'}
          tooltip={t('metrics.scoreTooltip')}
        />
      </div>

      {/* ── Latest stack + Updates ── */}
      {stackCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Latest stack */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 flex flex-col gap-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('latestStack.label')}</p>
              {latestStack && (
                <Link href={`/dashboard/stack/${latestStack.id}`}
                  className="text-[10px] text-zinc-400 hover:text-[#CAFF32] transition-colors">
                  {t('latestStack.viewLink')}
                </Link>
              )}
            </div>
            {latestStack ? (
              <Link href={`/dashboard/stack/${latestStack.id}`} className="flex flex-col gap-3 group flex-1">
                <p className="font-syne font-bold text-zinc-900 dark:text-white group-hover:text-[#CAFF32] transition-colors text-base">
                  {latestStack.name}
                </p>
                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{latestStack.objective}</p>
                <div className="grid grid-cols-3 gap-3 mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  {[
                    { label: t('latestStack.cost'), value: `${latestStack.total_cost}€${t('latestStack.perMonth')}`, color: 'text-zinc-900 dark:text-white' },
                    { label: t('latestStack.roi'), value: `+${latestStack.roi_estimate}%`, color: 'text-[#CAFF32]' },
                    { label: t('latestStack.score'), value: `${latestStack.score}/100`, color: 'text-zinc-900 dark:text-white' },
                  ].map((m, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-500">{t('latestStack.empty')}</p>
            )}
          </div>

          {/* Stack Updates Feed */}
          <StackUpdatesFeed stack={latestStack} />
        </div>
      )}

      {/* ── All stacks ── */}
      {stackCount > 1 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t('allStacks.label')}</p>
            <Link href="/dashboard/stack" className="text-[10px] text-zinc-400 hover:text-[#CAFF32] transition-colors">
              {t('allStacks.manageLink')}
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stacks.map((s, i) => (
              <Link key={i} href={`/dashboard/stack/${s.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#CAFF32]/10 border border-[#CAFF32]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#CAFF32] text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-[#CAFF32] transition-colors truncate">{s.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1">{s.objective}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs flex-shrink-0 ml-4">
                  <span className="text-zinc-400">{s.total_cost}€<span className="text-zinc-600">{t('latestStack.perMonth')}</span></span>
                  <span className="text-[#CAFF32] font-semibold">+{s.roi_estimate}%</span>
                  <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Trending Agents ── */}
    </div>
  )
}
