# Implementation Plan: i18n Multilingual Support

## Overview

Incrementally add `next-intl` v3 to the Raspquery Next.js 14 App Router project, supporting three locales — French (`fr`, default, no prefix), English (`en`, `/en/`), and Spanish (`es`, `/es/`) — while preserving Clerk auth, Supabase queries, Sentry instrumentation, and Turbopack compatibility. The migration proceeds in layers: infrastructure → routing → message catalogs → directory restructure → component translation → locale switcher → SEO → tests.

## Tasks

- [x] 1. Install next-intl and set up core configuration files
  - Run `npm install next-intl` to add the dependency to `stackai/package.json`
  - Create `stackai/i18n/routing.ts` with `defineRouting({ locales: ['fr','en','es'], defaultLocale: 'fr', localePrefix: 'as-needed' })` and the `localeDir` map (`{ fr: 'ltr', en: 'ltr', es: 'ltr' }`)
  - Create `stackai/i18n/request.ts` with `getRequestConfig` that resolves the locale, validates it against `routing.locales`, falls back to `'fr'`, dynamically imports `messages/{locale}.json`, and configures `onError` / `getMessageFallback` for missing-key handling
  - Create `stackai/lib/i18n/navigation.ts` exporting `{ Link, redirect, usePathname, useRouter }` via `createNavigation(routing)`
  - Update `stackai/next.config.js` (or `next.config.mjs`) to wrap `nextConfig` with `withNextIntl('./i18n/request.ts')` before the existing `withSentryConfig` wrapper
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1_

  - [ ]* 1.1 Write property test for routing configuration (Property 6)
    - **Property 6: `generateStaticParams` covers all and only supported locales**
    - **Validates: Requirements 3.7**
    - File: `stackai/__tests__/i18n/routing.test.ts`
    - Verify `routing.locales` has exactly 3 entries with no duplicates and that `generateStaticParams` returns one entry per locale

  - [ ]* 1.2 Write property test for non-default locale URL prefix (Property 1)
    - **Property 1: Non-default locale URLs always carry a prefix**
    - **Validates: Requirements 1.3, 2.2, 8.3**
    - File: `stackai/__tests__/i18n/routing.test.ts`
    - Use `fc.constantFrom(...nonDefaultLocales)` and `fc.webSegment()` to assert every built URL starts with `/{locale}`

  - [ ]* 1.3 Write property test for RTL configuration (Property 14)
    - **Property 14: RTL configuration drives `dir` attribute without layout changes**
    - **Validates: Requirements 9.3, 9.4**
    - File: `stackai/__tests__/i18n/routing.test.ts`
    - Assert that adding a locale with `'rtl'` to `localeDir` causes the layout to render `dir="rtl"` without modifying the layout component

- [x] 2. Update middleware to combine Clerk and next-intl
  - Rewrite `stackai/middleware.ts` to compose `clerkMiddleware` (runs first for auth checks) with `createMiddleware(routing)` (runs after for locale detection/redirect)
  - Define `isProtectedRoute` matcher covering `/dashboard(.*)`, `/en/dashboard(.*)`, `/es/dashboard(.*)`
  - Define `isPublicRoute` matcher covering `/`, `/en`, `/es`, sign-in/sign-up paths for all locales, onboarding paths, and webhook routes
  - Set `config.matcher` to exclude `_next/static`, `_next/image`, `/api/`, and static asset extensions (`.ico`, `.png`, `.svg`, `.jpg`, `.webp`, `.woff2`)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.1, 11.3, 12.1, 12.3_

  - [ ]* 2.1 Write property test for middleware matcher exclusions (Property 3)
    - **Property 3: Middleware matcher excludes API routes and static assets**
    - **Validates: Requirements 2.4, 12.1, 12.3**
    - File: `stackai/__tests__/i18n/middleware.test.ts`
    - Use `fc.oneof(fc.constant('/api/test'), fc.webSegment().map(s => '/_next/static/' + s))` to assert the matcher regex does NOT match those paths

  - [ ]* 2.2 Write property test for unauthenticated dashboard redirect with locale (Property 4)
    - **Property 4: Unauthenticated dashboard requests redirect with locale preserved**
    - **Validates: Requirements 2.3, 11.1**
    - File: `stackai/__tests__/i18n/middleware.test.ts`
    - Simulate unauthenticated requests to `/{locale}/dashboard` for each locale and assert the redirect `Location` header contains the same locale prefix

