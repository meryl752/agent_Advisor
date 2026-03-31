'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = {
  free:   { label: 'Free',   color: 'text-zinc-400',  bg: 'bg-zinc-800',       requests: '1 / 30 jours',  price: '0€' },
  pro:    { label: 'Pro',    color: 'text-[#CAFF32]', bg: 'bg-[#CAFF32]/10',   requests: '10 / heure',    price: '19€/mois' },
  agency: { label: 'Agency', color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]/10',   requests: '50 / heure',    price: '79€/mois' },
}

function ManageButton({ hasPaid }: { hasPaid: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleManage = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Erreur inattendue')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPaid) return null

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleManage} disabled={loading}
        className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-bold
                   text-sm px-5 py-2.5 hover:border-zinc-500 hover:text-white transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? 'Redirection...' : 'Gérer mon abonnement →'}
      </button>
      {error && <p className="text-red-400 text-xs font-dm-mono">{error}</p>}
      <p className="text-zinc-600 text-xs">
        Modifier, annuler ou changer de plan via le portail Stripe sécurisé.
      </p>
    </div>
  )
}

export default function BillingPage() {
  // Plan is read client-side via a server component wrapper ideally,
  // but for simplicity we fetch it here
  const [plan, setPlan] = useState<'free' | 'pro' | 'agency' | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch plan from settings API
  useState(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then(d => { setPlan(d.plan ?? 'free'); setLoading(false) })
      .catch(() => { setPlan('free'); setLoading(false) })
  })

  const meta = plan ? PLANS[plan] : null
  const hasPaid = plan === 'pro' || plan === 'agency'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-white tracking-tighter mb-2">Facturation</h1>
        <p className="text-zinc-500 text-sm">Gère ton abonnement et tes paiements.</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Plan actuel */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Plan actuel</p>

          {loading ? (
            <div className="h-16 bg-zinc-800/50 animate-pulse rounded" />
          ) : meta ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-dm-mono text-[10px] font-black uppercase px-3 py-1 ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="font-syne font-black text-white text-xl">{meta.price}</span>
                </div>
                <p className="text-zinc-500 text-sm">{meta.requests} de recommandations IA</p>
              </div>
              {!hasPaid && (
                <Link href="/#pricing"
                  className="bg-[#CAFF32] text-zinc-900 font-bold text-sm px-5 py-2.5
                             hover:bg-[#d4ff50] transition-colors">
                  Upgrader →
                </Link>
              )}
            </div>
          ) : null}
        </section>

        {/* Gestion abonnement */}
        {hasPaid && (
          <section className="bg-zinc-900/50 border border-zinc-800 p-6">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">
              Gérer l'abonnement
            </p>
            <ManageButton hasPaid={hasPaid} />
          </section>
        )}

        {/* Comparaison plans */}
        <section className="bg-zinc-900/50 border border-zinc-800 p-6">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">
            Tous les plans
          </p>
          <div className="border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-4 bg-zinc-800/50 px-4 py-2">
              {['Plan', 'Prix', 'Recommandations', 'Période'].map(h => (
                <p key={h} className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.12em]">{h}</p>
              ))}
            </div>
            {Object.entries(PLANS).map(([key, cfg]) => (
              <div key={key}
                className={`grid grid-cols-4 px-4 py-3 border-t border-zinc-800 ${key === plan ? 'bg-[#CAFF32]/5' : ''}`}>
                <p className={`text-sm font-bold capitalize ${key === plan ? cfg.color : 'text-zinc-500'}`}>
                  {cfg.label} {key === plan && '✓'}
                </p>
                <p className={`text-sm ${key === plan ? 'text-zinc-200' : 'text-zinc-600'}`}>{cfg.price}</p>
                <p className={`text-sm ${key === plan ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {key === 'free' ? '1' : key === 'pro' ? '10' : '50'}
                </p>
                <p className={`text-sm ${key === plan ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {key === 'free' ? '30 jours' : '1 heure'}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
