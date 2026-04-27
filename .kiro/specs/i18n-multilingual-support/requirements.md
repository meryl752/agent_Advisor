# Requirements Document

## Introduction

This document defines the requirements for adding internationalization (i18n) and multilingual support to Raspquery (stackai), a Next.js 14 App Router application. The project is currently fully in French with hardcoded strings throughout all pages and components. The goal is to introduce `next-intl` to support three locales — French (`fr`, default), English (`en`), and Spanish (`es`) — across both public pages (landing, onboarding) and the authenticated dashboard, while preserving compatibility with Clerk authentication middleware, Turbopack, and the existing App Router architecture.

The routing strategy uses locale prefixes for non-default locales: French URLs remain unchanged (e.g., `/dashboard`), while English and Spanish use a prefix (e.g., `/en/dashboard`, `/es/dashboard`). The architecture must also accommodate future RTL language support without requiring a structural rewrite.

## Glossary

- **I18n_System**: The `next-intl` library and its configuration layer responsible for locale detection, message loading, and translation rendering.
- **Locale**: A language/region identifier (`fr`, `en`, `es`). French (`fr`) is the default locale.
- **Message_Catalog**: A JSON file per locale (e.g., `messages/fr.json`) containing all translatable strings organized by namespace.
- **Namespace**: A logical grouping of translation keys within a Message_Catalog (e.g., `dashboard`, `landing`, `onboarding`, `common`).
- **Locale_Prefix**: The URL path segment indicating a non-default locale (e.g., `/en/`, `/es/`). The default locale (`fr`) has no prefix.
- **Routing_Middleware**: The Next.js middleware file (`middleware.ts`) that handles both Clerk authentication and `next-intl` locale detection/redirection.
- **i18n_Provider**: The `NextIntlClientProvider` component that makes translations available to Client Components.
- **RTL**: Right-to-left text direction, required by languages such as Arabic or Hebrew. Not needed now but the architecture must support it.
- **Hardcoded_String**: A UI string literal embedded directly in a `.tsx` or `.ts` source file rather than referenced from a Message_Catalog.
- **suppressHydrationWarning**: A React prop already applied on certain elements in the project to suppress hydration mismatches caused by browser translation extensions.
- **Clerk**: The authentication provider used by Raspquery, integrated via `@clerk/nextjs`.
- **Dashboard**: The authenticated area of the application, accessible at `/dashboard` and its sub-routes.
- **Public_Pages**: Unauthenticated pages: the landing page (`/`) and the onboarding flow (`/onboarding`).

---

## Requirements

### Requirement 1: i18n Infrastructure Setup

**User Story:** As a developer, I want a properly configured `next-intl` infrastructure, so that the application can load and serve locale-specific translations without breaking the existing Next.js 14 App Router and Clerk middleware setup.

#### Acceptance Criteria

1. THE I18n_System SHALL support exactly three locales: `fr`, `en`, and `es`.
2. THE I18n_System SHALL treat `fr` as the default locale, serving it without a URL Locale_Prefix.
3. THE I18n_System SHALL serve non-default locales (`en`, `es`) under their respective Locale_Prefix (e.g., `/en/dashboard`, `/es/dashboard`).
4. THE I18n_System SHALL load Message_Catalogs from a `messages/` directory at the project root, with one JSON file per locale (`messages/fr.json`, `messages/en.json`, `messages/es.json`).
5. THE I18n_System SHALL expose a `getRequestConfig` function (via `i18n/request.ts`) that resolves the active locale and returns the corresponding Message_Catalog for each server-side request.
6. WHEN the `next-intl` plugin is applied in `next.config.js`, THE I18n_System SHALL remain compatible with the existing Sentry configuration wrapping (`withSentryConfig`).
7. THE I18n_System SHALL be compatible with Turbopack (used via `next dev`).

### Requirement 2: Routing Middleware Integration

**User Story:** As a developer, I want a single `middleware.ts` that handles both Clerk authentication and `next-intl` locale routing, so that protected routes remain secure and locale detection works correctly for all pages.

#### Acceptance Criteria