- [x] 3. Create message catalogs for all three locales
  - Create `stackai/messages/fr.json` as the canonical catalog with all namespaces: `common`, `landing` (nav, hero, features, howItWorks, pricing, socialProof, cta, footer), `onboarding` (stepOf, steps for all 6 steps, options for all steps, otherPlaceholder, getStarted, error), `dashboard` (greeting with `{name}` ICU, nav, sidebar, metrics with pluralization, emptyState, latestStack, allStacks, recommend, blueprint, stack, alerts, score, billing, settings, account, roi), `metadata` (home, dashboard, and all sub-pages)
  - Create `stackai/messages/en.json` mirroring the exact key structure of `fr.json` with English translations for every key
  - Create `stackai/messages/es.json` mirroring the exact key structure of `fr.json` with Spanish translations for every key
  - Ensure ICU interpolation patterns are consistent across all three files (e.g., `"greeting": "Hello, {name}"` in `en.json`)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 13.1, 13.2, 13.3, 13.5_

  - [ ]* 3.1 Write property test for message catalog key completeness (Property 7)
    - **Property 7: Message catalog key completeness across locales**
    - **Validates: Requirements 4.6, 13.5**
    - File: `stackai/__tests__/i18n/messages.test.ts`
    - Recursively collect all key paths from `fr.json` and assert each path exists with a non-empty string value in `en.json` and `es.json`

  - [ ]* 3.2 Write property test for ICU variable interpolation (Property 8)
    - **Property 8: ICU variable interpolation produces output containing the variable value**
    - **Validates: Requirements 4.8, 5.4**
    - File: `stackai/__tests__/i18n/messages.test.ts`
    - Use `fc.string({ minLength: 1 })` for variable values and assert `t(key, { varName: value })` output contains `value`

  - [ ]* 3.3 Write property test for `getRequestConfig` locale resolution (Property 2)
    - **Property 2: `getRequestConfig` returns messages matching the requested locale**
    - **Validates: Requirements 1.5, 4.6**
    - File: `stackai/__tests__/i18n/routing.test.ts`
    - For each supported locale, call `getRequestConfig` and assert the returned `locale` field matches the input and `messages` has non-empty top-level keys

- [x] 4. Restructure app directory to `app/[locale]/`
  - Create `stackai/app/[locale]/` directory and move `app/layout.tsx` → `app/[locale]/layout.tsx`
  - Move `app/page.tsx` → `app/[locale]/page.tsx`
  - Move `app/onboarding/` → `app/[locale]/onboarding/`
  - Move `app/dashboard/` → `app/[locale]/dashboard/` (including all sub-routes: recommend, blueprint, stack, alerts, score, billing, settings, account, roi)
  - Leave `app/api/`, `app/sign-in/`, `app/sign-up/`, `app/globals.css`, `app/favicon.ico`, `app/robots.ts`, `app/sitemap.ts`, `app/error.tsx`, `app/not-found.tsx` at the `app/` root
  - Create a minimal `app/layout.tsx` shell (no `<html>` tag) that simply renders `{children}` if Next.js requires a root layout outside `[locale]`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update `app/[locale]/layout.tsx` with locale-aware providers
  - Add `generateStaticParams` export returning `routing.locales.map(locale => ({ locale }))`
  - Add locale validation: call `notFound()` if `params.locale` is not in `routing.locales`
  - Set `lang={locale}` and `dir={localeDir[locale] ?? 'ltr'}` on the `<html>` element
  - Wrap the tree with `NextIntlClientProvider messages={await getMessages()}`
  - Update `ClerkProvider` with locale-aware `signInUrl`, `signUpUrl`, `afterSignInUrl`, `afterSignUpUrl` props (empty prefix for `fr`, `/{locale}/` for `en`/`es`)
  - Preserve existing font variables (`--font-syne`, `--font-dm-mono`, `--font-dm-sans`), `ThemeProvider`, and `suppressHydrationWarning` on `<html>`
  - _Requirements: 3.5, 3.6, 3.7, 9.1, 9.2, 9.3, 11.2, 11.5_

  - [ ]* 5.1 Write property test for layout `lang` and `dir` attributes (Property 5)
    - **Property 5: `[locale]` layout sets `lang` and `dir` from configuration**
    - **Validates: Requirements 3.5, 9.2**
    - File: `stackai/__tests__/i18n/layout.test.ts`
    - Render the layout for each locale and assert `html[lang]` equals the locale and `html[dir]` equals `localeDir[locale]`

  - [ ]* 5.2 Write property test for ClerkProvider locale-aware URLs (Property 13)
    - **Property 13: `ClerkProvider` locale-aware URLs include correct locale prefix**
    - **Validates: Requirements 11.2, 11.5**
    - File: `stackai/__tests__/i18n/clerk-urls.test.ts`
    - For each locale, assert `signInUrl`, `signUpUrl`, `afterSignInUrl`, `afterSignUpUrl` contain the correct prefix (none for `fr`, `/{locale}/` for others)

