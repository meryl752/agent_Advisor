import type { Metadata } from 'next'
import { Syne, DM_Mono, DM_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

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
  title: 'StackAI — La plateforme IA qui maximise ton ROI',
  description: "Tu décris ton objectif. StackAI analyse 200+ agents IA et t'assemble le combo exact.",
  keywords: ['IA', 'agents IA', 'stack IA', 'ROI', 'automatisation'],
  openGraph: {
    title: 'StackAI — Construis le stack parfait. Gagne plus.',
    description: 'Trouve les agents IA exacts pour ton objectif en 30 secondes.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="fr" className={`${syne.variable} ${dmMono.variable} ${dmSans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
