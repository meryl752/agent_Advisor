import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ROIPage() {
  const { getToken } = await auth()
  let user = null
  try { user = await currentUser() } catch { redirect('/sign-in') }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const userEmail = user.emailAddresses[0]?.emailAddress
  const stacks = await getUserStacks(user.id, clerkToken, userEmail)

  const totalROI = stacks.reduce((sum, s) => sum + s.roi_estimate, 0)
  const totalCost = stacks.reduce((sum, s) => sum + s.total_cost, 0)
  const avgScore = stacks.length > 0
    ? Math.round(stacks.reduce((sum, s) => sum + s.score, 0) / stacks.length)
    : 0

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">ROI Tracker</h1>
        <p className="text-zinc-500 text-sm">Suivi du retour sur investissement de tes stacks IA.</p>
      </div>

      {stacks.length === 0 ? (
        <div className="border border-dashed border-zinc-800 p-16 text-center">
          <p className="font-syne font-black text-white text-2xl mb-3">Aucune donnée disponible</p>
          <p className="text-zinc-500 text-sm mb-8">Génère ton premier stack pour commencer à tracker ton ROI.</p>
          <Link href="/dashboard/recommend" className="inline-block bg-[#CAFF32] text-zinc-900 font-bold px-8 py-3 text-sm">
            Créer un stack →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'ROI moyen estimé', value: `+${Math.round(totalROI / stacks.length)}%`, color: 'text-[#CAFF32]' },
            { label: 'Coût total mensuel', value: `${totalCost}€`, color: 'text-white' },
            { label: 'Score moyen', value: `${avgScore}/100`, color: 'text-[#38bdf8]' },
          ].map((m, i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6">
              <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-3">{m.label}</p>
              <p className={`font-syne font-black text-3xl ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-zinc-900/30 border border-zinc-800/50 border-dashed p-8 text-center">
        <p className="font-dm-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-2">Fonctionnalité Pro</p>
        <p className="text-zinc-400 text-sm">Graphiques de progression, comparaison avant/après IA, et projections sur 12 mois disponibles avec le plan Pro.</p>
      </div>
    </div>
  )
}
