'use client'

import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { useEffect, createContext, useContext, useState, useRef } from 'react'
import { Link } from '@/lib/i18n/navigation'
import Image from 'next/image'
import { useUser, useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import WelcomeToast from '@/app/components/ui/WelcomeToast'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '@/app/components/ui/LocaleSwitcher'

// Context to let child pages collapse the sidebar
export const SidebarContext = createContext<{
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

export function useSidebar() { return useContext(SidebarContext) }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const NAV = [
    { href: '/dashboard',            label: t('nav.dashboard'),   icon: '/assets/icons svg/dashboard-browsing-stroke-rounded.svg' },
    { href: '/dashboard/recommend',  label: t('nav.recommend'),   icon: '/assets/icons svg/ai-cloud-02-stroke-rounded.svg', accent: true },
    { href: '/dashboard/blueprint',  label: t('nav.blueprint'),   icon: '/assets/icons svg/briefcase-08-stroke-rounded.svg' },
    { href: '/dashboard/stack',      label: t('nav.stacks'),      icon: '/assets/icons svg/bookmark-add-02-stroke-rounded.svg' },
    { href: '/dashboard/roi',        label: t('nav.roi'),         icon: '/assets/icons svg/add-money-circle-stroke-rounded.svg' },
    { href: '/dashboard/alerts',     label: t('nav.alerts'),      icon: '/assets/icons svg/bell-dot-stroke-rounded.svg' },
    { href: '/dashboard/score',      label: t('nav.score'),       icon: '/assets/icons svg/checkmark-circle-03-stroke-rounded.svg' },
    { href: '/dashboard/settings',   label: t('nav.settings'),    icon: '/assets/icons svg/setting-07-stroke-rounded.svg' },
    { href: '/dashboard/billing',    label: t('nav.billing'),     icon: '/assets/icons svg/invoice-01-stroke-rounded.svg' },
    { href: '/dashboard/account',    label: t('nav.account'),     icon: '/assets/icons svg/user-stroke-rounded.svg' },
  ]

  useEffect(() => {
    fetch('/api/onboarding/state')
      .then(r => r.json())
      .then(data => {
        if (data?.onboarding_completed === false) router.push('/onboarding')
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
    <div className="min-h-screen bg-[var(--bg)] flex transition-all duration-500 ease-in-out">

      {/* Sidebar */}
      <aside className={cn(
        'flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col bg-[#FBFCF5] dark:bg-[#18181b] relative transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}>
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(202,255,50,0.04), transparent)' }} />

        {/* Logo + collapse button */}
        <div className="px-5 py-5 border-b border-zinc-200 dark:border-zinc-800/60 whitespace-nowrap flex items-center justify-between min-w-0">
          {!collapsed && (
            <Link href="/" className="font-syne font-extrabold text-lg tracking-[-0.02em] text-zinc-900 dark:text-white flex items-center group">
              Ras
              <span className="relative flex items-center mx-[1px] group-hover:scale-110 transition-transform">
                <span className="text-zinc-900 px-[3px] py-[1px] rounded-l-md leading-none shadow-sm z-10 text-[0.95em]" style={{ background: '#D6E8F5' }}>p</span>
                <span className="text-zinc-900 bg-[#CAFF32] px-[3px] py-[1px] rounded-r-md leading-none shadow-sm -ml-[1px] text-[0.95em]">q</span>
              </span>
              uery
            </Link>
          )}
          {/* Collapse / expand button */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={cn(
              'w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
              collapsed && 'mx-auto'
            )}
            title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            <Image
              src="/assets/icons svg/layout-left-stroke-rounded.svg"
              alt="Toggle sidebar"
              width={16}
              height={16}
              className={cn('opacity-60 dark:invert transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">

          {/* CTA dominant — Construis ton stack */}
          <Link href="/dashboard/recommend"
            className={cn(
              'flex items-center gap-3 rounded-xl transition-all duration-200 mb-2',
              collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3',
              pathname.startsWith('/dashboard/recommend')
                ? 'bg-[#CAFF32] text-zinc-900'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'
            )}
            style={!pathname.startsWith('/dashboard/recommend') ? { color: 'var(--accent)' } : {}}>
            <Image
              src="/assets/icons svg/ai-cloud-02-stroke-rounded.svg"
              alt={t('nav.recommend')}
              width={17}
              height={17}
              className={cn(
                'flex-shrink-0 transition-all duration-200',
                pathname.startsWith('/dashboard/recommend')
                  ? '[filter:invert(0.1)_sepia(1)_saturate(5)_hue-rotate(30deg)]'
                  : 'opacity-60 [filter:invert(0.1)_sepia(1)_saturate(5)_hue-rotate(30deg)]'
              )}
            />
            {!collapsed && <span suppressHydrationWarning className="text-[13px] font-bold tracking-wide whitespace-nowrap font-sans">{t('sidebar.newStack')}</span>}
            {!collapsed && pathname.startsWith('/dashboard/recommend') && (
              <span className="ml-auto text-[10px] opacity-50">→</span>
            )}
          </Link>

          {/* Divider */}
          <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 mx-1 mb-2" />

          {NAV.filter(item => item.href !== '/dashboard/recommend').map((item) => {
            const active = item.href === '/dashboard'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl transition-all duration-200 group',
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                )}>
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={17}
                  height={17}
                  className={cn(
                    'flex-shrink-0 transition-all duration-200',
                    active
                      ? 'opacity-100 [filter:invert(0.1)_sepia(1)_saturate(5)_hue-rotate(30deg)] dark:[filter:invert(1)]'
                      : 'opacity-50 dark:opacity-70 dark:invert group-hover:opacity-80'
                  )}
                />
                {!collapsed && <span suppressHydrationWarning className="text-[13px] font-semibold tracking-wide whitespace-nowrap font-sans">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-zinc-200 dark:border-zinc-800/60 px-2 py-3 relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all group',
              collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2.5'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.imageUrl ? (
                <Image src={user.imageUrl} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
              ) : user?.firstName ? (
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {user.firstName[0].toUpperCase()}
                </span>
              ) : (
                <div className="w-full h-full bg-zinc-300 dark:bg-zinc-600 animate-pulse" />
              )}
            </div>
            {!collapsed && (
              <>
                <div className="overflow-hidden flex-1 text-left">
                  {user ? (
                    <>
                      <p suppressHydrationWarning className="text-xs font-bold text-zinc-800 dark:text-zinc-300 truncate">{user.firstName ?? '—'}</p>
                      <p suppressHydrationWarning className="text-[10px] text-zinc-400 dark:text-zinc-600 truncate">{user.emailAddresses[0]?.emailAddress ?? ''}</p>
                    </>
                  ) : (
                    <>
                      <div className="h-2.5 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse mb-1.5" />
                      <div className="h-2 w-28 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    </>
                  )}
                </div>
                <Image
                  src="/assets/icons svg/more-vertical-circle-01-stroke-rounded.svg"
                  alt="Menu"
                  width={16}
                  height={16}
                  className="opacity-40 dark:invert flex-shrink-0 group-hover:opacity-70 transition-opacity"
                />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className={cn(
              'absolute bottom-full mb-2 rounded-2xl overflow-hidden z-50 shadow-2xl',
              'border border-zinc-200 dark:border-white/10',
              collapsed ? 'left-full ml-2 w-64' : 'left-2 right-2'
            )}>
              {/* Glass layer — light: white frosted, dark: dark frosted */}
              <div className="w-full h-full"
                style={{
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                }}
              >
              <div className="bg-white/90 dark:bg-zinc-900/90">

              {/* Email header */}
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/8">
                <p suppressHydrationWarning className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user?.emailAddresses[0]?.emailAddress ?? ''}
                </p>
              </div>

              {/* Group 1 */}
              <div className="py-1.5">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <span className="text-sm w-4 text-center opacity-70">{isDark ? '☀' : '☾'}</span>
                  {isDark ? tCommon('themeLight') : tCommon('themeDark')}
                </button>
                <Link href="/dashboard/account"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <Image src="/assets/icons svg/user-stroke-rounded.svg" alt={t('nav.account')} width={15} height={15} className="opacity-50 dark:invert w-4" />
                  {t('nav.account')}
                </Link>
                <Link href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <Image src="/assets/icons svg/setting-07-stroke-rounded.svg" alt={t('nav.settings')} width={15} height={15} className="opacity-50 dark:invert w-4" />
                  {t('nav.settings')}
                </Link>

                {/* Language row — click to toggle */}
                <button
                  onClick={() => setLangMenuOpen(o => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-4 text-center opacity-70">🌐</span>
                    {t('settings.language')}
                  </div>
                  <span className={cn('text-zinc-400 text-xs transition-transform duration-200', langMenuOpen && 'rotate-90')}>›</span>
                </button>

                {/* Language submenu — inline expand */}
                {langMenuOpen && (
                  <div className="mx-2 mb-1 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700/50 bg-zinc-50 dark:bg-zinc-800/60">
                    <LocaleSwitcher onSelect={() => { setLangMenuOpen(false); setUserMenuOpen(false) }} />
                  </div>
                )}
              </div>

              {/* Group 2 — billing */}
              <div className="py-1.5 border-t border-zinc-200 dark:border-white/8">
                <Link href="/dashboard/billing"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <Image src="/assets/icons svg/add-money-circle-stroke-rounded.svg" alt={t('nav.billing')} width={15} height={15} className="opacity-50 dark:invert w-4" />
                  {t('nav.billing')}
                </Link>
              </div>

              {/* Logout */}
              <div className="py-1.5 border-t border-zinc-200 dark:border-white/8">
                <button
                  onClick={() => signOut(() => router.push('/'))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors rounded-lg mx-1 w-[calc(100%-8px)]">
                  <Image src="/assets/icons svg/delivery-return-02-stroke-rounded.svg" alt={tCommon('signOut')} width={15} height={15} className="opacity-50 dark:invert w-4" />
                  {tCommon('signOut')}
                </button>
              </div>
              </div>{/* bg layer */}
              </div>{/* blur layer */}
            </div>
          )}
        </div>

      </aside>

      {/* Main */}
      <main className="flex-1 h-screen flex flex-col overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-0"
          style={{ backgroundImage: 'radial-gradient(circle, #CAFF32 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className={cn('flex-1 overflow-y-auto relative z-10 scrollbar-hide', pathname === '/dashboard/recommend' ? 'p-0 overflow-hidden' : 'px-8 py-6')}>
          {children}
        </div>
        <WelcomeToast />
      </main>
    </div>
    </SidebarContext.Provider>
  )
}
