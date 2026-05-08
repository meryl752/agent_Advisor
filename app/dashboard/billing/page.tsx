'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Link } from '@/lib/i18n/navigation'

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
        {loading ? '...' : 'Manage Subscription →'}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

export default function BillingPage() {
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
        <h1 className="font-syne font-black text-4xl text-zinc-900 dark:text-white tracking-tighter mb-2">Billing</h1>
        <p className="text-zinc-500 text-sm">Manage your subscription and billing</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Early Access banner */}
        {!hasPaid && (
          <section className="bg-[#CAFF32]/10 border border-[#CAFF32]/30 p-6 rounded-xl">
            <div className="flex items-start gap-4">
              <div>
                <p className="font-black text-zinc-900 dark:text-white text-base mb-1">
                  Early Adopter Access
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  You have free access to all features during our early access period
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Current plan */}
        <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
          <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Current Plan</p>
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
                    {hasPaid ? (plan === 'agency' ? '79€/mo' : '19€/mo') : '0€'}
                  </span>
                </div>
                <p className="text-zinc-500 text-sm">
                  {hasPaid ? 'Full access to all features' : 'Full access during early access'}
                </p>
              </div>
              {hasPaid && <ManageButton hasPaid={hasPaid} />}
            </div>
          )}
        </section>

        {/* Stripe portal for paid users */}
        {hasPaid && (
          <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Manage Subscription</p>
            <ManageButton hasPaid={hasPaid} />
          </section>
        )}

        {/* Coming soon plans */}
        {!hasPaid && (
          <section className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl">
            <p className="font-dm-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-5">Coming Soon</p>
            <div className="border border-zinc-200 dark:border-zinc-800 overflow-hidden rounded-lg">
              <div className="grid grid-cols-3 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2">
                {['Plan', 'Price', 'Status'].map(h => (
                  <p key={h} className="font-dm-mono text-[9px] text-zinc-500 uppercase tracking-[0.12em]">{h}</p>
                ))}
              </div>
              {[
                { label: 'Early Adopter', price: 'Free', status: 'Active', active: true },
                { label: 'Pro', price: '19€/mo', status: 'Coming Soon', active: false },
                { label: 'Agency', price: '79€/mo', status: 'Coming Soon', active: false },
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
