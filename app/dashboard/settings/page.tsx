import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserByClerkId } from '@/lib/supabase/queries'
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limit/config'

export default async function SettingsPage() {
  const { getToken } = await auth()
  let user = null
  try {
    user = await currentUser()
  } catch {
    redirect('/sign-in')
  }
  if (!user) redirect('/sign-in')

  const dbUser = await getUserByClerkId(user.id)
  const plan = (dbUser as any)?.plan ?? 'free'
  const email = user.emailAddresses[0]?.emailAddress ?? ''
  const createdAt = new Date(user.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const planConfig = RATE_LIMIT_CONFIGS.find(c => c.plan === plan) ?? RATE_LIMIT_CONFIGS[0]

  const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    free:   { label: 'Free',   color: 'text-zinc-400',   bg: 'bg-zinc-800' },
    pro:    { label: 'Pro',    color: 'text-[#CAFF32]',  bg: 'bg-[#CAFF32]/10' },
    agency: { label: 'Agency', color: 'text-[#38bdf8]',  bg: 'bg-[#38bdf8]/10' },
  }
  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.free

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">Paramètres</h1>
        <p className="text-zinc-500 text-sm">Gère ton compte, ton plan et tes limites d'utilisation.</p>
      </div>

      <div className="flex flex-col gap-6">

        {/* Profile */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Profil</p>
          <div className="flex flex-col gap-4">
            <Row label="Nom" value={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—'} />
            <Row label="Email" value={email} />
            <Row label="Membre depuis" value={createdAt} />
            <Row label="ID Compte" value={`${user.id.substring(0, 12)}...`} mono />
          </div>
        </section>

        {/* Plan & Limites */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">Plan & Limites d'usage</p>
            <span className={`font-dm-mono text-[10px] font-black uppercase px-3 py-1 ${planMeta.bg} ${planMeta.color}`}>
              {planMeta.label}
            </span>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <Row label="Plan actuel" value={planMeta.label} />
            <Row
              label="Recommandations IA"
              value={`${planConfig.requests} / ${planConfig.windowLabel}`}
              highlight
            />
            <Row
              label="Fenêtre de renouvellement"
              value={planConfig.windowLabel === '30 days' ? '30 jours glissants' : '1 heure glissante'}
            />
          </div>

          {/* Limits table */}
          <div className="border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-4 bg-zinc-800/50 px-4 py-2">
              {['Plan', 'Requêtes', 'Période', 'Statut'].map(h => (
                <p key={h} className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.15em]">{h}</p>
              ))}
            </div>
            {RATE_LIMIT_CONFIGS.map(cfg => (
              <div key={cfg.plan} className={`grid grid-cols-4 px-4 py-3 border-t border-zinc-800 ${cfg.plan === plan ? 'bg-[#CAFF32]/5' : ''}`}>
                <p className={`text-sm font-bold capitalize ${cfg.plan === plan ? 'text-[#CAFF32]' : 'text-zinc-400'}`}>
                  {cfg.plan}
                </p>
                <p className="text-sm text-zinc-300">{cfg.requests}</p>
                <p className="text-sm text-zinc-400">{cfg.windowLabel}</p>
                <p className="text-sm">
                  {cfg.plan === plan
                    ? <span className="text-[#CAFF32] font-bold">✓ Actif</span>
                    : <span className="text-zinc-600">—</span>
                  }
                </p>
              </div>
            ))}
          </div>

          {plan === 'free' && (
            <div className="mt-4 p-4 bg-[#CAFF32]/5 border border-[#CAFF32]/20">
              <p className="text-sm text-zinc-300 mb-3">
                Passe au plan <span className="text-[#CAFF32] font-bold">Pro</span> pour 10 recommandations/heure et accès à tous les agents.
              </p>
              <a
                href="/dashboard/billing"
                className="inline-block bg-[#CAFF32] text-zinc-900 font-bold text-xs px-5 py-2 hover:bg-[#d4ff50] transition-colors"
              >
                Passer à Pro →
              </a>
            </div>
          )}
        </section>

        {/* Sécurité */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Sécurité</p>
          <div className="flex flex-col gap-4">
            <SecurityRow
              label="Authentification"
              status="active"
              detail="Clerk — OAuth 2.0 + JWT"
            />
            <SecurityRow
              label="Chiffrement des données"
              status="active"
              detail="TLS 1.3 en transit, AES-256 au repos (Supabase)"
            />
            <SecurityRow
              label="Rate limiting API"
              status="active"
              detail={`${planConfig.requests} req/${planConfig.windowLabel} — Upstash Redis`}
            />
            <SecurityRow
              label="Protection des logs"
              status="active"
              detail="Données personnelles anonymisées (RGPD)"
            />
            <SecurityRow
              label="Monitoring erreurs"
              status={process.env.NEXT_PUBLIC_SENTRY_DSN ? 'active' : 'inactive'}
              detail="Sentry — Error tracking & alerting"
            />
          </div>
        </section>

        {/* Données */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Mes données</p>
          <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
            Conformément au RGPD, tu as le droit d'accéder, modifier ou supprimer tes données personnelles à tout moment.
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

function Row({ label, value, mono = false, highlight = false }: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-dm-mono text-xs' : ''} ${highlight ? 'text-[#CAFF32] font-bold' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  )
}

function SecurityRow({ label, status, detail }: {
  label: string
  status: 'active' | 'inactive' | 'warning'
  detail: string
}) {
  const colors = {
    active:   { dot: 'bg-[#CAFF32]', glow: 'shadow-[0_0_6px_#CAFF32]', text: 'text-[#CAFF32]', label: 'Actif' },
    inactive: { dot: 'bg-zinc-600',  glow: '',                           text: 'text-zinc-600',  label: 'Inactif' },
    warning:  { dot: 'bg-[#FF6B35]', glow: 'shadow-[0_0_6px_#FF6B35]', text: 'text-[#FF6B35]', label: 'Attention' },
  }
  const c = colors[status]

  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <div>
        <p className="text-zinc-200 text-sm font-medium">{label}</p>
        <p className="text-zinc-600 text-xs mt-0.5">{detail}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className={`w-2 h-2 rounded-full ${c.dot} ${c.glow}`} />
        <span className={`font-dm-mono text-[10px] font-bold uppercase ${c.text}`}>{c.label}</span>
      </div>
    </div>
  )
}
