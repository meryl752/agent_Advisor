/**
 * Audit qualité du catalogue agents (Supabase).
 *
 * 1) Échantillon aléatoire (reproductible avec --seed)
 * 2) Top N par score
 * 3) Paires « trop proches » : même catégorie + mots du nom en commun + chevauchement use_cases
 *
 * Usage:
 *   npx tsx scripts/audit-agent-catalog.ts
 *   npx tsx scripts/audit-agent-catalog.ts --seed 42 --out reports/agent-audit.md
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import * as fs from 'fs'

config({ path: resolve(__dirname, '../.env.local') })

type Agent = {
  id: string
  name: string
  category: string | null
  description: string | null
  score: number | null
  use_cases: string[] | null
  best_for: string[] | null
}

function parseArgs() {
  const a = process.argv.slice(2)
  const outIdx = a.indexOf('--out')
  return {
    seed: a.includes('--seed') ? parseInt(a[a.indexOf('--seed') + 1], 10) || 42 : 42,
    randomN: a.includes('--random') ? parseInt(a[a.indexOf('--random') + 1], 10) || 50 : 50,
    topN: a.includes('--top') ? parseInt(a[a.indexOf('--top') + 1], 10) || 50 : 50,
    maxPairs: a.includes('--max-pairs') ? parseInt(a[a.indexOf('--max-pairs') + 1], 10) || 80 : 80,
    out: outIdx >= 0 ? a[outIdx + 1] : null,
    help: a.includes('--help') || a.includes('-h'),
  }
}

/** RNG déterministe (Mulberry32) */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9à-ÿ]+/gi, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 4)
}

function useCaseTokens(agent: Agent): Set<string> {
  const s = new Set<string>()
  for (const uc of agent.use_cases ?? []) {
    for (const w of uc.toLowerCase().split(/[^a-z0-9à-ÿ]+/i)) {
      if (w.length >= 4) s.add(w)
    }
  }
  return s
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  let inter = 0
  for (const x of a) {
    if (b.has(x)) inter++
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

/** Paires candidates : index inversé sur mots du nom (longueur ≥ 4) */
function findSimilarPairs(agents: Agent[], maxPairs: number): Array<{ a: Agent; b: Agent; score: number; reason: string }> {
  const byWord = new Map<string, Agent[]>()
  for (const ag of agents) {
    const seen = new Set<string>()
    for (const w of tokenizeName(ag.name)) {
      if (seen.has(w)) continue
      seen.add(w)
      let list = byWord.get(w)
      if (!list) {
        list = []
        byWord.set(w, list)
      }
      list.push(ag)
    }
  }

  const pairKey = (x: string, y: string) => (x < y ? `${x}|${y}` : `${y}|${x}`)
  const done = new Set<string>()
  const results: Array<{ a: Agent; b: Agent; score: number; reason: string }> = []

  for (const [, list] of byWord) {
    if (list.length < 2 || list.length > 35) continue
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        if ((a.category ?? '') !== (b.category ?? '')) continue
        const k = pairKey(a.id, b.id)
        if (done.has(k)) continue

        const ta = useCaseTokens(a)
        const tb = useCaseTokens(b)
        const jc = jaccard(ta, tb)
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        const oneContains = nameA.includes(nameB) || nameB.includes(nameA)
        const score = jc * 0.65 + (oneContains ? 0.25 : 0) + (ta.size > 0 && tb.size > 0 ? 0.1 : 0)

        if (jc >= 0.12 || oneContains || (jc >= 0.06 && list.length <= 8)) {
          done.add(k)
          const reason = [
            jc >= 0.12 ? `Jaccard use_cases≈${(jc * 100).toFixed(0)}%` : null,
            oneContains ? 'nom contenu' : null,
            `cat=${a.category}`,
          ]
            .filter(Boolean)
            .join(' · ')
          results.push({ a, b, score, reason })
        }
      }
    }
  }

  results.sort((x, y) => y.score - x.score)
  return results.slice(0, maxPairs)
}