- [x] 6. Update Server Components to use `getTranslations`
  - Update `app/[locale]/page.tsx` (landing): replace all hardcoded strings with `const t = await getTranslations('landing')` calls; add `generateMetadata` using `getTranslations('metadata')` returning locale-specific title/description
  - Update `app/[locale]/dashboard/page.tsx`: replace hardcoded strings (greeting, metric labels, empty state, stack labels) with `getTranslations('dashboard')` calls; use ICU pattern `t('greeting', { name: firstName })`
  - Update `app/[locale]/onboarding/page.tsx`: replace all step questions, subtitles, option labels, and error messages with `getTranslations('onboarding')` calls
  - Update all dashboard sub-page Server Components (`recommend`, `blueprint`, `stack`, `alerts`, `score`, `billing`, `settings`, `account`, `roi`) to use `getTranslations` for their respective namespaces
  - Replace `import { redirect } from 'next/navigation'` with `import { redirect } from '@/lib/i18n/navigation'` in all Server Components under `app/[locale]/`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.2, 8.3, 13.1_

  - [ ]* 6.1 Write property test for `generateMetadata` locale-specific output (Property 9)
    - **Property 9: `generateMetadata` returns locale-specific title and description**
    - **Validates: Requirements 5.2, 10.3**
    - File: `stackai/__tests__/i18n/metadata.test.ts`
    - For any two distinct locales, assert `generateMetadata` returns different `title` and `description` values

  - [ ]* 6.2 Write property test for OpenGraph locale field (Property 11)
    - **Property 11: OpenGraph locale field matches expected format for each locale**
    - **Validates: Requirements 10.5**
    - File: `stackai/__tests__/i18n/metadata.test.ts`
    - Assert `generateMetadata` returns `openGraph.locale` equal to `fr_FR`, `en_US`, or `es_ES` for each respective locale

