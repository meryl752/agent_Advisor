'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Ne pas remplacer console.error globalement : cela fausse les stack traces
// (ex. erreurs Clerk) et masque des signaux utiles en prod. Le layout racine
// utilise déjà suppressHydrationWarning sur <html> pour next-themes.

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
