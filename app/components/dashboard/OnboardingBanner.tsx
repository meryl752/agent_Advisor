'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const SESSION_KEY = 'onboarding_banner_dismissed'

export default function OnboardingBanner({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    const dismissed = sessionStorage.getItem(SESSION_KEY)
    if (!dismissed) setVisible(true)
  }, [show])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative mb-6 bg-[#CAFF32]/5 border border-[#CAFF32]/20 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse flex-shrink-0" />
        <p className="text-zinc-300 text-sm">
          Complete your profile to get personalized recommendations.
        </p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link
          href="/onboarding"
          className="font-dm-mono text-[11px] text-[#CAFF32] uppercase tracking-widest hover:underline"
        >
          Get started →
        </Link>
        <button
          onClick={dismiss}
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
