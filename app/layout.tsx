import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Mono, DM_Sans } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { ThemeProvider } from '@/app/components/ThemeProvider'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
    default: 'Raspquery — The AI platform that maximizes your ROI',
    template: '%s | Raspquery',
  },
  description: 'Describe your goal. Raspquery analyzes 200+ AI agents and assembles the exact combo to maximize your ROI.',
  keywords: ['AI', 'AI agents', 'AI stack', 'ROI', 'automation', 'artificial intelligence', 'AI tools', 'productivity'],
  authors: [{ name: 'Raspquery' }],
  creator: 'Raspquery',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://raspquery.com'),
  openGraph: {
    title: 'Raspquery — Build the perfect stack. Earn more.',
    description: 'Find the exact AI agents for your goal in 30 seconds. 200+ tools analyzed, ROI calculated.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Raspquery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raspquery — The AI platform that maximizes your ROI',
    description: 'Find the exact AI agents for your goal in 30 seconds.',
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
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
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
        lang="en"
        className={`${plusJakarta.variable} ${dmMono.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <body className="antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
