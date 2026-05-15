/**
 * Analyse locale du catalogue agents + alignement avec le moteur de reco.
 * Lit Supabase (service role) et affiche des stats + échantillon « agents pauvres ».
 *
 * Usage : npx tsx scripts/analyze-agent-catalog.ts
 * (nécessite .env.local : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

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
  embedding_provider: string | null
  embedding_jina: unknown
}

function len(s: string | null | undefined): number {
  return (s ?? '').trim().length
}

function card(a: string[] | null | undefined): number {
  return Array.isArray(a) ? a.length : 0
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const { data: agents, error } = await supabase
    .from('agents')
    .select(
      'id, name, category, description, use_cases, best_for, not_for, integrations, embedding_provider, embedding_jina'
    )

  if (error || !agents) {
    console.error('Erreur fetch agents:', error?.message)
    process.exit(1)
  }

  const rows = agents as AgentRow[]
  const n = rows.length
  const withJina = rows.filter(r => r.embedding_jina != null).length
  const emptyDesc = rows.filter(r => len(r.description) === 0).length
  const shortDesc = rows.filter(r => len(r.description) > 0 && len(r.description) < 40).length
  const noUc = rows.filter(r => card(r.use_cases) === 0).length
  const noBf = rows.filter(r => card(r.best_for) === 0).length
  const noNf = rows.filter(r => card(r.not_for) === 0).length
  const noInt = rows.filter(r => card(r.integrations) === 0).length

  const byCat = new Map<string, number>()
  for (const r of rows) {
    const c = r.category ?? '(null)'
    byCat.set(c, (byCat.get(c) ?? 0) + 1)
  }
  const topCats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)

  const avgDesc =
    n > 0 ? Math.round(rows.reduce((s, r) => s + len(r.description), 0) / n) : 0
  const avgUc =
    n > 0 ? (rows.reduce((s, r) => s + card(r.use_cases), 0) / n).toFixed(1) : '0'

  console.log('\n=== Analyse catalogue agents (Supabase) ===\n')
  console.log(`Total agents : ${n}`)
  console.log(`Avec embedding_jina : ${withJina} (${((withJina / n) * 100).toFixed(1)}%)`)
  console.log(`Sans embedding_jina : ${n - withJina}`)
  console.log(`Description vide : ${emptyDesc} | très courte (<40 car.) : ${shortDesc}`)
  console.log(`Sans use_cases : ${noUc} | Sans best_for : ${noBf} | Sans not_for : ${noNf} | Sans integrations : ${noInt}`)
  console.log(`Longueur moyenne description : ${avgDesc} car. | use_cases moyen/agent : ${avgUc}`)

  console.log('\n--- Top catégories (biais possible si une catégorie domine) ---')
  for (const [cat, count] of topCats) {
    console.log(`  ${count}\t${cat}`)
  }

  const poor = rows
    .map(r => ({
      r,
      score:
        (r.embedding_jina == null ? 1000 : 0) +
        (card(r.use_cases) < 2 ? 100 : 0) +
        (len(r.description) < 50 ? 50 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)

  console.log('\n--- Échantillon « données pauvres » (priorité enrichissement / re-embed) ---')
  for (const { r, score } of poor) {
    const flags = [
      r.embedding_jina == null ? 'no_jina' : null,
      card(r.use_cases) < 2 ? 'thin_uc' : null,
      len(r.description) < 50 ? 'short_desc' : null,
    ]
      .filter(Boolean)
      .join(', ')
    console.log(
      `  [${score}] ${r.name} | ${r.category ?? '?'} | uc=${card(r.use_cases)} desc=${len(r.description)} | ${flags}`
    )
  }

  console.log('\n=== Alignement moteur (rappel code) ===')
  console.log(
    '- Requête embed (orchestrator) : objectif + secteur + contexte secteur + catégories + sous-tâches.'
  )
  console.log(
    '- Document embed (migrate-embeddings) : name + description + use_cases (pas category / best_for / not_for).'
  )
  console.log(
    '- Matcher métier : sous-chaînes use_cases/best_for dans objectif+sous-tâches+sector_context (langue / formulation = souvent 0 match).'
  )
  console.log('\nRecommandations : enrichir use_cases en langage utilisateur ; harmoniser texte embed document ≈ requête ; régénérer Jina après enrichissement.\n')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
