'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Suppress the React 19 script tag warning from next-themes
// This is a known issue: next-themes injects a script to prevent theme flash
// It's intentional behavior and does NOT affect users — purely a dev warning
const OriginalConsoleError = console.error
if (typeof window !== 'undefined') {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('script tag while rendering')) return
    OriginalConsoleError(...args)
  }
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      disableTransitionOnChange
    > 
      {children}
    </NextThemesProvider>
  )
}
