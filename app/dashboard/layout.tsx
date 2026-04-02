'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, createContext, useContext, useState } from 'react'
import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/app/components/ThemeToggle'
import WelcomeToast from '@/app/components/ui/WelcomeToast'

// Context to let child pages collapse the sidebar
export const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

export function useSidebar() { return useContext(SidebarContext) }

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/dashboard/recommend', label: 'Construis ton stack', icon: '✦', accent: true },
  { href: '/dashboard/blueprint', label: 'StackMap', icon: '◉', badge: 'New' },
  { href: '/dashboard/stack', label: 'Mes stacks', icon: '⬡' },
  { href: '/dashboard/roi', label: 'ROI Tracker', icon: '↑' },
  { href: '/dashboard/alerts', label: 'Stack Alerts', icon: '◎' },
  { href: '/dashboard/score', label: 'Stack Score', icon: '◐' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: '⚙' },
  { href: '/dashboard/billing', label: 'Facturation', icon: '◈' },
  { href: '/dashboard/account', label: 'Mon compte', icon: '○' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetch('/api/onboarding/state')
      .then(r => r.json())
      .then(data => {
        if (data?.onboarding_completed === false) router.push('/onboarding')
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
    <div className="min-h-screen bg-[var(--bg)] flex transition-all duration-500 ease-in-out">

      {/* Sidebar */}
      <aside className={cn(
        'flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col bg-[var(--bg2)] relative transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-0 border-r-0' : 'w-[220px]'
      )}>
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(202,255,50,0.03), transparent)' }} />

        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800/60 whitespace-nowrap">
          <Link href="/" className="font-syne font-extrabold text-lg tracking-[-0.02em] text-zinc-900 dark:text-white flex items-center group">
            Ras
            <span className="relative flex items-center mx-[1px] group-hover:scale-110 transition-transform">
              <span className="text-zinc-900 px-[3px] py-[1px] rounded-l-md leading-none shadow-sm z-10 text-[0.95em]" style={{ background: '#D6E8F5' }}>p</span>
              <span className="text-zinc-900 bg-[#CAFF32] px-[3px] py-[1px] rounded-r-md leading-none shadow-sm -ml-[1px] text-[0.95em]">q</span>
            </span>
            uery
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 whitespace-nowrap">
          {NAV.map((item) => {
            const active = item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  active ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900',
                  item.accent && !active && 'text-zinc-600 dark:text-[#CAFF32]/70 hover:text-[#CAFF32]'
                )}>
                <span className={cn('text-sm transition-transform duration-200 group-hover:scale-110',
                  active ? 'text-[#CAFF32]' : '',
                  item.accent && !active ? 'text-[#CAFF32]/70' : '')}>
                  {item.icon}
                </span>
                <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                {item.accent && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#CAFF32] animate-pulse" />}
                {(item as { badge?: string }).badge && (
                  <span className="ml-auto font-dm-mono text-[8px] bg-[#CAFF32]/10 text-[#CAFF32] border border-[#CAFF32]/20 px-1.5 py-[1px] rounded-full">
                    {(item as { badge?: string }).badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + ThemeToggle */}
        <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-4 py-4 flex items-center gap-3 whitespace-nowrap">
          <UserButton appearance={{
            elements: {
              avatarBox: 'w-8 h-8 rounded-xl',
              userButtonPopoverCard: 'bg-zinc-900 border border-zinc-800 shadow-2xl',
              userButtonPopoverActionButton: 'text-zinc-300 hover:bg-zinc-800',
            }
          }} />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-300 truncate">{user?.firstName ?? 'Utilisateur'}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-600 truncate">{user?.emailAddresses[0]?.emailAddress ?? ''}</p>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 h-screen flex flex-col overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle, #CAFF32 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className={cn('flex-1 overflow-y-auto relative z-10 scrollbar-hide', collapsed ? 'p-0 overflow-hidden' : 'px-8 py-8')}>
          {children}
        </div>
        <WelcomeToast />
      </main>
    </div>
    </SidebarContext.Provider>
  )
}