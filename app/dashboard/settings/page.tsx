import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserByClerkId, getUserStacks } from '@/lib/supabase/queries'
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config'
import Link from 'next/link'
import Image from 'next/image'

export default async function SettingsPage() {
  const { getToken } = await auth()
  let user = null
  try { user = await currentUser() } catch { redirect('/sign-in') }
  if (!user) redirect('/sign-in')

  const dbUser = await getUserByClerkId(user.id)
  const plan: 'free' | 'pro' | 'agency' = (dbUser as any)?.plan ?? 'free'
  const email = user.emailAddresses[0]?.emailAddress ?? ''
  const createdAt = new Date(user.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const clerkToken = await getToken({ template: 'supabase' }) ?? ''
  const stacks = await getUserStacks(user.id, clerkToken, email)
  const stackCount = stacks.length

  const planConfig = RATE_LIMIT_CONFIGS.find(c => c.plan === plan) ?? RATE_LIMIT_CONFIGS[0]

  const PLAN_META = {
    free:   { label: 'Free',   color: 'text-zinc-400',  bg: 'bg-zinc-800',        next: 'Pro',    nextHref: '#upgrade' },
    pro:    { label: 'Pro',    color: 'text-[#CAFF32]', bg: 'bg-[#CAFF32]/10',    next: 'Agency', nextHref: '#upgrade' },
    agency: { label: 'Agency', color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]/10',    next: null,     nextHref: '' },
  }
  const meta = PLAN_META[plan]

  // Calculate usage display
  const usageLabel = plan === 'free'
    ? `${planConfig.requests} recommandation / 30 jours`
    : `${planConfig.requests} recommandations / heure`

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">Paramètres</h1>
        <p className="text-zinc-500 text-sm">Ton compte et ton abonnement.</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Profil */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Mon profil</p>
          <div className="flex items-center gap-4 mb-5">
            {user.imageUrl ? (
              <Image src={user.imageUrl} alt="Avatar" width={56} height={56}
                className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center font-syne font-black text-xl text-white">
                {(user.firstName?.[0] ?? email[0] ?? '?').toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-syne font-bold text-white text-lg">
                {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilisateur'}
              </p>
              <p className="text-zinc-500 text-sm">{email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
            <Row label="Membre depuis" value={createdAt} />
            <Row label="Stacks créés" value={`${stackCount} stack${stackCount !== 1 ? 's' : ''}`} />
          </div>
        </section>

        {/* Plan & Usage */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Mon abonnement</p>
            <span className={`font-dm-mono text-[10px] font-black uppercase px-3 py-1 ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          </div>

          {/* Usage actuel */}
          <div className="bg-zinc-800/40 p-4 mb-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-zinc-300 text-sm font-medium">Recommandations IA</p>
              <p className={`font-dm-mono text-sm font-black ${meta.color}`}>{usageLabel}</p>
            </div>
            <p className="text-zinc-600 text-xs">
              {plan === 'free'
                ? 'Le compteur se remet à zéro tous les 30 jours.'
                : 'Le compteur se remet à zéro chaque heure.'}
            </p>
          </div>

          {/* Comparaison des plans */}
          <div className="border border-zinc-800 overflow-hidden mb-5">
            <div className="grid grid-cols-3 bg-zinc-800/50 px-4 py-2">
              {['Plan', 'Recommandations', 'Période'].map(h => (
                <p key={h} className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.12em]">{h}</p>
              ))}
            </div>
            {RATE_LIMIT_CONFIGS.map(cfg => (
              <div key={cfg.plan}
                className={`grid grid-cols-3 px-4 py-3 border-t border-zinc-800 ${cfg.plan === plan ? 'bg-[#CAFF32]/5' : ''}`}>
                <p className={`text-sm font-bold capitalize ${cfg.plan === plan ? 'text-[#CAFF32]' : 'text-zinc-500'}`}>
                  {cfg.plan} {cfg.plan === plan && '✓'}
                </p>
                <p className={`text-sm ${cfg.plan === plan ? 'text-zinc-200' : 'text-zinc-600'}`}>{cfg.requests}</p>
                <p className={`text-sm ${cfg.plan === plan ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {cfg.windowLabel === '30 days' ? '30 jours' : '1 heure'}
                </p>
              </div>
            ))}
          </div>

          {/* CTA upgrade */}
          {plan !== 'agency' && (
            <div className="p-4 bg-[#CAFF32]/5 border border-[#CAFF32]/20">
              <p className="text-zinc-300 text-sm mb-3">
                Passe au plan <span className={`font-bold ${meta.color}`}>{meta.next}</span> pour plus de recommandations et accès à tous les agents.
              </p>
              <Link href="/dashboard/billing"
                className="inline-block bg-[#CAFF32] text-zinc-900 font-bold text-xs px-5 py-2 hover:bg-[#d4ff50] transition-colors">
                Passer à {meta.next} →
              </Link>
            </div>
          )}
        </section>

        {/* Compte */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Mon compte</p>
          <div className="flex flex-col gap-3">
            <p className="text-zinc-400 text-sm leading-relaxed">
              Modifie ton email, mot de passe ou tes méthodes de connexion.
            </p>
            <div className="flex gap-3 pt-2">
              <Link href="/dashboard/account"
                className="border border-zinc-700 text-zinc-300 text-xs font-bold px-4 py-2 hover:border-zinc-500 transition-colors">
                Gérer mon compte →
              </Link>
            </div>
          </div>
        </section>

        {/* Données */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Mes données</p>
          <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
            Tu peux demander l'export ou la suppression de toutes tes données à tout moment.
          </p>
          <div className="flex gap-3">
            <button className="border border-zinc-700 text-zinc-400 text-xs font-bold px-4 py-2 hover:border-zinc-500 hover:text-zinc-300 transition-colors">
              Exporter mes données
            </button>
            <button className="border border-red-900/50 text-red-500/70 text-xs font-bold px-4 py-2 hover:border-red-700 hover:text-red-400 transition-colors">
              Supprimer mon compte
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className="text-zinc-200 text-sm font-medium">{value}</span>
    </div>
  )
}
