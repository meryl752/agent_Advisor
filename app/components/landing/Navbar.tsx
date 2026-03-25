'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isSignedIn } = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
      scrolled
        ? 'bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 shadow-sm'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {/* Typographic play on p and q */}
          <span className="font-syne font-extrabold text-zinc-900 text-xl tracking-tight flex items-center">
            Ras
            <span className="relative flex items-center mx-[1px]">
              <span className="text-white bg-zinc-900 px-[3px] py-[1px] rounded-l-md leading-none shadow-sm z-10">p</span>
              <span className="text-zinc-900 bg-[#CAFF32] px-[3px] py-[1px] rounded-r-md leading-none shadow-sm -ml-[1px]">q</span>
            </span>
            uery
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'À propos'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-zinc-500 hover:text-zinc-900 text-sm font-medium transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href="/dashboard"
              className="bg-zinc-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full
                         hover:bg-zinc-800 transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link href="/sign-in"
                className="text-zinc-600 hover:text-zinc-900 text-sm font-medium transition-colors">
                Connexion
              </Link>
              <Link href="/sign-up"
                className="bg-zinc-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full
                           hover:bg-zinc-800 transition-all hover:scale-105 hover:shadow-lg">
                Commencer →
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
