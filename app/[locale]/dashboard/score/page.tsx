export const dynamic = 'force-dynamic'

import { auth, currentUser } from '@clerk/nextjs/server'
import { getUserStacks } from '@/lib/supabase/queries'
import { redirect } from 'next/navigation'
import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export default async function ScorePage() {
  const t = await getTranslations('dashboard.score')
  const { getToken } = await auth()
  let user = null
  try { user = await currentUser() } catch { redirect('/sign-in') }
  if (!user) redirect('/sign-in')

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const userEmail = user.emailAddresses[0]?.emailAddress
  const stacks = await getUserStacks(user.id, clerkToken, userEmail)

  const avgScore = stacks.length > 0
    ? Math.round(stacks.reduce((sum, s) => sum + s.score, 0) / stacks.length)
    : 0

  const scoreColor = avgScore >= 80 ? '#CAFF32' : avgScore >= 60 ? '#FF6B35' : '#ef4444'

  const CRITERIA = [
    { label: 'Couverture des besoins', score: avgScore > 0 ? Math.min(100, avgScore + 5) : 0, desc: "Les outils couvrent-ils tous tes cas d'usage ?" },
    { label: 'Optimisation budget',    score: avgScore > 0 ? Math.max(0, avgScore - 8) : 0,   desc: 'Rapport qualité/prix de chaque outil.' },
    { label: 'Synergie des outils',    score: avgScore > 0 ? Math.min(100, avgScore + 2) : 0, desc: "Les outils s'intègrent-ils bien entre eux ?" },
    { label: "Facilité d'adoption",    score: avgScore > 0 ? Math.max(0, avgScore - 3) : 0,   desc: "Niveau de complexité d'implémentation." },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
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
        <>
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 mb-6 flex items-center gap-8 rounded-xl">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" className="dark:[stroke:#27272a]" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${avgScore * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-syne font-black text-2xl" style={{ color: scoreColor }}>{avgScore}</span>
              </div>
            </div>
            <div>
              <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2">Score global moyen</p>
              <p className="font-syne font-black text-zinc-900 dark:text-white text-2xl mb-1">
                {avgScore >= 80 ? 'Excellent' : avgScore >= 60 ? 'Bon' : avgScore > 0 ? 'À améliorer' : 'Non calculé'}
              </p>
              <p className="text-zinc-500 text-sm">Basé sur {stacks.length} stack{stacks.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {CRITERIA.map((c, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">{c.label}</p>
                  <span className="font-dm-mono text-sm font-black" style={{ color: c.score >= 80 ? '#CAFF32' : c.score >= 60 ? '#FF6B35' : '#ef4444' }}>
                    {c.score}/100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${c.score}%`, backgroundColor: c.score >= 80 ? '#CAFF32' : c.score >= 60 ? '#FF6B35' : '#ef4444' }} />
                </div>
                <p className="text-zinc-500 text-xs">{c.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