function mdEscape(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function formatAgentRow(ag: Agent): string {
  const uc = Array.isArray(ag.use_cases) ? ag.use_cases.length : 0
  const desc = (ag.description ?? '').slice(0, 100).replace(/\s+/g, ' ')
  return `| \`${ag.id}\` | ${mdEscape(ag.name)} | ${ag.category ?? ''} | ${ag.score ?? ''} | ${uc} | ${mdEscape(desc)}… |`
}

async function main() {
  const opts = parseArgs()
  if (opts.help) {
    console.log(`
Usage: npx tsx scripts/audit-agent-catalog.ts [options]

  --seed <n>        Graine RNG (défaut 42)
  --random <n>      Taille échantillon aléatoire (défaut 50)
  --top <n>         Top score (défaut 50)
  --max-pairs <n>   Max paires redondantes affichées (défaut 80)
  --out <path>      Écrire un rapport Markdown
  --help            Aide
`)
    process.exit(0)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, category, description, score, use_cases, best_for')

  if (error || !data) {
    console.error(error?.message)
    process.exit(1)
  }

  const agents = data as Agent[]
  const rand = mulberry32(opts.seed)
  const shuffled = [...agents]
  shuffleInPlace(shuffled, rand)
  const randomSample = shuffled.slice(0, Math.min(opts.randomN, shuffled.length))
  const topSample = [...agents].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, opts.topN)

  const byCat = new Map<string, number>()
  for (const ag of agents) {
    const c = ag.category ?? '(null)'
    byCat.set(c, (byCat.get(c) ?? 0) + 1)
  }
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)

  const pairs = findSimilarPairs(agents, opts.maxPairs)

  const lines: string[] = []
  lines.push(`# Audit catalogue agents`)
  lines.push('')
  lines.push(`- **Date** : ${new Date().toISOString()}`)
  lines.push(`- **Total agents** : ${agents.length}`)
  lines.push(`- **Seed** : ${opts.seed} (échantillon aléatoire reproductible)`)
  lines.push('')
  lines.push(`## Répartition catégories (top 15)`)
  lines.push('')
  lines.push(`| Catégorie | Effectif |`)
  lines.push(`|-----------|----------|`)
  for (const [c, n] of topCats) lines.push(`| ${c} | ${n} |`)
  lines.push('')
  lines.push(`## Échantillon aléatoire (${randomSample.length}) — à relire comme ICP`)
  lines.push('')
  lines.push(`| id | Outil | Cat. | Score | #UC | Début description |`)
  lines.push(`|----|-------|------|-------|-----|---------------------|`)
  for (const ag of randomSample) lines.push(formatAgentRow(ag))
  lines.push('')
  lines.push(`## Top score (${topSample.length}) — ce que la reco pousse en premier`)
  lines.push('')
  lines.push(`| id | Outil | Cat. | Score | #UC | Début description |`)
  lines.push(`|----|-------|------|-------|-----|---------------------|`)
  for (const ag of topSample) lines.push(formatAgentRow(ag))
  lines.push('')
  lines.push(`## Paires « proches » (heuristique : même catégorie + nom / use_cases) — piste curation`)
  lines.push('')
  lines.push(`| A | B | Indice |`)
  lines.push(`|---|---|--------|`)
  for (const { a, b, reason } of pairs) {
    lines.push(`| ${mdEscape(a.name)} | ${mdEscape(b.name)} | ${mdEscape(reason)} |`)
  }
  lines.push('')
  lines.push(`### Protocole manuel suggéré`)
  lines.push(`1. Parcourir l’échantillon aléatoire : chaque ligne est-elle dans le périmètre produit ?`)
  lines.push(`2. Parcourir le top score : aligné avec la promesse « stacks business » ?`)
  lines.push(`3. Pour chaque paire proche : fusionner, exclure l’un, ou différencier les use_cases.`)
  lines.push(`4. **Exclure** : ajouter l’UUID dans \`data/catalog-filter.json\` → \`excluded_agent_ids\`, ou le nom exact → \`excluded_names_exact\`, ou une sous-chaîne sur le nom → \`excluded_name_contains\`. Voir \`data/catalog-filter.example.json\`.`)
  lines.push('')

  const report = lines.join('\n')

  if (opts.out) {
    const outPath = resolve(process.cwd(), opts.out)
    fs.mkdirSync(dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, report, 'utf8')
    console.log(`Rapport écrit : ${outPath}\n`)
  }

  console.log(report)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