- [x] 7. Update Client Components to use `useTranslations`
  - Update `app/[locale]/dashboard/layout.tsx`: replace hardcoded nav labels (`'Construis ton stack'`, `'Paramètres'`, `'Facturation'`, etc.) with `useTranslations('dashboard')` calls; replace user menu strings (`'Mode clair'`, `'Mode sombre'`, `'Se déconnecter'`) with `useTranslations('common')` calls; replace `import { usePathname, useRouter } from 'next/navigation'` and `import Link from 'next/link'` with imports from `@/lib/i18n/navigation`; update `router.push('/onboarding')` to use locale-aware router
  - Update all Client Components in `app/components/dashboard/` (`MetricCard`, `OnboardingBanner`, `StackUpdatesFeed`, `WelcomeToast`) to use `useTranslations` for their hardcoded strings
  - Update all Client Components in `app/components/` (landing page components: `Navbar`, `Hero`, `Features`, `HowItWorks`, `Pricing`, `SocialProof`, `CTA`, `Footer`) to use `useTranslations('landing')`
  - Replace all `import Link from 'next/link'` and `import { useRouter, usePathname } from 'next/navigation'` in components under `app/[locale]/` with imports from `@/lib/i18n/navigation`
  - Preserve all existing `suppressHydrationWarning` attributes; do not add new ones for i18n
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.2, 8.4, 13.2, 13.3_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create `LocaleSwitcher` component and integrate it
  - Create `stackai/app/components/ui/LocaleSwitcher.tsx` as a `'use client'` component
  - Implement `useLocale()` to read the active locale, `useRouter` and `usePathname` from `@/lib/i18n/navigation` for locale-aware navigation
  - Implement `handleChange(nextLocale)` calling `router.replace(pathname, { locale: nextLocale })`
  - Accept a `compact?: boolean` prop: when `true`, render locale code only (`FR`, `EN`, `ES`); when `false`, render full language name
  - Add `aria-label` in the target language for each button (e.g., `"Switch to English"`, `"Cambiar a español"`) and `aria-pressed` for the active locale
  - Integrate `LocaleSwitcher` into `app/[locale]/dashboard/layout.tsx` sidebar (pass `compact={collapsed}`)
  - Integrate `LocaleSwitcher` into the landing page `Navbar` component
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 9.1 Write property test for LocaleSwitcher path preservation (Property 12)
    - **Property 12: `LocaleSwitcher` navigation preserves current path segment**
    - **Validates: Requirements 7.2**
    - File: `stackai/__tests__/i18n/navigation.test.ts`
    - Use `fc.webSegment()` to generate arbitrary pathnames and assert `router.replace` is called with the same pathname and the new locale

- [x] 10. Update `generateMetadata` and sitemap for SEO localization
  - Update `generateMetadata` in `app/[locale]/page.tsx` and all dashboard sub-pages to include `alternates.languages` with hreflang entries for all locales (including `x-default` pointing to the `fr` URL) and set `openGraph.locale` using the `OG_LOCALE_MAP` (`fr_FR`, `en_US`, `es_ES`)
  - Update `app/sitemap.ts` to generate entries for all supported locales × public pages, producing locale-prefixed URLs for `en`/`es` and bare URLs for `fr`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 10.1 Write property test for sitemap locale coverage (Property 10)
    - **Property 10: Sitemap contains entries for all locale × public-page combinations**
    - **Validates: Requirements 10.4**
    - File: `stackai/__tests__/i18n/metadata.test.ts`
    - For each locale and each public page path, assert the sitemap array contains an entry whose `url` includes the locale-prefixed path

- [-] 11. Update API routes to use locale-neutral error keys
  - Audit all files under `app/api/` for hardcoded French error strings in JSON responses
  - Replace French error strings (e.g., `"Une erreur est survenue"`) with locale-neutral English keys or error codes (e.g., `"INTERNAL_ERROR"`, `"UNAUTHORIZED"`)
  - Do not apply locale routing or `next-intl` imports to any file under `app/api/`
  - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 11.1 Write property test for API error response locale neutrality (Property 15)
    - **Property 15: API error responses use locale-neutral keys**
    - **Validates: Requirements 12.2**
    - File: `stackai/__tests__/i18n/api-errors.test.ts`
    - For each API route error response, assert the `error` field contains no French-language words (test against a list of common French words)

- [ ] 12. Final checkpoint — Ensure all tests pass and build succeeds
  - Run `npx vitest run` in `stackai/` and confirm all property-based and unit tests pass
  - Run `next build` in `stackai/` and confirm the build succeeds with both `withNextIntl` and `withSentryConfig` applied
  - Verify `messages/fr.json`, `messages/en.json`, `messages/es.json` exist and parse as valid JSON
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` with `vitest` — `fast-check` is already in `devDependencies`
- Test files live under `stackai/__tests__/i18n/`
- The `fr` default locale has no URL prefix; `en` and `es` use `/en/` and `/es/` prefixes
- API routes under `app/api/` are never moved into `[locale]` and never import from `next-intl`
- `sign-in/` and `sign-up/` Clerk routes stay outside `[locale]` but are referenced with locale-aware URLs in `ClerkProvider` props
- Checkpoints at tasks 8 and 12 ensure incremental validation before and after the locale switcher and SEO work
