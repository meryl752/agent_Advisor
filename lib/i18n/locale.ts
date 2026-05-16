export type AppLocale = 'en' | 'fr'

const FR_MARKERS =
  /\b(je|tu|vous|nous|est|sont|avec|pour|dans|une|des|les|pas|plus|très|être|faire|créer|génère|objectif|outil|stack|bonjour|merci)\b/i
const EN_MARKERS =
  /\b(the|and|for|with|your|you|are|is|to|build|create|generate|stack|tool|goal|please|thanks|hello|want|need)\b/i

export function detectLocaleFromText(text: string): AppLocale {
  const sample = text.slice(0, 4000).toLowerCase()
  if (!sample.trim()) return 'en'

  let fr = 0
  let en = 0
  const frHits = sample.match(FR_MARKERS)
  const enHits = sample.match(EN_MARKERS)
  if (frHits) fr = frHits.length
  if (enHits) en = enHits.length

  if (fr === 0 && en === 0) {
    const accented = (sample.match(/[àâäéèêëïîôùûüçœæ]/g) ?? []).length
    return accented >= 2 ? 'fr' : 'en'
  }
  return fr >= en ? 'fr' : 'en'
}

/** Sticky session locale: keep existing unless new user text strongly disagrees. */
export function resolveSessionLocale(
  stored: string | null | undefined,
  userTexts: string[]
): AppLocale {
  const combined = userTexts.filter(Boolean).join('\n')
  if (!combined.trim()) return stored === 'fr' ? 'fr' : 'en'

  const detected = detectLocaleFromText(combined)
  if (!stored || (stored !== 'fr' && stored !== 'en')) return detected
  if (stored === detected) return stored

  const storedScore =
    stored === 'fr'
      ? (combined.match(FR_MARKERS) ?? []).length
      : (combined.match(EN_MARKERS) ?? []).length
  const otherScore =
    detected === 'fr'
      ? (combined.match(FR_MARKERS) ?? []).length
      : (combined.match(EN_MARKERS) ?? []).length

  if (otherScore >= storedScore + 3) return detected
  return stored as AppLocale
}

export function llmLanguageInstruction(locale: AppLocale): string {
  return locale === 'fr'
    ? 'Réponds et génère tout contenu utilisateur en français.'
    : 'Respond and generate all user-facing content in English.'
}

export function localeToDateFormat(locale: AppLocale): string {
  return locale === 'fr' ? 'fr-FR' : 'en-US'
}
