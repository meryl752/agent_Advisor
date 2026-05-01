'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'

const PLANS = {
  free:   { label: 'Free',   color: 'text-zinc-400',  bg: 'bg-zinc-800',     requests: '1 recommandation par mois',    price: '0€' },
  pro:    { label: 'Pro',    color: 'text-[#CAFF32]', bg: 'bg-[#CAFF32]/10', requests: '10 recommandations par heure', price: '19€/mois' },
  agency: { label: 'Agency', color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]/10', requests: '50 recommandations par heure', price: '79€/mois' },
}

function ManageButton({ hasPaid }: { hasPaid: boolean }) {
  const t = useTranslations('dashboard.billing')
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
        setError(data.error ?? 'UNEXPECTED_ERROR')
      }
    } catch {
      setError('NETWORK_ERROR')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPaid) return null

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleManage} disabled={loading}
        className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-bold text-sm px-5 py-2.5 hover:border-zinc-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? '...' : `${t('manage')} →`}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

export default function BillingPage() {
  const t = useTranslations('dashboard.billing')
  const [plan, setPlan] = useState<'free' | 'pro' | 'agency' | null>(null)
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/user/plan')
      .then(r => r.json())
      .then(d => { setPlan(d.plan ?? 'free'); setLoading(false) })
      .catch(() => { setPlan('free'); setLoading(false) })
  })

  const hasPaid = plan === 'pro' || plan === 'agency'

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-syne font-black text-4xl text-zinc-900 dark:text-white tracking-tighter mb-2">{t('title')}</h1>
        <p className="text-zinc-500 text-sm">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Early Access banner — shown during free launch */}
        {!hasPaid && (
          <section className="bg-[#CAFF32]/10 border border-[#CAFF32]/30 p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <div>
                <p className="font-black text-zinc-900 dark:text-white text-base mb-1">
                  Accès Early Adopter
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Pendant le lancement, toutes les fonctionnalités sont accessibles gratuitement et sans limite.
                  Quand on monétisera, ton tarif préférentiel Early Adopter sera automatiquement appliqué.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Current plan */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">{t('currentPlan')}</p>
          {loading ? (
            <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded" />
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-dm-mono text-[10px] font-black uppercase px-3 py-1 bg-[#CAFF32]/10 text-[#CAFF32]">
                    {hasPaid ? (plan === 'agency' ? 'Agency' : 'Pro') : 'Early Adopter'}
                  </span>
                  <span className="font-syne font-black text-zinc-900 dark:text-white text-xl">
                    {hasPaid ? (plan === 'agency' ? '79€/mois' : '19€/mois') : '0€'}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">
                  {hasPaid ? 'Accès complet' : 'Accès complet — gratuit pendant le lancement'}
                </p>
              </div>
              {hasPaid && <ManageButton hasPaid={hasPaid} />}
            </div>
          )}
        </section>

        {/* Stripe portal for paid users */}
        {hasPaid && (
          <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">{t('manage')}</p>
            <ManageButton hasPaid={hasPaid} />
          </section>
        )}

        {/* Coming soon — pricing plans */}
        {!hasPaid && (
          <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Plans à venir</p>
            <div className="border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-lg">
              <div className="grid grid-cols-3 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2">
                {['Plan', 'Prix', 'Statut'].map(h => (
                  <p key={h} className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.12em]">{h}</p>
                ))}
              </div>
              {[
                { label: 'Early Adopter', price: 'Gratuit', status: 'Actif maintenant', active: true },
                { label: 'Pro', price: 'Bientôt', status: 'En préparation', active: false },
                { label: 'Agency', price: 'Bientôt', status: 'En préparation', active: false },
              ].map((row, i) => (
                <div key={i}
                  className={`grid grid-cols-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 ${row.active ? 'bg-[#CAFF32]/5' : ''}`}>
                  <p className={`text-sm font-bold ${row.active ? 'text-[#CAFF32]' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {row.label} {row.active && '✓'}
                  </p>
                  <p className={`text-sm ${row.active ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'}`}>
                    {row.price}
                  </p>
                  <p className={`text-sm ${row.active ? 'text-zinc-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
                    {row.status}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
