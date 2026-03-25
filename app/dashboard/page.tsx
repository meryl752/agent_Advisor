import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks, getTopAgents } from '@/lib/supabase/queries'
import Link from 'next/link'

export default async function DashboardPage() {
  const { getToken } = await auth()
  const user = await currentUser()
  if (!user) return null

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const firstName = user.firstName ?? 'toi'
  const [stacks, topAgents] = await Promise.all([
    getUserStacks(user.id, clerkToken),
    getTopAgents(3),
  ])

  const stackCount = stacks.length
  const stackItems = topAgents.map(a => ({ name: a.name, score: a.score }))

  return (
    <div className="p-8 w-full">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#CAFF32] animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
            Dashboard actif
          </span>
        </div>
        <h1 className="font-black text-4xl text-white tracking-tight mb-1">
          Bonjour, {firstName}{' '}
          <span className="text-[#CAFF32]">✦</span>
        </h1>
        <p className="text-zinc-500 text-sm">
          Voici l'état de ton stack IA ce mois-ci.
        </p>
      </div>

      {/* CTA si pas de stack */}
      {stackCount === 0 && (
        <div className="relative mb-8 rounded-2xl overflow-hidden border border-[#CAFF32]/20">
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(202,255,50,0.05), rgba(107,79,255,0.05))' }} />
          <div className="relative p-6 flex items-center justify-between">
            <div>
              <p className="font-black text-white text-lg mb-1">
                Tu n'as pas encore de stack ✦
              </p>
              <p className="text-zinc-400 text-sm">
                Décris ton objectif — Raspquery construit ton stack optimal en 30 secondes.
              </p>
            </div>
            <Link href="/dashboard/recommend"
              className="flex-shrink-0 bg-[#CAFF32] text-zinc-900 font-black text-sm
                         px-6 py-3 rounded-xl hover:bg-[#d4ff50] transition-all
                         hover:scale-105 hover:shadow-xl ml-6">
              Construire →
            </Link>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'ROI ce mois', value: stackCount > 0 ? '+340€' : '—', sub: '↑ 23% vs mois dernier', color: '#CAFF32' },
          { label: 'Stacks créés', value: String(stackCount), sub: stackCount === 0 ? 'Lance ton premier' : 'Voir mes stacks' },
          { label: 'Stack Score', value: stackCount > 0 ? '84' : '—', sub: '/100', color: '#FF6B35' },
        ].map((m, i) => (
          <div key={i} className="relative bg-zinc-900 rounded-2xl p-5 border border-zinc-800
                                   hover:border-zinc-700 transition-colors overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(202,255,50,0.04), transparent 70%)' }} />
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-2">
              {m.label}
            </p>
            <p className="font-black text-3xl mb-1"
              style={{ color: m.color ?? '#fff' }}>
              {m.value}
            </p>
            <p className="text-xs text-zinc-600">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        {/* Chart */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-4">
            Économies générées — 6 mois
          </p>
          <div className="flex items-end gap-2 h-20">
            {[35, 52, 45, 70, 63, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm relative overflow-hidden"
                style={{ height: `${h}%` }}>
                <div className="absolute inset-0 rounded-t-sm"
                  style={{
                    background: i === 5
                      ? 'linear-gradient(to top, #CAFF32, #7FFF00)'
                      : 'rgba(202,255,50,0.2)',
                  }} />
              </div>
            ))}
          </div>
        </div>

        {/* Action recommandée */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-10"
            style={{ background: 'radial-gradient(circle, #FF6B35, transparent)' }} />
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-3">
            Action recommandée
          </p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
            <p className="font-black text-white text-base">
              Remplace Jasper → Claude
            </p>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            Tu économises <span className="text-[#CAFF32] font-bold">46€/mois</span>.
            Claude fait exactement la même chose pour ton copywriting.
          </p>
          <Link href="/dashboard/recommend"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#CAFF32]
                       hover:gap-3 transition-all">
            Voir le détail →
          </Link>
        </div>
      </div>

      {/* Stack + Alerts */}
      <div className="grid grid-cols-2 gap-4">

        {/* Stack actuel */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-4">
            Ton stack actuel
          </p>
          <div className="flex flex-col gap-2">
            {(stackItems.length > 0 ? stackItems : [
              { name: 'Claude Sonnet', score: 92 },
              { name: 'Make.com', score: 85 },
              { name: 'Perplexity Pro', score: 78 },
            ]).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center
                                text-[10px] font-black text-zinc-400 flex-shrink-0">
                  {item.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-zinc-300 font-medium">{item.name}</span>
                    <span className="text-xs font-black text-[#CAFF32]">{item.score}</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#CAFF32] opacity-60"
                      style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em] mb-4">
            Stack alerts récentes
          </p>
          <div className="flex flex-col gap-2">
            {[
              { type: 'success', text: 'GPT-4o a baissé ses prix de 50%', time: '2 min', color: '#CAFF32' },
              { type: 'warning', text: 'Jasper remplaçable par Claude Sonnet', time: '1h', color: '#FF6B35' },
              { type: 'info', text: 'Nouveau: Perplexity Pages disponible', time: '9h', color: '#38bdf8' },
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: alert.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">{alert.text}</p>
                </div>
                <span className="text-[10px] text-zinc-600 flex-shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}