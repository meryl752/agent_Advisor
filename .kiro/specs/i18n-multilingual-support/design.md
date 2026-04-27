# Design Document: i18n Multilingual Support

## Overview

This document describes the technical design for adding internationalization (i18n) to Raspquery, a Next.js 14 App Router application currently written entirely in French. The implementation uses `next-intl` to support three locales — French (`fr`, default, no URL prefix), English (`en`, prefix `/en/`), and Spanish (`es`, prefix `/es/`) — across all public pages and the authenticated dashboard.

The core challenge is integrating `next-intl`'s middleware with Clerk's `clerkMiddleware` in a single `middleware.ts`, restructuring the App Router directory around a `[locale]` dynamic segment, and replacing all hardcoded strings with catalog-driven translations — without breaking existing Clerk auth flows, Supabase queries, Sentry instrumentation, or Turbopack compatibility.

The architecture is also designed to accommodate future RTL languages (Arabic, Hebrew) as a configuration-only change.

### Key Design Decisions

- **`next-intl` v3 with `createNavigation`**: The v3 API (`createNavigation` from `next-intl/navigation`) replaces the older `createSharedPathnamesNavigation`. It provides typed `Link`, `useRouter`, `usePathname`, and `redirect` helpers that automatically handle locale prefixes.
- **Clerk + next-intl middleware composition**: Clerk v5's `clerkMiddleware` accepts a handler function. We wrap the next-intl middleware call inside that handler, giving Clerk first access to the request for auth checks, then delegating to next-intl for locale routing.
- **`fr` as default locale with no prefix**: next-intl's `localePrefix: 'as-needed'` strategy serves French at bare paths (`/dashboard`) while English and Spanish get prefixes (`/en/dashboard`, `/es/dashboard`). This preserves all existing French URLs.
- **`fast-check` for property-based tests**: Already present in `devDependencies`, so no new dependency is needed.

---

## Architecture

### Directory Structure (Before → After)

```
Before:                          After:
app/                             app/
  layout.tsx                       [locale]/
  page.tsx                           layout.tsx          ← root layout (lang/dir, ClerkProvider, NextIntlClientProvider)
  onboarding/                        page.tsx            ← landing page
    page.tsx                         onboarding/
  dashboard/                           page.tsx
    layout.tsx                       dashboard/
    page.tsx                           layout.tsx
    recommend/                         page.tsx
    blueprint/                         recommend/
    stack/                             blueprint/
    ...                                stack/
  sign-in/                             ...
  sign-up/                   sign-in/                    ← stays outside [locale]
  api/                       sign-up/                    ← stays outside [locale]
    ...                      api/                        ← stays outside [locale]
                               ...
```

The `app/globals.css`, `app/favicon.ico`, `app/robots.ts`, `app/sitemap.ts`, `app/error.tsx`, and `app/not-found.tsx` remain at the `app/` root (not inside `[locale]`).

### Request Flow

```
Browser Request
      │
      ▼
middleware.ts
  ├─ clerkMiddleware (auth check)
  │    ├─ Protected route + no session → redirect to /{locale}/sign-in
  │    └─ Pass through
  └─ next-intl middleware (locale detection/redirect)
       ├─ No prefix + non-fr locale → redirect to /{locale}{path}
       ├─ Unknown prefix → treat as fr
       └─ Pass through to Next.js router
              │
              ▼
       app/[locale]/layout.tsx
         ├─ Sets html lang={locale} dir={localeDir}
         ├─ ClerkProvider (locale-aware signInUrl/signUpUrl)
         └─ NextIntlClientProvider (messages for locale)
                │
                ▼
         Page Component
           ├─ Server: getTranslations('namespace')
           └─ Client: useTranslations('namespace')
```

---

## Components and Interfaces

### 1. `i18n/request.ts` — Server-side locale resolution

```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate locale; fall back to default
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

### 2. `i18n/routing.ts` — Shared routing configuration

```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'es'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // fr has no prefix, en/es get prefixes
})

