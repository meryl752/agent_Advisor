'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-16 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
  }

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <div className="flex items-center bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg shadow-sm">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "relative w-8 h-7 flex items-center justify-center rounded-md transition-all duration-300",
          !isDark ? "bg-white dark:bg-zinc-800 text-amber-500 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        )}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "relative w-8 h-7 flex items-center justify-center rounded-md transition-all duration-300",
          isDark ? "bg-white dark:bg-zinc-800 text-[#CAFF32] shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        )}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  )
}
