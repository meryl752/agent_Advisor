import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'es'] as const,
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // fr has no prefix, en/es get prefixes
})

export type Locale = (typeof routing.locales)[number]

// Direction map — drives html dir attribute
// Extend here only when adding RTL locales (e.g. ar: 'rtl')
export const localeDir: Record<string, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr',
  es: 'ltr',
}