1. THE Routing_Middleware SHALL integrate `next-intl`'s `createMiddleware` (or `createNavigation`) with Clerk's `clerkMiddleware` in a single `middleware.ts` file at the project root.
2. WHEN a request arrives without a Locale_Prefix and the locale is not `fr`, THE Routing_Middleware SHALL redirect the request to the appropriate prefixed URL.
3. WHEN a request arrives for a protected Dashboard route without a valid Clerk session, THE Routing_Middleware SHALL redirect the user to the sign-in page, preserving the locale prefix in the redirect URL.
4. THE Routing_Middleware SHALL apply to all routes except Next.js internals (`_next/static`, `_next/image`), API routes (`/api/`), and static assets (`.ico`, `.png`, `.svg`, `.jpg`, `.webp`, `.woff2`).
5. THE Routing_Middleware SHALL NOT interfere with Clerk webhook routes (`/api/auth/webhook`) or Stripe webhook routes (`/api/stripe/webhook`).
6. WHEN a request arrives with an unsupported locale prefix, THE Routing_Middleware SHALL fall back to the default locale (`fr`).

### Requirement 3: App Router Directory Structure Reorganization

**User Story:** As a developer, I want the App Router directory structure reorganized to support locale-based routing, so that `next-intl` can inject the active locale into all page and layout components via the `[locale]` dynamic segment.

#### Acceptance Criteria

1. THE I18n_System SHALL use a `[locale]` dynamic segment directory (e.g., `app/[locale]/`) to wrap all routable pages and layouts.
2. THE I18n_System SHALL move the root layout (`app/layout.tsx`), the landing page (`app/page.tsx`), the onboarding flow (`app/onboarding/`), the dashboard layout and all dashboard sub-pages (`app/dashboard/`) under `app/[locale]/`.
3. THE I18n_System SHALL preserve all existing API routes (`app/api/`) outside the `[locale]` segment, as API routes do not require locale handling.
4. THE I18n_System SHALL preserve all existing Clerk auth routes (`app/sign-in/`, `app/sign-up/`) outside the `[locale]` segment, or configure them to work correctly with the locale prefix.
5. WHEN the `[locale]` layout renders, THE I18n_System SHALL set the `lang` attribute on the `<html>` element to the active locale value.
6. WHEN the `[locale]` layout renders, THE I18n_System SHALL wrap the page tree with `NextIntlClientProvider` so that Client Components can access translations.
7. THE I18n_System SHALL generate a `generateStaticParams` export in the `[locale]` layout that returns all supported locales, enabling static generation for locale routes.

### Requirement 4: Message Catalog Structure and Coverage

**User Story:** As a translator, I want all user-visible strings organized in structured JSON Message_Catalogs, so that I can translate the application into English and Spanish without touching source code.

#### Acceptance Criteria

1. THE I18n_System SHALL organize Message_Catalog keys into Namespaces that mirror the application's page/component structure (e.g., `common`, `landing`, `onboarding`, `dashboard`, `dashboard.recommend`, `dashboard.blueprint`, `dashboard.stack`, `dashboard.alerts`, `dashboard.score`, `dashboard.billing`, `dashboard.settings`, `dashboard.account`, `dashboard.roi`).
2. THE I18n_System SHALL include a `common` Namespace covering shared UI strings: navigation labels, action buttons (e.g., "Continue", "Skip", "Back"), error messages, loading states, and theme toggle labels.
3. THE I18n_System SHALL include a `landing` Namespace covering all strings in the Navbar, Hero, Features, HowItWorks, Pricing, SocialProof, CTA, and Footer components.
4. THE I18n_System SHALL include an `onboarding` Namespace covering all step questions, subtitles, option labels, navigation button labels, and error messages in the onboarding flow.
5. THE I18n_System SHALL include a `dashboard` Namespace covering the sidebar navigation labels, user menu items, greeting text, metric card labels, empty state messages, and all dashboard sub-page strings.
6. THE I18n_System SHALL provide complete Message_Catalogs for all three locales (`fr`, `en`, `es`) with no missing keys at initial delivery.
7. IF a translation key is missing in a non-default locale's Message_Catalog, THEN THE I18n_System SHALL fall back to the `fr` (default) locale value for that key rather than rendering an empty string or throwing an error.
8. THE I18n_System SHALL support ICU message format for pluralization and variable interpolation (e.g., `"Bonjour, {name}"`, `"{count} stacks actifs"`).

### Requirement 5: Server Component Translation

**User Story:** As a developer, I want Server Components to access translations using `next-intl`'s server-side API, so that translated content is rendered on the server without client-side hydration overhead.

#### Acceptance Criteria

