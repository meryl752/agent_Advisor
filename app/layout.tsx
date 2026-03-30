import type { Metadata } from 'next'
import { Syne, DM_Mono, DM_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import './globals.css'
import { ThemeProvider } from '@/app/components/ThemeProvider'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-mono',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Raspquery — La plateforme IA qui maximise ton ROI',
    template: '%s | Raspquery',
  },
  description: "Tu décris ton objectif. Raspquery analyse 200+ agents IA et t'assemble le combo exact pour maximiser ton ROI.",
  keywords: ['IA', 'agents IA', 'stack IA', 'ROI', 'automatisation', 'intelligence artificielle', 'outils IA', 'productivité'],
  authors: [{ name: 'Raspquery' }],
  creator: 'Raspquery',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://raspquery.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Raspquery — Construis le stack parfait. Gagne plus.',
    description: 'Trouve les agents IA exacts pour ton objectif en 30 secondes. 200+ outils analysés, ROI calculé.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Raspquery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raspquery — La plateforme IA qui maximise ton ROI',
    description: 'Trouve les agents IA exacts pour ton objectif en 30 secondes.',
    creator: '@raspquery',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#C8F135',
          colorBackground: '#0d0d0d',
          colorText: '#f0ede6',
          colorTextSecondary: '#bbbbbb',
          colorInputBackground: '#111111',
          colorInputText: '#f0ede6',
        },
      }}
    >
      <html lang="fr" className={`${syne.variable} ${dmMono.variable} ${dmSans.variable}`} suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
