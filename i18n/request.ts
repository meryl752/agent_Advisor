import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate locale; fall back to default if missing or unsupported
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[next-intl]', error.message)
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join('.')
      if (error.code === 'MISSING_MESSAGE') {
        return path
      }
      return path
    },
  }
})