// Direction map — drives html dir attribute; extend for RTL locales
export const localeDir: Record<string, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr',
  es: 'ltr',
  // ar: 'rtl',  ← future RTL locale: add here only
}
```

### 3. `lib/i18n/navigation.ts` — Locale-aware navigation exports

```typescript
import { createNavigation } from 'next-intl/navigation'
import { routing } from '@/i18n/routing'

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
```

All pages and components under `app/[locale]/` import `Link`, `useRouter`, `usePathname`, and `redirect` from this module instead of `next/link` and `next/navigation`.

### 4. `middleware.ts` — Combined Clerk + next-intl middleware

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

const isProtectedRoute = createRouteMatcher([
  '/((?!en|es)/)dashboard(.*)',  // fr (no prefix)
  '/en/dashboard(.*)',
  '/es/dashboard(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/en',
  '/es',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/en/sign-in(.*)',
  '/es/sign-in(.*)',
  '/en/sign-up(.*)',
  '/es/sign-up(.*)',
  '/onboarding(.*)',
  '/en/onboarding(.*)',
  '/es/onboarding(.*)',
  '/api/auth/webhook',
  '/api/stripe/webhook',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    // Skip Next.js internals, API routes, and static files
    '/((?!_next/static|_next/image|api/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)).*)',
  ],
}
```

**Design rationale**: `clerkMiddleware` runs first, protecting routes before locale processing. If auth protection triggers a redirect, it uses the locale-aware `redirect` from `lib/i18n/navigation.ts` to preserve the locale prefix. The `intlMiddleware` then handles locale detection and prefix normalization.

### 5. `app/[locale]/layout.tsx` — Root locale layout

```typescript
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ClerkProvider } from '@clerk/nextjs'
import { routing, localeDir } from '@/i18n/routing'
import { Plus_Jakarta_Sans, DM_Mono, DM_Sans } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from '@/app/components/ThemeProvider'

// Font declarations (same as current layout.tsx)
const plusJakarta = Plus_Jakarta_Sans({ ... variable: '--font-syne', ... })
const dmMono = DM_Mono({ ... variable: '--font-dm-mono', ... })
const dmSans = DM_Sans({ ... variable: '--font-dm-sans', ... })

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

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = localeDir[locale] ?? 'ltr'

  return (
    <ClerkProvider
      signInUrl={`/${locale === 'fr' ? '' : locale + '/'}sign-in`}
      signUpUrl={`/${locale === 'fr' ? '' : locale + '/'}sign-up`}
      afterSignInUrl={`/${locale === 'fr' ? '' : locale + '/'}dashboard`}
      afterSignUpUrl={`/${locale === 'fr' ? '' : locale + '/'}onboarding`}
      appearance={{ variables: { colorPrimary: '#C8F135', ... } }}
    >
      <html
        lang={locale}
        dir={dir}
        className={`${plusJakarta.variable} ${dmMono.variable} ${dmSans.variable}`}
        suppressHydrationWarning
      >
        <body className="antialiased">
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

**Note**: The existing `app/layout.tsx` becomes a minimal shell (no `<html>` tag) or is removed entirely, with `app/[locale]/layout.tsx` taking over as the root layout for all locale-aware routes.

### 6. `LocaleSwitcher` Component

```typescript
// app/components/ui/LocaleSwitcher.tsx
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n/navigation'
import { routing } from '@/i18n/routing'

const LOCALE_LABELS: Record<string, { short: string; full: string; ariaLabel: string }> = {
  fr: { short: 'FR', full: 'Français',  ariaLabel: 'Passer en français' },
  en: { short: 'EN', full: 'English',   ariaLabel: 'Switch to English' },
  es: { short: 'ES', full: 'Español',   ariaLabel: 'Cambiar a español' },
}

interface LocaleSwitcherProps {
  compact?: boolean  // true when sidebar is collapsed
}

