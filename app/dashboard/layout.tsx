import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'

const SIDEBAR_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Mon Stack', href: '/dashboard/stack', icon: '⬡' },
  { label: 'Recommandations', href: '/dashboard/recommend', icon: '✦' },
  { label: 'ROI Tracker', href: '/dashboard/roi', icon: '↑' },
  { label: 'Stack Alerts', href: '/dashboard/alerts', icon: '◎' },
  { label: 'Stack Score', href: '/dashboard/score', icon: '◐' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null
  try {
    user = await currentUser()
  } catch (err) {
    console.error('Clerk currentUser error:', err)
  }

  const firstName = user?.firstName ?? 'Utilisateur'
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-[220px] border-r border-border flex flex-col flex-shrink-0 bg-bg-2">
        {/* Logo */}
        <div className="px-6 py-[22px] border-b border-border">
          <Link href="/" className="font-syne font-extrabold text-lg tracking-[-0.02em] text-cream">
            Stack<span className="text-accent">AI</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {SIDEBAR_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-[10px] text-muted-2
                         hover:text-cream hover:bg-bg-3 transition-colors duration-150
                         font-dm-mono text-[0.72rem] tracking-[0.06em] uppercase"
            >
              <span className="text-accent text-xs">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border px-4 py-4 flex items-center gap-3">
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
          <div className="overflow-hidden">
            <p className="font-dm-sans text-[0.78rem] text-cream truncate">
              {user?.firstName ?? 'Utilisateur'}
            </p>
            <p className="font-dm-mono text-[0.6rem] text-muted truncate">
              {user?.emailAddresses[0]?.emailAddress ?? ''}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
