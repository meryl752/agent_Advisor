/**
 * Enrichit not_for et integrations pour les agents Supabase (LLM + update).
 *
 * - not_for : courtes expressions FR que l’utilisateur pourrait mettre dans son brief
 *   quand l’outil est un MAUVAIS choix (le matcher pénalise si le texte utilisateur les contient).
 * - integrations : noms d’outils / produits réels souvent connectés (Slack, HubSpot, etc.).
 *
 * Usage:
 *   npx tsx scripts/enrich-agent-not-for-integrations.ts --dry-run --limit 5
 *   npx tsx scripts/enrich-agent-not-for-integrations.ts --limit 50 --delay-ms 500
 *   npx tsx scripts/enrich-agent-not-for-integrations.ts --overwrite --limit 10
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { callLLM } from '../lib/llm/router'
import { repairTruncatedJSON } from '../lib/utils/jsonRepair'

config({ path: resolve(__dirname, '../.env.local') })

type AgentRow = {
  id: string
  name: string
  category: string | null
  description: string | null
  use_cases: string[] | null
  best_for: string[] | null
  not_for: string[] | null
  integrations: string[] | null
}

function card(a: string[] | null | undefined): number {
  return Array.isArray(a) ? a.length : 0
}

function needsEnrichment(a: AgentRow, minLen: number): boolean {
  return card(a.not_for) < minLen || card(a.integrations) < minLen
}

/** Déduplication insensible à la casse, plafond max. */
function uniqCi(strs: string[], max: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of strs) {
    const t = s.trim()
    const k = t.toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

/** Premier objet `{ ... }` avec compte d’accolades (chaînes "…" prises en compte). */
function extractBalancedJsonObject(s: string): string | null {
  const start = s.indexOf('{')
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const c = s[i]
    if (esc) {
      esc = false
      continue
    }
    if (inStr) {
      if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return s.slice(start, i + 1)
    }
  }
  return null
}

function stripLlmNoise(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function extractJsonSlice(cleaned: string): string | null {
  const balanced = extractBalancedJsonObject(cleaned)
  if (balanced) return balanced
  const start = cleaned.indexOf('{')
  if (start === -1) return null
  const tail = cleaned.slice(start)
  try {
    return repairTruncatedJSON(tail)
  } catch {
    return tail
  }
}

function parseJsonObject(raw: string): { not_for: string[]; integrations: string[] } | null {
  const cleaned = stripLlmNoise(raw)
  let slice = extractJsonSlice(cleaned) ?? extractJsonSlice(raw)
  if (!slice) return null

  const tryParse = (s: string) => {
    const o = JSON.parse(s) as { not_for?: unknown; integrations?: unknown }
    const not_for = Array.isArray(o.not_for)
      ? o.not_for.map(x => String(x).trim()).filter(Boolean).slice(0, 8)
      : []
    const integrations = Array.isArray(o.integrations)
      ? o.integrations.map(x => String(x).trim()).filter(Boolean).slice(0, 12)
      : []
    if (not_for.length === 0 && integrations.length === 0) return null
    return { not_for, integrations }
  }

  try {
    return tryParse(slice)
  } catch {
    try {
      slice = repairTruncatedJSON(slice)
      return tryParse(slice)
    } catch {
      return null
    }
  }
}

function buildPrompt(agent: AgentRow): string {
  const uc = (agent.use_cases ?? []).slice(0, 8).join(' | ')
  const bf = (agent.best_for ?? []).slice(0, 6).join(' | ')
  return `Tu es un expert produit B2B. Métadonnées pour un moteur de recommandation de stacks d'outils IA (PME, freelances, petites équipes).

Outil: ${agent.name}
Catégorie: ${agent.category ?? 'N/A'}
Description (extrait): ${(agent.description ?? '').slice(0, 900)}

Cas d'usage (extraits): ${uc || 'N/A'}
Idéal pour (extraits): ${bf || 'N/A'}

TÂCHE — réponds par UN SEUL objet JSON valide (guillemets doubles, pas de markdown, pas de texte avant/après). Remplace les valeurs d'exemple par du contenu réel pour CET outil.

Format exact :
{
  "not_for": ["phrase 1", "phrase 2", "phrase 3"],
  "integrations": ["Slack", "HubSpot"]
}

Règles not_for : 4 à 7 courtes expressions EN FRANÇAIS qu'un utilisateur pourrait écrire dans son objectif quand cet outil serait un MAUVAIS choix (ex. budget zéro, solo sans équipe, 100% offline, secteur très réglementé, pas besoin d'IA, refus du cloud). Chaque entrée sera cherchée comme sous-chaîne dans le texte utilisateur.

Règles integrations : 5 à 12 noms d'outils SaaS réels souvent connectés à ${agent.name} (noms propres du marché).`
}

function buildTinyRetryPrompt(agent: AgentRow): string {
  return `Outil: ${agent.name} | ${agent.category ?? ''}

Une seule ligne JSON, 3 entrées not_for max, 5 integrations max, phrases très courtes :
{"not_for":["a","b","c"],"integrations":["x","y","z","u","v"]}`
}

function buildCompactRetryPrompt(agent: AgentRow): string {
  const d = (agent.description ?? '').slice(0, 500).replace(/\s+/g, ' ')
  return `Outil: ${agent.name}
Catégorie: ${agent.category ?? 'N/A'}
Résumé: ${d}

Réponds UNIQUEMENT par un JSON compact, rien d'autre. Guillemets doubles. Pas de virgule finale.
{"not_for":["français court 1","français court 2","français court 3","français court 4"],"integrations":["Outil1","Outil2","Outil3","Outil4","Outil5"]}`
}

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const overwrite = args.includes('--overwrite')
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) || 0 : 0
  const delayMs = args.includes('--delay-ms') ? parseInt(args[args.indexOf('--delay-ms') + 1], 10) || 400 : 400
  const minLen = args.includes('--min-len') ? parseInt(args[args.indexOf('--min-len') + 1], 10) || 2 : 2

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: npx tsx scripts/enrich-agent-not-for-integrations.ts [options]

  --dry-run        Pas d'écriture Supabase
  --verbose        Afficher un extrait de la réponse LLM si JSON invalide
  --overwrite      Réécrire même si déjà ≥ minLen entrées
  --limit N        Traiter au plus N agents
  --delay-ms N     Pause après chaque LLM (défaut 400)
  --min-len N      Seuil « assez rempli » (défaut 2) : enrichit si not_for OU integrations a moins de N entrées
  --help           Aide