export default function LocaleSwitcher({ compact = false }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div role="group" aria-label="Language switcher">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          aria-label={LOCALE_LABELS[loc].ariaLabel}
          aria-pressed={loc === locale}
          className={...}
        >
          {compact ? LOCALE_LABELS[loc].short : LOCALE_LABELS[loc].full}
        </button>
      ))}
    </div>
  )
}
```

`router.replace(pathname, { locale: nextLocale })` is the next-intl v3 API for locale-aware navigation that preserves the current path segment.

---

## Data Models

### Message Catalog Structure

Each locale has a single JSON file at `messages/{locale}.json`. The top-level keys are namespaces.

```json
// messages/fr.json (canonical — en.json and es.json mirror this structure)
{
  "common": {
    "continue": "Continuer",
    "skip": "Passer",
    "back": "Retour",
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "signOut": "Se déconnecter",
    "themeLight": "Mode clair",
    "themeDark": "Mode sombre",
    "getStarted": "Commencer →",
    "newStack": "+ Nouveau stack"
  },
  "landing": {
    "nav": {
      "features": "Fonctionnalités",
      "pricing": "Tarifs",
      "signIn": "Se connecter",
      "signUp": "Essayer gratuitement"
    },
    "hero": {
      "title": "Construis le stack parfait.\nGagne plus.",
      "subtitle": "Tu décris ton objectif. Raspquery analyse 200+ agents IA et t'assemble le combo exact pour maximiser ton ROI.",
      "cta": "Générer mon stack →",
      "ctaSecondary": "Voir comment ça marche"
    },
    "features": { ... },
    "howItWorks": { ... },
    "pricing": { ... },
    "socialProof": { ... },
    "cta": { ... },
    "footer": { ... }
  },
  "onboarding": {
    "stepOf": "Étape {current} sur {total}",
    "steps": {
      "role": {
        "question": "Quel est ton rôle ?",
        "subtitle": "Aide-nous à personnaliser ton expérience"
      },
      "sector": {
        "question": "Dans quel secteur travailles-tu ?",
        "subtitle": "On adaptera les recommandations à ton domaine"
      },
      "team_size": {
        "question": "Quelle est la taille de ton équipe ?",
        "subtitle": "On te suggérera des outils qui évoluent avec toi"
      },
      "budget": {
        "question": "Quel est ton budget mensuel pour les outils IA ?",
        "subtitle": "On ne recommandera que ce qui rentre dans ton budget"
      },
      "main_goal": {
        "question": "Quel est ton objectif n°1 ?",
        "subtitle": "On construira ton stack autour de ça"
      },
      "referral_source": {
        "question": "Comment nous as-tu trouvés ?",
        "subtitle": "Juste par curiosité — 2 secondes"
      }
    },
    "options": {
      "role": {
        "founder": "Fondateur / CEO",
        "marketing": "Responsable Marketing",
        "ecommerce": "Responsable E-commerce",
        "freelancer": "Freelance",
        "developer": "Développeur",
        "contentCreator": "Créateur de contenu",
        "sales": "Responsable Commercial",
        "other": "Autre"
      },
      "sector": { ... },
      "team_size": { ... },
      "budget": { ... },
      "main_goal": { ... },
      "referral_source": { ... }
    },
    "otherPlaceholder": "Précise...",
    "getStarted": "C'est parti →",
    "error": "Une erreur est survenue. Réessaie."
  },
  "dashboard": {
    "greeting": "Bonjour, {name}",
    "nav": {
      "dashboard": "Dashboard",
      "recommend": "Construis ton stack",
      "blueprint": "StackMap",
      "stacks": "Mes stacks",
      "roi": "ROI Tracker",
      "alerts": "Stack Alerts",
      "score": "Stack Score",
      "settings": "Paramètres",
      "billing": "Facturation",
      "account": "Mon compte"
    },
    "sidebar": {
      "collapse": "Réduire la sidebar",
      "expand": "Ouvrir la sidebar"
    },
    "metrics": {
      "activeStacks": "Stacks actifs",
      "monthlyCost": "Coût mensuel",
      "avgRoi": "ROI moyen",
      "avgScore": "Score moyen",
      "roiTooltip": "Le ROI estime le gain financier par rapport au coût mensuel de tes stacks.",
      "scoreTooltip": "Évalue la qualité globale de tes stacks : fiabilité, popularité et adéquation avec tes besoins."
    },
    "emptyState": {
      "title": "Ton premier stack t'attend",
      "description": "Décris ton activité en une phrase — on analyse 200+ agents IA et on te livre un stack sur-mesure avec ROI estimé, coûts et guides d'implémentation.",
      "cta": "Générer mon stack →"
    },
    "latestStack": {
      "label": "Dernier stack",
      "viewLink": "Voir →",
      "cost": "Coût",
      "roi": "ROI",
      "score": "Score",
      "empty": "Aucun stack."
    },
    "allStacks": {
      "label": "Tous tes stacks",
      "manageLink": "Gérer →"
    },
    "recommend": { ... },
    "blueprint": { ... },
    "stack": { ... },
    "alerts": { ... },
    "score": { ... },
    "billing": { ... },
    "settings": { ... },
    "account": { ... },
    "roi": { ... }
  },
  "metadata": {
    "home": {
      "title": "Raspquery — La plateforme IA qui maximise ton ROI",
      "description": "Tu décris ton objectif. Raspquery analyse 200+ agents IA et t'assemble le combo exact pour maximiser ton ROI."
    },
    "dashboard": {
      "title": "Dashboard",
      "description": "Gérez vos stacks IA et suivez votre ROI."
    }
  }
}
```

**ICU interpolation examples**:
- `"greeting": "Bonjour, {name}"` → `t('greeting', { name: firstName })`
- `"stepOf": "Étape {current} sur {total}"` → `t('stepOf', { current: 1, total: 6 })`
- `"activeStacks": "{count, plural, one {# stack actif} other {# stacks actifs}}"` → `t('activeStacks', { count: 3 })`

### Locale Configuration Model

```typescript
// i18n/routing.ts
type SupportedLocale = 'fr' | 'en' | 'es'

