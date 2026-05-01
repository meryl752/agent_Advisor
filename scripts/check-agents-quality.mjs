/**
 * Script pour vérifier la qualité des données agents dans Supabase
 * Usage: node scripts/check-agents-quality.mjs
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAgentsQuality() {
  console.log('🔍 Requête Supabase — analyse qualité des agents...\n')

  // 1. Compter le total
  const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true })
  console.log(`📊 Total agents: ${count}\n`)

  // 2. Vérifier les agents recommandés (Lindy, Rytr, Publer, Anyword)
  const agentsToCheck = ['Lindy', 'Rytr', 'Publer', 'Anyword', 'Taplio', 'Buffer', 'Notion']
  const { data: specificAgents } = await supabase
    .from('agents')
    .select('id, name, category, description, use_cases, best_for, url, price_from')
    .in('name', agentsToCheck)

  console.log('=== AGENTS VÉRIFIÉS ===')
  specificAgents?.forEach(a => {
    console.log(`\n📦 ${a.name} (${a.category}) — ${a.price_from}€/mois`)
    console.log(`   URL: ${a.url}`)
    console.log(`   Description: ${a.description?.slice(0, 100)}...`)
    console.log(`   Use cases: ${JSON.stringify(a.use_cases?.slice(0, 3))}`)
    console.log(`   Best for: ${JSON.stringify(a.best_for?.slice(0, 3))}`)
  })

  // 3. Agents avec use_cases vides
  const { data: emptyUseCases } = await supabase
    .from('agents')
    .select('name, category, use_cases')
    .or('use_cases.is.null,use_cases.eq.{}')
    .limit(10)

  console.log(`\n=== AGENTS SANS USE_CASES (${emptyUseCases?.length}) ===`)
  emptyUseCases?.forEach(a => console.log(`  ⚠️  ${a.name} (${a.category})`))

  // 4. Agents avec best_for vides
  const { data: emptyBestFor } = await supabase
    .from('agents')
    .select('name, category, best_for')
    .or('best_for.is.null,best_for.eq.{}')
    .limit(10)

  console.log(`\n=== AGENTS SANS BEST_FOR (${emptyBestFor?.length}) ===`)
  emptyBestFor?.forEach(a => console.log(`  ⚠️  ${a.name} (${a.category})`))

  // 5. Distribution par catégorie
  const { data: allAgents } = await supabase
    .from('agents')
    .select('category, name')
    .order('category')

  const byCategory = {}
  allAgents?.forEach(a => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1
  })

  console.log('\n=== DISTRIBUTION PAR CATÉGORIE ===')
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`))

  // 6. Agents avec score élevé
  const { data: topAgents } = await supabase
    .from('agents')
    .select('name, category, score, roi_score, price_from')
    .order('score', { ascending: false })
    .limit(10)

  console.log('\n=== TOP 10 AGENTS PAR SCORE ===')
  topAgents?.forEach(a => console.log(`  ${a.name} (${a.category}) — score: ${a.score}, roi: ${a.roi_score}, prix: ${a.price_from}€`))
}

checkAgentsQuality().catch(console.error)
