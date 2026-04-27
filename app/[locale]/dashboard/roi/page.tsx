export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export default async function ROIPage() {
  const t = await getTranslations('dashboard.roi')
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
        <h1 className="font-syne font-black text-4xl text-zinc-900 dark:text-white tracking-tighter mb-2">{t('title')}</h1>
        <p className="text-zinc-500 text-sm">{t('subtitle')}</p>
      </div>

      {stacks.length === 0 ? (
        <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-16 text-center rounded-xl">
          <p className="font-syne font-black text-zinc-900 dark:text-white text-2xl mb-3">{t('empty')}</p>
          <p className="text-zinc-500 text-sm mb-8">{t('empty')}</p>
          <Link href="/dashboard/recommend" className="inline-block bg-[#CAFF32] text-zinc-900 font-bold px-8 py-3 text-sm rounded-lg">
            Créer un stack →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: t('totalSaved'), value: `+${Math.round(totalROI / stacks.length)}%`, color: 'text-[#CAFF32]' },
            { label: t('perMonth'),   value: `${totalCost}€`,                              color: 'text-zinc-900 dark:text-white' },
            { label: t('perYear'),    value: `${avgScore}/100`,                            color: 'text-[#38bdf8]' },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
              <p className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.2em] mb-3">{m.label}</p>
              <p className={`font-syne font-black text-3xl ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800/50 p-8 text-center rounded-xl">
        <p className="font-dm-mono text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-2">Fonctionnalité Pro</p>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Graphiques de progression, comparaison avant/après IA, et projections sur 12 mois disponibles avec le plan Pro.</p>
      </div>
    </div>
  )
}
