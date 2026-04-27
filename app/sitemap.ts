import { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://raspquery.com'

// Public pages to include in sitemap
const PUBLIC_PAGES = ['', '/sign-up', '/sign-in']

// Non-default locales that get a prefix
const PREFIXED_LOCALES = ['en', 'es']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Default locale (fr) — no prefix
  for (const page of PUBLIC_PAGES) {
    entries.push({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'weekly' : 'monthly',
      priority: page === '' ? 1 : page === '/sign-up' ? 0.8 : 0.5,
    })
  }

  // Non-default locales — with prefix
  for (const locale of PREFIXED_LOCALES) {
    for (const page of PUBLIC_PAGES) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 0.9 : page === '/sign-up' ? 0.7 : 0.4,
      })
    }
  }

  return entries
}