`)
    process.exit(0)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, category, description, use_cases, best_for, not_for, integrations')

  if (error || !data) {
    console.error(error?.message)
    process.exit(1)
  }

  let list = data as AgentRow[]
  if (!overwrite) {
    list = list.filter(a => needsEnrichment(a, minLen))
  }
  if (limit > 0) list = list.slice(0, limit)

  console.log(`\nAgents à traiter: ${list.length}${dryRun ? ' (dry-run)' : ''}\n`)

  let ok = 0
  let fail = 0

  for (let i = 0; i < list.length; i++) {
    const agent = list[i]
    const prompt = buildPrompt(agent)
    try {
      let raw = await callLLM(prompt, 1500, 'qwen-32b')
      let parsed = parseJsonObject(raw)
      if (!parsed) {
        raw = await callLLM(buildCompactRetryPrompt(agent), 1200, 'qwen-32b')
        parsed = parseJsonObject(raw)
      }
      if (!parsed) {
        raw = await callLLM(buildTinyRetryPrompt(agent), 700, 'qwen-32b')
        parsed = parseJsonObject(raw)
      }
      if (!parsed) {
        console.warn(`  ⚠️  ${agent.name} — JSON invalide après 3 essais`)
        if (verbose) {
          const snippet = stripLlmNoise(raw).slice(0, 500)
          console.warn(`     extrait: ${snippet}${stripLlmNoise(raw).length > 500 ? '…' : ''}`)
        }
        fail++
        continue
      }

      const patch: Partial<AgentRow> = {}
      if (overwrite || card(agent.not_for) < minLen) {
        if (parsed.not_for.length) {
          patch.not_for = overwrite
            ? uniqCi(parsed.not_for, 10)
            : uniqCi([...(agent.not_for ?? []), ...parsed.not_for], 10)
        }
      }
      if (overwrite || card(agent.integrations) < minLen) {
        if (parsed.integrations.length) {
          patch.integrations = overwrite
            ? uniqCi(parsed.integrations, 14)
            : uniqCi([...(agent.integrations ?? []), ...parsed.integrations], 14)
        }
      }

      if (Object.keys(patch).length === 0) {
        console.warn(`  ⚠️  ${agent.name} — rien à appliquer`)
        fail++
        continue
      }

      if (dryRun) {
        console.log(`  [dry-run] ${agent.name}`)
        console.log(`    not_for: ${JSON.stringify(patch.not_for ?? agent.not_for)}`)
        console.log(`    integrations: ${JSON.stringify(patch.integrations ?? agent.integrations)}`)
        ok++
      } else {
        const { error: upErr } = await supabase.from('agents').update(patch).eq('id', agent.id)
        if (upErr) {
          console.warn(`  ❌ ${agent.name} — ${upErr.message}`)
          fail++
        } else {
          console.log(`  ✅ ${agent.name} (${i + 1}/${list.length})`)
          ok++
        }
      }

      if (delayMs > 0 && i < list.length - 1) await sleep(delayMs)
    } catch (e) {
      console.warn(`  ❌ ${agent.name} —`, e instanceof Error ? e.message : e)
      fail++
      if (delayMs > 0 && i < list.length - 1) await sleep(delayMs)
    }
  }

  console.log(`\nTerminé — OK: ${ok}, échecs: ${fail}${dryRun ? ' (dry-run, rien écrit)' : ''}\n`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
