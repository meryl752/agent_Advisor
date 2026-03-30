import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks, getTopAgents } from '@/lib/supabase/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardMetrics from '@/app/components/dashboard/DashboardMetrics'
import EconomyChart from '@/app/components/dashboard/EconomyChart'
import StackList from '@/app/components/dashboard/StackList'
import StackHealthRing from '@/app/components/dashboard/StackHealthRing'

export default async function DashboardPage() {
  const { getToken } = await auth()
  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    // Clerk dev keys have strict rate limits — redirect to sign-in on failure
    console.error('Clerk currentUser() failed:', err instanceof Error ? err.message : 'Unknown')
    redirect('/sign-in')
  }
  if (!user) redirect('/sign-in')


  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const firstName = user.firstName ?? 'toi'
  const userEmail = user.emailAddresses[0]?.emailAddress
  const [stacks, topAgents] = await Promise.all([
    getUserStacks(user.id, clerkToken, userEmail),
    getTopAgents(3),
  ])

  const stackCount = stacks.length
  const stackItems = topAgents.map(a => ({ name: a.name, score: a.score }))

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
            <h1 className="font-syne font-black text-5xl dark:text-white text-zinc-900 tracking-tighter mb-2">
            Bonjour, {firstName}
            </h1>
            <p className="font-dm-sans text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-lg">
            Ton écosystème IA est optimisé. Voici les dernières performances de ton stack.
            </p>
        </div>
      </div>

      {/* Main Feature: Stack Health Ring */}
      <div className="mb-8">
        <StackHealthRing score={stackCount > 0 ? 84 : 0} />
      </div>

      {/* CTA si pas de stack */}
      {stackCount === 0 && (
        <div className="relative mb-8 rounded-none overflow-hidden border border-zinc-200 dark:border-[#CAFF32]/20 dark:bg-zinc-950/40 bg-[var(--bg)] shadow-xl dark:shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-[#CAFF32]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#CAFF32]/[0.03] to-transparent pointer-events-none" />
          <div className="relative p-8 flex items-center justify-between">
            <div className="max-w-md">
              <p className="font-syne font-black dark:text-white text-zinc-900 text-xl mb-2">
                Initier ton premier stack
              </p>
              <p className="font-dm-sans text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                Il semble que tu n'aies pas encore d'agents configurés. Décris ton objectif métier pour générer un stack sur-mesure.
              </p>
            </div>
            <Link href="/dashboard/recommend"
              className="flex-shrink-0 bg-[#CAFF32] text-zinc-900 font-syne font-black text-sm
                         px-8 py-3.5 rounded-none hover:bg-[#d4ff50] transition-all
                         hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(202,255,50,0.3)] ml-6">
              Construire →
            </Link>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <DashboardMetrics stackCount={stackCount} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Chart */}
        <div className="bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl rounded-none p-6 border border-zinc-100 dark:border-white/[0.05] shadow-sm dark:shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="font-dm-mono text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-6 font-bold">
            Économies générées — Projection
          </p>
          <div className="h-28">
            <EconomyChart />
          </div>
        </div>

        {/* Action recommandée */}
        <div className="bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl rounded-none p-6 border border-zinc-100 dark:border-white/[0.05] shadow-sm dark:shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
          
          <p className="font-dm-mono text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-4 font-bold">
            Suggestion Optimisation
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#FF6B35] shadow-[0_0_8px_#FF6B35]" />
            <p className="font-syne font-black dark:text-white text-zinc-900 text-lg uppercase tracking-tight">
              Jasper → Claude
            </p>
          </div>
          <p className="font-dm-sans text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
            Optimisation identifiée : Migration de Jasper vers Claude pour ton copywriting. 
            Économie estimée : <span className="text-[#CAFF32] font-black">46€ / mois</span>.
          </p>
          <Link href="/dashboard/recommend"
            className="inline-flex items-center gap-2 font-dm-mono text-[10px] uppercase font-black text-[#CAFF32]
                       hover:gap-3 transition-all border border-[#CAFF32]/30 px-3 py-1.5 rounded-sm bg-[#CAFF32]/5">
            Analyser l'impact →
          </Link>
        </div>
      </div>

      {/* Stack + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Stack actuel */}
        <div className="bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl rounded-none p-6 border border-zinc-100 dark:border-white/[0.05] shadow-sm dark:shadow-2xl relative overflow-hidden group flex flex-col">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="font-dm-mono text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-6 font-bold">
            Ton Infrastructure IA
          </p>
          <StackList items={stackItems} />
        </div>

        {/* Alerts */}
        <div className="bg-[var(--bg)] dark:bg-zinc-900/50 backdrop-blur-xl rounded-none p-6 border border-zinc-100 dark:border-white/[0.05] shadow-sm dark:shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="font-dm-mono text-[9px] text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-6 font-bold">
            Stack alerts — Temps réel
          </p>
          <div className="flex flex-col gap-3">
            {[
              { type: 'success', text: 'GPT-4o a baissé ses prix de 50%', time: '2 min', color: '#CAFF32', icon: '✦' },
              { type: 'warning', text: 'Jasper remplaçable par Claude Sonnet', time: '1h', color: '#FF6B35', icon: '⚠' },
              { type: 'info', text: 'Nouveau: Perplexity Pages disponible', time: '9h', color: '#38bdf8', icon: '◎' },
            ].map((alert, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-none bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all group/alert">
                <div className="w-8 h-8 flex items-center justify-center font-bold text-xs rounded-sm border"
                  style={{ color: alert.color, borderColor: `${alert.color}30`, backgroundColor: `${alert.color}05` }}>
                  {alert.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs dark:text-zinc-300 text-zinc-800 leading-snug font-medium mb-1 line-clamp-1">{alert.text}</p>
                  <p className="font-dm-mono text-[9px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest font-bold">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}