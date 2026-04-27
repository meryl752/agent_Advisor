import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Mono, DM_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import '../globals.css'
import { ThemeProvider } from '@/app/components/ThemeProvider'
import { routing, localeDir } from '@/i18n/routing'
import { getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-syne', // keep same CSS var so all existing font-syne classes work
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <ClerkProvider
      signInUrl={locale === 'fr' ? '/sign-in' : `/${locale}/sign-in`}
      signUpUrl={locale === 'fr' ? '/sign-up' : `/${locale}/sign-up`}
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#C8F135',
          colorBackground: '#ffffff',
          colorText: '#09090b',
          colorTextSecondary: '#71717a',
          colorInputBackground: '#f4f4f5',
          colorInputText: '#09090b',
        },
      }}
    >
      <html
        lang={locale}
        dir={localeDir[locale] ?? 'ltr'}
        className={`${plusJakarta.variable} ${dmMono.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
