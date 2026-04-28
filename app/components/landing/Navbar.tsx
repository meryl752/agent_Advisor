'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { isSignedIn } = useAuth()
  const t = useTranslations('landing')

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Detect dark sections under the navbar
  useEffect(() => {
    const darkSections = document.querySelectorAll('[data-theme="dark"]')
    if (!darkSections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Check if any dark section is intersecting near the top
        const anyDark = entries.some(e => e.isIntersecting)
        setIsDark(anyDark)
      },
      {
        rootMargin: '-0px 0px -90% 0px', // trigger when section enters top 10% of viewport
        threshold: 0,
      }
    )

    darkSections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-3">
      <div className={cn(
        'max-w-7xl mx-auto rounded-2xl transition-all duration-500 ease-out border',
        isDark
          ? 'bg-zinc-900/80 backdrop-blur-xl border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
          : scrolled
            ? 'bg-white/60 backdrop-blur-xl border-white/30 shadow-[0_4px_24px_rgba(139,92,246,0.12)]'
            : 'bg-white/20 backdrop-blur-md border-white/30 shadow-[0_2px_16px_rgba(139,92,246,0.08)]'
      )}>
        <div className="px-6 py-3 flex items-center justify-between">

          {/* Logo texte */}
          <Link href="/" className="flex items-center gap-1.5">
            <span className={cn(
              'font-black text-xl tracking-tight transition-colors duration-500',
              isDark ? 'text-white' : 'text-zinc-900'
            )}>Rasp</span>
            <span className="font-black text-xl tracking-tight px-1.5 py-0.5 rounded-lg"
              style={{ background: '#CAFF32', color: '#18181b' }}>
              query
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '#features', label: t('nav.features') },
              { href: '#pricing', label: t('nav.pricing') },
              { href: '#about', label: t('nav.about') },
              { href: '#blog', label: t('nav.blog') },
            ].map(item => (
              <a key={item.href} href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-500',
                  isDark
                    ? 'text-zinc-300 hover:text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/dashboard"
                className={cn(
                  'text-sm font-semibold px-5 py-2 rounded-lg transition-colors',
                  isDark
                    ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                )}>
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link href="/sign-in"
                  className={cn(
                    'text-sm font-semibold px-5 py-2 rounded-lg transition-colors',
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-white/40 backdrop-blur-sm text-zinc-900 hover:bg-white/60'
                  )}>
                  {t('nav.signIn')}
                </Link>
                <Link href="/sign-up"
                  className="bg-[#CAFF32] text-zinc-900 text-sm font-semibold px-5 py-2 rounded-lg
                             hover:bg-[#b8e82d] transition-colors">
                  {t('nav.signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