interface LocaleConfig {
  locales: SupportedLocale[]
  defaultLocale: SupportedLocale
  localePrefix: 'as-needed' | 'always' | 'never'
}

// Direction map — separate from routing config for clarity
type LocaleDir = Record<SupportedLocale | string, 'ltr' | 'rtl'>
```

### OpenGraph Locale Mapping

```typescript
const OG_LOCALE_MAP: Record<string, string> = {
  fr: 'fr_FR',
  en: 'en_US',
  es: 'es_ES',
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The project already has `fast-check` in `devDependencies` and `vitest` as the test runner, so property-based tests will use `fast-check` with `vitest`.

### Property 1: Non-default locale URLs always carry a prefix

*For any* path string and any non-default locale (`en` or `es`), the locale-aware `redirect` function should produce a URL that starts with `/{locale}`.

**Validates: Requirements 1.3, 2.2, 8.3**

### Property 2: `getRequestConfig` returns messages matching the requested locale

*For any* supported locale, calling `getRequestConfig` with that locale should return a messages object whose top-level namespace keys are non-empty and whose locale field matches the input locale.

**Validates: Requirements 1.5, 4.6**

### Property 3: Middleware matcher excludes API routes and static assets

*For any* path that starts with `/api/`, `/_next/static`, `/_next/image`, or ends with a static asset extension (`.png`, `.svg`, `.ico`, `.woff2`, etc.), the middleware `config.matcher` pattern should NOT match that path.

**Validates: Requirements 2.4, 12.1, 12.3**

### Property 4: Unauthenticated dashboard requests redirect with locale preserved

*For any* supported locale, a simulated unauthenticated request to `/{locale}/dashboard` (or `/dashboard` for `fr`) should produce a redirect response whose `Location` header contains the same locale prefix.

**Validates: Requirements 2.3, 11.1**

### Property 5: `[locale]` layout sets `lang` and `dir` from configuration

*For any* supported locale, rendering the `[locale]` layout should produce an `<html>` element where `lang` equals the locale string and `dir` equals the value from `localeDir[locale]`.

**Validates: Requirements 3.5, 9.2**

### Property 6: `generateStaticParams` covers all and only supported locales

*For any* call to `generateStaticParams`, the returned array should contain exactly one entry per supported locale, with no duplicates and no missing locales.

**Validates: Requirements 3.7**

### Property 7: Message catalog key completeness across locales

*For any* key path present in `messages/fr.json`, the same key path should exist in `messages/en.json` and `messages/es.json` with a non-empty string value.

**Validates: Requirements 4.6, 13.5**

### Property 8: ICU variable interpolation produces output containing the variable value

*For any* ICU message template containing a named variable `{varName}` and any non-empty string value for that variable, calling `t(key, { varName: value })` should produce a string that contains `value`.

**Validates: Requirements 4.8, 5.4**

### Property 9: `generateMetadata` returns locale-specific title and description

*For any* two distinct supported locales, `generateMetadata` called with each locale should return different `title` and `description` values (i.e., the metadata is not locale-invariant).

**Validates: Requirements 5.2, 10.3**

### Property 10: Sitemap contains entries for all locale × public-page combinations

*For any* supported locale and any public page path (`/`, `/sign-in`, `/sign-up`), the sitemap returned by `sitemap()` should contain an entry whose `url` includes the locale-prefixed version of that path.

**Validates: Requirements 10.4**

### Property 11: OpenGraph locale field matches expected format for each locale

*For any* supported locale, `generateMetadata` should return `openGraph.locale` equal to the expected OG locale string (`fr_FR`, `en_US`, or `es_ES`).

**Validates: Requirements 10.5**

### Property 12: `LocaleSwitcher` navigation preserves current path segment

*For any* current pathname and any target locale, calling the `LocaleSwitcher`'s navigation handler should produce a navigation call with the same pathname and the new locale — not a root redirect.

**Validates: Requirements 7.2**

### Property 13: `ClerkProvider` locale-aware URLs include correct locale prefix

*For any* supported locale rendered in the `[locale]` layout, the `ClerkProvider`'s `signInUrl`, `signUpUrl`, `afterSignInUrl`, and `afterSignUpUrl` props should each contain the correct locale prefix (empty for `fr`, `/{locale}/` for `en` and `es`).

**Validates: Requirements 11.2, 11.5**

### Property 14: RTL configuration drives `dir` attribute without layout changes

*For any* locale added to `localeDir` with value `'rtl'`, rendering the `[locale]` layout for that locale should produce `dir="rtl"` on the `<html>` element — without modifying the layout component itself.

**Validates: Requirements 9.3, 9.4**

### Property 15: API error responses use locale-neutral keys

*For any* API route error response body, the `error` field should be a string that contains no French-language words (i.e., it should be a locale-neutral code or English key).

**Validates: Requirements 12.2**

---

## Error Handling

### Missing Locale in URL

If a request arrives with an unrecognized locale prefix (e.g., `/de/dashboard`), the next-intl middleware falls back to the default locale (`fr`) and serves the French content. The `[locale]` layout additionally calls `notFound()` if the locale param is not in `routing.locales`, providing a clean 404 rather than a broken render.

### Missing Translation Key

next-intl's `onError` and `getMessageFallback` hooks in `i18n/request.ts` are configured to:
1. Log a warning in development when a key is missing.
2. Return the `fr` (default) value as fallback in production.
3. Never throw or render an empty string for a missing key.

```typescript
// i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  // ...
  return {
    locale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[next-intl]', error.message)
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join('.')
      if (error.code === 'MISSING_MESSAGE') {
        return path // Return the key path as fallback
      }
      return path
    },
  }
})
```

### Clerk Auth Errors in Locale Context

If `auth()` or `currentUser()` throws inside a Server Component under `app/[locale]/`, the error propagates normally to Next.js's error boundary (`app/error.tsx`). The i18n layer does not intercept Clerk errors. The existing `try/catch` pattern in `dashboard/page.tsx` is preserved.

### Hydration Mismatches

The `suppressHydrationWarning` attribute on `<html>` (already present) handles theme-related hydration differences. No additional `suppressHydrationWarning` attributes are added for i18n purposes. The `lang` and `dir` attributes are set server-side and are stable, so they do not cause hydration mismatches.

### `next.config.js` Plugin Composition

The `withNextIntl` plugin wraps `nextConfig` before `withSentryConfig` wraps the result:

```javascript
const withNextIntl = require('next-intl/plugin')('./i18n/request.ts')

const nextConfig = { images: { ... } }

module.exports = withSentryConfig(
  withNextIntl(nextConfig),
  { org: ..., project: ..., ... }
)
```

This ordering ensures next-intl's webpack/Turbopack aliases are applied before Sentry's source map instrumentation.

---

## Testing Strategy

### Unit Tests (Vitest)

Unit tests cover specific examples, edge cases, and component rendering:

- `i18n/routing.ts`: verify `locales`, `defaultLocale`, `localePrefix`, and `localeDir` values.
- `lib/i18n/navigation.ts`: verify all four exports (`Link`, `redirect`, `useRouter`, `usePathname`) are exported.
- `LocaleSwitcher`: render tests for expanded/compact states, active locale display, aria-labels.
- `[locale]/layout.tsx`: render test verifying `NextIntlClientProvider` is in the tree.
- `generateMetadata` functions: example tests for each locale.
- Middleware matcher: example tests for specific paths (API routes, static assets, locale paths).

### Property-Based Tests (fast-check + Vitest)

Property tests use `fast-check` to verify the 15 correctness properties defined above. Each test runs a minimum of 100 iterations.

Tag format for each test: `// Feature: i18n-multilingual-support, Property {N}: {property_text}`

Example structure:

```typescript
import fc from 'fast-check'
import { test, expect } from 'vitest'
import { routing, localeDir } from '@/i18n/routing'

// Feature: i18n-multilingual-support, Property 1: Non-default locale URLs always carry a prefix
test('Property 1: non-default locale redirect includes locale prefix', () => {
  const nonDefaultLocales = routing.locales.filter(l => l !== routing.defaultLocale)
  fc.assert(
    fc.property(
      fc.constantFrom(...nonDefaultLocales),
      fc.webSegment().map(s => '/' + s),
      (locale, path) => {
        const result = buildLocalizedUrl(locale, path, routing)
        expect(result).toMatch(new RegExp(`^/${locale}`))
      }
    ),
    { numRuns: 100 }
  )
})
```

### Integration Tests

- Middleware integration: verify Clerk + next-intl middleware chain handles auth redirects correctly with locale preservation (uses mock `NextRequest`).
- `getRequestConfig`: verify it loads the correct JSON file for each locale.
- `ClerkProvider` props: verify locale-aware URLs are correctly constructed for each locale.

### Smoke Tests / Static Analysis

- Verify `messages/fr.json`, `messages/en.json`, `messages/es.json` exist and parse as valid JSON.
- Grep check: no hardcoded French strings remain in files under `app/[locale]/` after migration.
- Build check: `next build` succeeds with both `withNextIntl` and `withSentryConfig` applied.

### Test File Locations

```
stackai/
  __tests__/
    i18n/
      routing.test.ts          ← Properties 1, 2, 6, 14
      middleware.test.ts        ← Properties 3, 4
      messages.test.ts          ← Properties 7, 8
      metadata.test.ts          ← Properties 9, 10, 11
      navigation.test.ts        ← Property 12
      clerk-urls.test.ts        ← Property 13
      layout.test.ts            ← Property 5
      api-errors.test.ts        ← Property 15
```
