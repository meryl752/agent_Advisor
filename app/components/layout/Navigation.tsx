'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { NAV_LINKS } from '@/lib/constants'

export default function Navigation() {
  const { isSignedIn } = useAuth()

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-between items-center px-[52px] py-[22px]
                 border-b border-border sticky top-0 z-50
                 bg-bg/94 backdrop-blur-nav"
    >
      <Link href="/" className="font-syne font-extrabold text-xl tracking-[-0.02em] text-cream">
        Stack<span className="text-accent">AI</span>
      </Link>

      <div className="hidden md:flex gap-9 items-center">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}
            className="font-dm-mono text-[0.72rem] tracking-[0.08em] uppercase
                       text-muted-2 hover:text-accent transition-colors duration-200">
            {link.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {isSignedIn ? (
          <>
            <Link href="/dashboard"
              className="font-dm-mono text-[0.72rem] tracking-[0.08em] uppercase
                         text-muted-2 hover:text-accent transition-colors">
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                  userButtonPopoverCard: 'bg-bg-2 border border-border shadow-xl',
                  userButtonPopoverActionButton: 'text-cream hover:bg-bg-3',
                  userButtonPopoverActionButtonText: 'font-dm-mono text-xs',
                },
              }}
            />
          </>
        ) : (
          <>
            <Link href="/sign-in"
              className="font-dm-mono text-[0.72rem] tracking-[0.08em] uppercase
                         text-muted-2 hover:text-accent transition-colors">
              Connexion
            </Link>
            <Link href="/sign-up"
              className="bg-accent text-bg font-syne font-bold text-[0.8rem] tracking-[0.04em]
                         px-[22px] py-[10px] hover:opacity-85 hover:-translate-y-px transition-all duration-150">
              Commencer →
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
