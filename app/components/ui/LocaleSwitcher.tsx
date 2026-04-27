'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

const LOCALE_LABELS: Record<string, { full: string; ariaLabel: string }> = {
  fr: { full: 'Français',  ariaLabel: 'Passer en français' },
  en: { full: 'English',   ariaLabel: 'Switch to English'  },
  es: { full: 'Español',   ariaLabel: 'Cambiar a español'  },
}

interface LocaleSwitcherProps {
  onSelect?: () => void
}

export default function LocaleSwitcher({ onSelect }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale })
    onSelect?.()
  }

  return (
    <div role="group" aria-label="Language switcher">
      {routing.locales.map((loc) => {
        const isActive = loc === locale
        return (
          <button
            key={loc}
            onClick={() => handleChange(loc)}
            aria-label={LOCALE_LABELS[loc]?.ariaLabel}
            aria-pressed={isActive}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition-colors',
              isActive
                ? 'text-zinc-900 dark:text-white font-semibold'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/8 hover:text-zinc-900 dark:hover:text-white'
            )}
          >
            <span>{LOCALE_LABELS[loc]?.full}</span>
            {isActive && <span className="text-zinc-500 dark:text-zinc-400 text-xs">✓</span>}
          </button>
        )
      })}
    </div>
  )
}