1. WHEN a Server Component requires translated strings, THE I18n_System SHALL provide the `getTranslations` async function from `next-intl/server` for use in that component.
2. WHEN a Server Component renders page-level metadata (e.g., `<title>`, `<meta description>`), THE I18n_System SHALL provide translated metadata strings via `getTranslations` so that `generateMetadata` exports return locale-aware values.
3. THE I18n_System SHALL replace all Hardcoded_Strings in Server Components with calls to the translation function `t('key')` referencing the appropriate Namespace.
4. WHEN the dashboard `page.tsx` renders the greeting (currently `"Bonjour, {firstName}"`), THE I18n_System SHALL use an ICU interpolation pattern so the name is injected dynamically: `t('greeting', { name: firstName })`.

### Requirement 6: Client Component Translation

**User Story:** As a developer, I want Client Components to access translations using `next-intl`'s client-side hook, so that interactive UI elements display correctly in the user's selected locale.

#### Acceptance Criteria

1. WHEN a Client Component requires translated strings, THE I18n_System SHALL provide the `useTranslations` hook from `next-intl` for use in that component.
2. THE I18n_System SHALL replace all Hardcoded_Strings in Client Components with calls to `t('key')` from the `useTranslations` hook.
3. WHEN the dashboard `layout.tsx` renders sidebar navigation labels (e.g., `"Construis ton stack"`, `"Paramètres"`, `"Facturation"`), THE I18n_System SHALL source these labels from the `dashboard` Namespace.
4. WHEN the dashboard `layout.tsx` renders user menu items (e.g., `"Mode clair"`, `"Mode sombre"`, `"Se déconnecter"`), THE I18n_System SHALL source these strings from the `common` Namespace.
5. WHEN the `recommend/page.tsx` renders reasoning step labels, suggestion chips, and agent task log labels, THE I18n_System SHALL source these strings from the `dashboard.recommend` Namespace.
6. THE I18n_System SHALL NOT require `suppressHydrationWarning` to be added to elements solely because of i18n; existing `suppressHydrationWarning` attributes SHALL be preserved where already present.

### Requirement 7: Locale Switcher Component

**User Story:** As a user, I want to switch the application language from any page, so that I can use Raspquery in my preferred language.

#### Acceptance Criteria

1. THE I18n_System SHALL provide a `LocaleSwitcher` Client Component that renders a language selection control.
2. WHEN a user selects a locale in the `LocaleSwitcher`, THE I18n_System SHALL navigate to the equivalent page in the selected locale without losing the current path.
3. THE `LocaleSwitcher` SHALL display the currently active locale.
4. THE `LocaleSwitcher` SHALL be integrated into the dashboard sidebar (collapsed and expanded states) and into the landing page Navbar.
5. WHEN the sidebar is collapsed, THE `LocaleSwitcher` SHALL render in a compact form (e.g., locale code only: `FR`, `EN`, `ES`).
6. THE `LocaleSwitcher` SHALL use `next-intl`'s `useRouter` and `usePathname` (from `next-intl/navigation`) to perform locale-aware navigation, preserving the current path segment.
7. THE `LocaleSwitcher` SHALL be accessible: each locale option SHALL have a descriptive `aria-label` in the target language (e.g., `"Switch to English"`).

### Requirement 8: Navigation Helpers

**User Story:** As a developer, I want locale-aware navigation utilities, so that all internal links and programmatic redirects automatically include the correct locale prefix.

#### Acceptance Criteria

1. THE I18n_System SHALL export locale-aware `Link`, `useRouter`, `usePathname`, and `redirect` utilities from a shared `lib/i18n/navigation.ts` module, configured with the supported locales and default locale.
2. THE I18n_System SHALL replace all uses of `next/link`'s `Link` and `next/navigation`'s `useRouter`, `usePathname`, and `redirect` in pages and components under `app/[locale]/` with the locale-aware equivalents from `lib/i18n/navigation.ts`.
3. WHEN a programmatic redirect occurs (e.g., `redirect('/sign-in')` in a Server Component), THE I18n_System SHALL use the locale-aware `redirect` so the target URL includes the correct Locale_Prefix.
4. WHEN the dashboard `layout.tsx` calls `router.push('/onboarding')` to redirect incomplete onboarding, THE I18n_System SHALL use the locale-aware router so the redirect preserves the active locale.

### Requirement 9: RTL Architecture Readiness

**User Story:** As a developer, I want the i18n architecture to support future RTL languages without requiring structural changes, so that adding Arabic or Hebrew later is a configuration-only change.

#### Acceptance Criteria

