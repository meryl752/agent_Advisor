import { createNavigation } from 'next-intl/navigation'
import { routing } from '@/i18n/routing'

// Locale-aware navigation helpers — use these instead of next/link and next/navigation
// in all pages and components under app/[locale]/
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
