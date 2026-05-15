/**
 * Enrichit data/catalog-filter.json avec des exclusions ICP pour
 * « stacks d'outils IA entrepreneurs & créateurs » (SaaS, marketing, ops, créa pro).
 *
 * Fusionne avec l'existant. Heuristiques volontairement conservatrices
 * (pas d'exclusion de CRM, analytics, LLM généralistes, etc.).
 *
 * Usage: npx tsx scripts/generate-icp-blocklist.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

config({ path: resolve(__dirname, '../.env.local') })

type Agent = { id: string; name: string; category: string | null; description: string | null }

type CatalogFile = {
  excluded_agent_ids?: string[]
  excluded_names_exact?: string[]
  excluded_name_contains?: string[]
  notes?: Record<string, string>
}

const NAME_CONTAINS_SUGGESTED = [
  'therapist',
  'ai therapist',
  'replika',
  'ai girlfriend',
  'ai boyfriend',
  'virtual girlfriend',
  'casino',
  'gambling',
  'porn',
  'xxx',
  'nsfw',
  'onlyfans',
  'strip club',
  'nude',
  'erotic',
  'hentai',
  'dating sim',
  'tarot reading',
  'fortune tell',
  'lottery predictor',
  'pump.fun',
  'meme coin',
  'gymbuddy',
  'watchnow',
  'anijam',
  'free ai therapist',
  'wellness chat',
  'mental health companion',
  'dream journal',
  'horoscope ai',
]

const NAMES_EXACT_SUGGESTED = [
  'Free AI Therapist',
  'WTF Does This Company Do?',
  'GymBuddy AI',
  'WatchNow AI',
  'Anijam AI',
  'Mindsera',
  'Civils.ai',
  'Trading Literacy',
  'MyMemo AI',
  'PlayArti',
  'Lore',
  'Plot Factory',
  'ChatOn',
  'ThumbnailCreator.com',
  'Insta Headshots',
  'Cactus Interior',
]

/** Phrases dans la description (tout en minuscules) — ciblées pour limiter les faux positifs */
const DESCRIPTION_PHRASES = [
  'mental health chatbot',
  'free ai therapist',
  'ai-powered journal',
  'find your next watch',
  'wellness through meaningful conversations',
  'fitness experience tailored',
  'construction and civil engineering industries',
  'lottery predictor',
  'horoscope',
  'tarot reading',
  'virtual girlfriend',
  'ai girlfriend',
  'ai boyfriend',
  'gambling platform',
  'meme coin',
  'erotic ',
  'hentai',
  'ai dating',
  'animated sequences with minimal',
  'story planner designed for writers',
]

function loadCatalog(): CatalogFile {
  const p = resolve(__dirname, '../data/catalog-filter.json')
  if (!existsSync(p)) return {}
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as CatalogFile
  } catch {
    return {}
  }
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Variables Supabase manquantes')
    process.exit(1)
  }

  const existing = loadCatalog()
  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('agents').select('id, name, category, description')

  if (error || !data) {
    console.error(error?.message)
    process.exit(1)
  }

  const agents = data as Agent[]
  const exactSuggested = new Set(NAMES_EXACT_SUGGESTED.map(norm))
  const exactExisting = new Set((existing.excluded_names_exact ?? []).map(norm))
  const exactMerged = new Set([...exactExisting, ...exactSuggested])

  const containsMerged = uniq([
    ...(existing.excluded_name_contains ?? []),
    ...NAME_CONTAINS_SUGGESTED,
  ]).sort()

  const idsFromExisting = new Set((existing.excluded_agent_ids ?? []).map(norm))
  const idsHit = new Set<string>()

  for (const a of agents) {
    const nl = norm(a.name)
    const desc = (a.description ?? '').toLowerCase()

    if (exactMerged.has(nl)) idsHit.add(a.id)

    if (!idsHit.has(a.id)) {
      for (const frag of containsMerged) {
        if (!frag) continue
        if (nl.includes(frag.toLowerCase())) {
          idsHit.add(a.id)
          break
        }
      }
    }

    if (!idsHit.has(a.id)) {
      for (const phrase of DESCRIPTION_PHRASES) {
        if (phrase && desc.includes(phrase)) {
          idsHit.add(a.id)
          break
        }
      }
    }
  }

  const excluded_agent_ids = uniq([...idsFromExisting, ...idsHit].filter(Boolean)).sort()

  const suggestedByNorm = new Map(NAMES_EXACT_SUGGESTED.map(n => [norm(n), n]))
  const seenNorm = new Set<string>()
  const excluded_names_exact: string[] = []
  for (const low of [...exactMerged].sort((a, b) => a.localeCompare(b))) {
    const ag = agents.find(x => norm(x.name) === low)
    const label = ag?.name ?? suggestedByNorm.get(low) ?? low
    const k = norm(label)
    if (seenNorm.has(k)) continue
    seenNorm.add(k)
    excluded_names_exact.push(label)
  }

  const out: CatalogFile = {
    excluded_agent_ids,
    excluded_names_exact,
    excluded_name_contains: containsMerged,
    notes: {
      ...(existing.notes ?? {}),
      _icp_merge: `Fusion + heuristiques ${new Date().toISOString().slice(0, 10)} (scripts/generate-icp-blocklist.ts). Relire les faux positifs.`,
    },
  }

  const pathOut = resolve(__dirname, '../data/catalog-filter.json')
  writeFileSync(pathOut, JSON.stringify(out, null, 2), 'utf8')

  console.log(`\n✅ Écrit ${pathOut}`)
  console.log(`   IDs exclus: ${excluded_agent_ids.length}`)
  console.log(`   Noms exacts: ${excluded_names_exact.length}`)
  console.log(`   Règles contains: ${containsMerged.length}`)
  console.log('\n   Relis les matches « contains » (faux positifs possibles).\n')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