1. THE I18n_System SHALL store a `dir` (text direction) property per locale in the locale configuration (e.g., `{ fr: 'ltr', en: 'ltr', es: 'ltr' }`).
2. WHEN the `[locale]` layout renders, THE I18n_System SHALL set the `dir` attribute on the `<html>` element based on the active locale's direction value.
3. THE I18n_System SHALL derive the `dir` value from the locale configuration rather than hardcoding `"ltr"`, so that adding a new RTL locale requires only a configuration update.
4. WHERE a future RTL locale is added to the supported locales list, THE I18n_System SHALL automatically apply `dir="rtl"` to the `<html>` element for that locale without requiring changes to layout components.

### Requirement 10: SEO and Metadata Localization

**User Story:** As a product owner, I want search engines to correctly index each locale's pages, so that French, English, and Spanish users can discover Raspquery through organic search.

#### Acceptance Criteria

1. THE I18n_System SHALL add `<link rel="alternate" hreflang="x">` tags for all supported locales on every public page, using `next-intl`'s metadata helpers or manual `alternates` configuration in `generateMetadata`.
2. THE I18n_System SHALL set the `hreflang="x-default"` alternate to the default locale (`fr`) URL.
3. WHEN `generateMetadata` runs for a page, THE I18n_System SHALL return locale-specific `title` and `description` values sourced from the Message_Catalog.
4. THE I18n_System SHALL update `app/sitemap.ts` to include URLs for all supported locales for each public page.
5. THE I18n_System SHALL update the `openGraph.locale` metadata field to reflect the active locale (e.g., `fr_FR`, `en_US`, `es_ES`).

### Requirement 11: Clerk Authentication Locale Compatibility

**User Story:** As a developer, I want Clerk authentication flows to remain fully functional after the i18n restructuring, so that sign-in, sign-up, and webhook processing are not broken by the locale routing layer.

#### Acceptance Criteria

1. WHEN Clerk redirects an unauthenticated user to sign-in, THE Routing_Middleware SHALL preserve the active locale in the redirect URL (e.g., `/en/sign-in` for English users).
2. THE I18n_System SHALL configure Clerk's `ClerkProvider` with locale-aware `signInUrl` and `signUpUrl` props that include the correct Locale_Prefix.
3. THE Routing_Middleware SHALL exclude Clerk webhook routes (`/api/auth/webhook`) from locale processing.
4. WHEN Clerk's `auth()` or `currentUser()` is called in a Server Component under `app/[locale]/`, THE I18n_System SHALL not interfere with Clerk's token resolution or user session.
5. THE I18n_System SHALL configure the `afterSignInUrl` and `afterSignUpUrl` in `ClerkProvider` to redirect to the locale-prefixed dashboard (e.g., `/en/dashboard` for English).

### Requirement 12: API Routes Locale Isolation

**User Story:** As a developer, I want API routes to remain locale-agnostic, so that backend endpoints are not affected by the locale routing layer and continue to function correctly.

#### Acceptance Criteria

1. THE I18n_System SHALL NOT apply locale routing to any route under `app/api/`.
2. WHEN an API route returns an error message intended for display in the UI, THE I18n_System SHALL return a locale-neutral error code or key rather than a hardcoded French string, so that the Client Component can translate it using the active locale.
3. THE Routing_Middleware SHALL exclude all `/api/*` paths from locale detection and redirection.

### Requirement 13: Translation Completeness and Quality

**User Story:** As a user, I want all visible text in the application to appear in my selected language, so that I never encounter untranslated French strings when using the English or Spanish interface.

#### Acceptance Criteria

1. THE I18n_System SHALL extract all Hardcoded_Strings from the following files into Message_Catalogs: `app/[locale]/page.tsx` (landing), `app/[locale]/onboarding/page.tsx`, `app/[locale]/dashboard/page.tsx`, `app/[locale]/dashboard/layout.tsx`, and all dashboard sub-page files (`recommend`, `blueprint`, `stack`, `alerts`, `score`, `billing`, `settings`, `account`, `roi`).
2. THE I18n_System SHALL extract all Hardcoded_Strings from landing page components: `Navbar`, `Hero`, `Features`, `HowItWorks`, `Pricing`, `SocialProof`, `CTA`, `Footer`.
3. THE I18n_System SHALL extract all Hardcoded_Strings from dashboard components: `DashboardMetrics`, `MetricCard`, `OnboardingBanner`, `StackUpdatesFeed`, `StackList`, `WelcomeToast`.
4. WHEN a page contains dynamic content fetched from the database (e.g., stack names, agent names, user objectives), THE I18n_System SHALL NOT attempt to translate that content, as it is user-generated data.
5. THE I18n_System SHALL provide English (`en`) and Spanish (`es`) translations for all keys present in the French (`fr`) Message_Catalog.
