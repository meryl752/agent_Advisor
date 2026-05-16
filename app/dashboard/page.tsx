import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks, getStackUpdateEvents } from '@/lib/supabase/queries'
import { Link } from '@/lib/i18n/navigation'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseService } from '@/lib/supabase/server'
import OnboardingBanner from '@/app/components/dashboard/OnboardingBanner'
import { MetricCard } from '@/app/components/dashboard/MetricCard'
import { StackUpdatesFeed } from '@/app/components/dashboard/StackUpdatesFeed'
import { StackHealthPanel } from '@/app/components/dashboard/StackHealthPanel'
import { getNextDigestDate, formatDigestDate } from '@/lib/utils/next-digest'
import { overviewCardClass, overviewCardHoverClass } from '@/lib/ui/overview-card'
import { enrichStackWithLiveMetrics } from '@/lib/stacks/stackMetrics'
import { computeStackScore, parseScoreBreakdown, type StackScoreResult } from '@/lib/stacks/stackScore'
import type { AppLocale } from '@/lib/i18n/locale'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard',
    description: 'Manage your AI agent stacks and track performance',
  }
}

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
  const userEmail = user.emailAddresses[0]?.emailAddress

  const [{ stacks, connectionFailed }] = await Promise.all([
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
  const totalAllStacksCost = stacks.reduce((sum, s) => sum + (s.total_cost ?? 0), 0)

  const latestStack = stacks[0] ?? null
  const trackedStack = stacks.find((s) => s.digest_enabled) ?? null
  const focusStack = trackedStack ?? latestStack

  const stackIds = stacks.map((s) => s.id).filter(Boolean)
  let stackSessionMap: Record<string, string> = {}
  let stackLocaleMap: Record<string, AppLocale> = {}
  if (stackIds.length > 0) {
    const { data: convData } = await (supabaseService as any)
      .from('conversations')
      .select('stack_id, session_id, locale')
      .in('stack_id', stackIds)
    if (convData) {
      stackSessionMap = Object.fromEntries(
        convData.map((c: { stack_id: string; session_id: string }) => [c.stack_id, c.session_id])
      )
      stackLocaleMap = Object.fromEntries(
        convData.map((c: { stack_id: string; locale?: string }) => [
          c.stack_id,
          c.locale === 'fr' ? 'fr' : 'en',
        ])
      )
    }
  }

  let focusLocale: AppLocale =
    focusStack?.id && stackLocaleMap[focusStack.id] ? stackLocaleMap[focusStack.id] : 'en'
  let focusCost = 0
  let focusRoi: number | null = null
  let focusScoreResult: StackScoreResult | null = null

  if (focusStack) {
    const enriched = await enrichStackWithLiveMetrics(focusStack)
    focusCost = enriched.total_cost
    focusRoi = enriched.roi_estimate
    const storedBreakdown = parseScoreBreakdown(focusStack.score_breakdown)
    focusScoreResult =
      storedBreakdown ??
      computeStackScore(
        { ...focusStack, total_cost: enriched.total_cost, roi_estimate: enriched.roi_estimate },
        enriched.agents,
        focusLocale
      )
  }

  const focusLabel = trackedStack ? 'Tracked stack' : 'Latest stack'

  const anchorStackRaw = trackedStack ?? latestStack
  const anchorStackMinimal =
    anchorStackRaw?.id
      ? { id: anchorStackRaw.id, name: anchorStackRaw.name?.trim() || 'Stack' }
      : null

  const trackedStackSummary = trackedStack
    ? {
        id: trackedStack.id,
        name: trackedStack.name?.trim() || 'Stack',
        digest_enabled_at:
          (trackedStack as { digest_enabled_at?: string | null }).digest_enabled_at ?? null,
      }
    : null
  const nextDigestAt = trackedStackSummary
    ? getNextDigestDate(
        trackedStackSummary.digest_enabled_at ?? null
      )
    : null
  const nextDigestLabel = nextDigestAt ? formatDigestDate(nextDigestAt) : null

  let trackedUpdates: Awaited<ReturnType<typeof getStackUpdateEvents>> = []
  if (trackedStackSummary) {
    trackedUpdates = await getStackUpdateEvents(trackedStackSummary.id, user.id, userEmail, 30)
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

      {connectionFailed && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-semibold mb-1">Cannot reach Supabase</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Stacks could not be loaded (network, DNS, firewall, VPN, or paused Supabase project). Check{' '}
            <code className="rounded bg-black/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-black/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
            <code className="rounded bg-black/10 px-1">.env.local</code>, then reload the page.
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-syne font-black text-3xl text-zinc-900 dark:text-white tracking-tight">
            Overview
          </h1>
        </div>
        {stackCount > 0 && (
          <Link href="/dashboard/recommend"
            className="flex items-center gap-2 bg-[#CAFF32] text-zinc-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#d4ff50] transition-colors">
            <span>New Stack</span>
          </Link>
        )}
      </div>

      {/* ── Empty state ── */}
      {stackCount === 0 && (
        <div className={`${overviewCardClass} overflow-hidden`}>
          <div className="h-1 w-full bg-gradient-to-r from-[#CAFF32]/0 via-[#CAFF32] to-[#CAFF32]/0" />
          <div className="px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="font-syne font-black text-zinc-900 dark:text-white text-base mb-0.5">
                No stacks yet
              </p>
              <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                Create your first AI agent stack to get started
              </p>
            </div>
            <Link href="/dashboard/recommend"
              className="flex-shrink-0 bg-[#CAFF32] text-zinc-900 font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#d4ff50] transition-colors">
              Create Stack
            </Link>
          </div>
        </div>
      )}

      {/* ── Metrics (focus stack) ── */}
      {stackCount > 0 && focusStack && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard polished label={`Stacks (${stackCount})`} value={String(stackCount)} />
          <MetricCard
            polished
            label={`Cost · ${focusLabel}`}
            value={`${focusCost}€`}
            tooltip={
              stackCount > 1
                ? `Live catalog estimate for your ${focusLabel.toLowerCase()}. All stacks combined: ${totalAllStacksCost}€/mo`
                : 'Monthly estimate from current tool prices in our catalog'
            }
          />
          <MetricCard
            polished
            label={`ROI · ${focusLabel}`}
            value={focusRoi !== null ? `+${focusRoi}%` : '—'}
            accent
            tooltip="Average ROI score of tools in this stack (catalog data)"
          />
          <MetricCard
            polished
            label="Health score"
            value={focusScoreResult ? `${focusScoreResult.overall}/100` : '—'}
            tooltip="Stack effectiveness: fit, coverage, synergy, and budget"
          />
        </div>
      )}

      {stackCount > 0 && focusStack && focusScoreResult && (
        <StackHealthPanel
          stackName={focusStack.name?.trim() || 'Stack'}
          score={focusScoreResult}
          locale={focusLocale}
          tracked={Boolean(trackedStack)}
        />
      )}

      {/* ── Latest stack + Updates ── */}
      {stackCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Latest stack */}
          <div className={`${overviewCardClass} ${overviewCardHoverClass} p-6 flex flex-col gap-5`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Latest Stack</p>
              {latestStack && (
                <Link href={stackSessionMap[latestStack.id] ? `/dashboard/recommend/${stackSessionMap[latestStack.id]}` : '/dashboard/stack'}
                  className="text-[10px] text-zinc-400 hover:text-[#CAFF32] transition-colors">
                  View
                </Link>
              )}
            </div>
            {latestStack ? (
              <Link href={stackSessionMap[latestStack.id] ? `/dashboard/recommend/${stackSessionMap[latestStack.id]}` : '/dashboard/stack'} className="flex flex-col gap-3 group flex-1">
                <p className="font-syne font-bold text-zinc-900 dark:text-white group-hover:text-[#CAFF32] transition-colors text-base">
                  {latestStack.name}
                </p>
                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{latestStack.objective}</p>
                <div className="grid grid-cols-3 gap-3 mt-auto pt-4 border-t border-zinc-100/60 dark:border-zinc-800">
                  {[
                    { label: 'Cost', value: `${focusCost}€/mo`, color: 'text-zinc-900 dark:text-white' },
                    { label: 'ROI', value: focusRoi !== null ? `+${focusRoi}%` : '—', color: 'text-[#CAFF32]' },
                    { label: 'Score', value: focusScoreResult ? `${focusScoreResult.overall}/100` : `${latestStack.score}/100`, color: 'text-zinc-900 dark:text-white' },
                  ].map((m, i) => (
                    <div key={i}>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-zinc-500">No stacks yet</p>
            )}
          </div>

          {/* Stack Updates — aligné sur le stack « suivi » (digest), pas seulement le dernier créé */}
          <StackUpdatesFeed
            polished
            stackCount={stackCount}
            anchorStack={anchorStackMinimal}
            trackedStack={trackedStackSummary}
            nextDigestLabel={nextDigestLabel}
            initialUpdates={trackedUpdates}
          />
        </div>
      )}


      {/* ── Trending Agents ── */}
    </div>
  )
}
