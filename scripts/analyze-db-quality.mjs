/**
 * Analyse complète de la qualité des agents dans Supabase
 * Usage: node scripts/analyze-db-quality.mjs
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

// Known tools that SHOULD be in the database
const EXPECTED_TOOLS = [
  // AI Writing & Copywriting
  'ChatGPT', 'Claude', 'Gemini', 'Jasper AI', 'Copy.ai', 'Writesonic', 'Rytr', 'Anyword',
  // LinkedIn & Social Media
  'Taplio', 'Buffer', 'Hootsuite', 'Publer', 'Later', 'Sprout Social',
  // Email Marketing
  'Mailchimp', 'Klaviyo', 'Brevo', 'ActiveCampaign', 'Lemlist', 'Instantly AI',
  // Automation
  'Make.com', 'Zapier', 'n8n', 'Lindy', 'Activepieces',
  // E-commerce
  'Shopify', 'Shopify Sidekick', 'Tidio AI', 'Gorgias', 'Richpanel',
  // Prospecting & Sales
  'Apollo.io', 'Hunter.io', 'LinkedIn Sales Navigator', 'Amplemarket', 'Seamless.ai',
  // SEO
  'Ahrefs', 'Semrush', 'Surfer SEO', 'NeuronWriter',
  // Video & Image
  'Midjourney', 'DALL-E', 'Stable Diffusion', 'Canva', 'ElevenLabs', 'Synthesia',
  // Analytics
  'Google Analytics', 'Mixpanel', 'Hotjar',
  // Project Management
  'Notion', 'Notion AI', 'ClickUp',
  // Customer Support
  'Intercom', 'Zendesk', 'Freshdesk',
  // Coding
  'GitHub Copilot', 'Cursor', 'Windsurf',
  // Research
  'Perplexity AI', 'Tavily',
]

// Known incorrect use_cases assignments to check
const TOOLS_TO_VERIFY = [
  { name: 'Publer', expectedCategory: 'automation', expectedUseCase: 'social media scheduling', wrongUseCase: 'email' },
  { name: 'Anyword', expectedCategory: 'copywriting', expectedUseCase: 'ad copy optimization', wrongUseCase: 'reporting' },
  { name: 'Flick AI', expectedCategory: 'automation', expectedUseCase: 'hashtag research', wrongUseCase: 'competitive intelligence' },
  { name: 'Lindy', expectedCategory: 'automation', expectedUseCase: 'email automation', wrongUseCase: 'reporting' },
]

async function analyzeDB() {
  console.log('🔍 Analyse complète de la base de données agents...\n')

  // 1. Total count
  const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true })
  console.log(`📊 Total agents: ${count}\n`)

  // 2. Check expected tools
  const { data: allAgents } = await supabase
    .from('agents')
    .select('name, category, use_cases, best_for, price_from, score, url')
    .order('name')

  const agentNames = new Set(allAgents?.map(a => a.name.toLowerCase()) || [])
  
  console.log('=== OUTILS MANQUANTS (attendus mais absents) ===')
  const missing = EXPECTED_TOOLS.filter(tool => !agentNames.has(tool.toLowerCase()))
  if (missing.length === 0) {
    console.log('  ✅ Tous les outils attendus sont présents')
  } else {
    missing.forEach(t => console.log(`  ❌ ${t}`))
  }

  // 3. Verify specific tools for wrong use_cases
  console.log('\n=== VÉRIFICATION DES USE_CASES PROBLÉMATIQUES ===')
  for (const check of TOOLS_TO_VERIFY) {
    const agent = allAgents?.find(a => a.name.toLowerCase() === check.name.toLowerCase())
    if (!agent) {
      console.log(`  ❌ ${check.name} — NON TROUVÉ dans la DB`)
      continue
    }
    const useCasesStr = JSON.stringify(agent.use_cases || []).toLowerCase()
    const hasWrong = useCasesStr.includes(check.wrongUseCase.toLowerCase())
    const hasCorrect = useCasesStr.includes(check.expectedUseCase.toLowerCase())
    
    console.log(`\n  📦 ${check.name} (${agent.category})`)
    console.log(`     Use cases: ${JSON.stringify(agent.use_cases?.slice(0, 2))}`)
    console.log(`     Attendu: "${check.expectedUseCase}" → ${hasCorrect ? '✅' : '❌ ABSENT'}`)
    console.log(`     Problème: "${check.wrongUseCase}" → ${hasWrong ? '⚠️ PRÉSENT' : '✅ absent'}`)
  }

  // 4. Category distribution
  console.log('\n=== DISTRIBUTION PAR CATÉGORIE ===')
  const byCategory = {}
  allAgents?.forEach(a => {
    byCategory[a.category] = (byCategory[a.category] || 0) + 1
  })
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`))

  // 5. Data quality issues
  console.log('\n=== PROBLÈMES DE QUALITÉ DES DONNÉES ===')
  
  const noUrl = allAgents?.filter(a => !a.url) || []
  console.log(`  ⚠️  Agents sans URL: ${noUrl.length}`)
  noUrl.slice(0, 5).forEach(a => console.log(`     - ${a.name}`))

  const noUseCases = allAgents?.filter(a => !a.use_cases || a.use_cases.length === 0) || []
  console.log(`  ⚠️  Agents sans use_cases: ${noUseCases.length}`)

  const noBestFor = allAgents?.filter(a => !a.best_for || a.best_for.length === 0) || []
  console.log(`  ⚠️  Agents sans best_for: ${noBestFor.length}`)

  const zeroScore = allAgents?.filter(a => !a.score || a.score === 0) || []
  console.log(`  ⚠️  Agents avec score=0: ${zeroScore.length}`)

  // 6. Top tools by category
  console.log('\n=== TOP 5 PAR CATÉGORIE ===')
  const categories = Object.keys(byCategory).sort()
  for (const cat of categories.slice(0, 6)) {
    const topInCat = allAgents
      ?.filter(a => a.category === cat)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
    console.log(`\n  ${cat}:`)
    topInCat?.forEach(a => console.log(`    - ${a.name} (score: ${a.score}, prix: ${a.price_from}€)`))
  }

  // 7. Duplicate names
  console.log('\n=== DOUBLONS POTENTIELS ===')
  const nameCounts = {}
  allAgents?.forEach(a => {
    const key = a.name.toLowerCase()
    nameCounts[key] = (nameCounts[key] || 0) + 1
  })
  const duplicates = Object.entries(nameCounts).filter(([, count]) => count > 1)
  if (duplicates.length === 0) {
    console.log('  ✅ Aucun doublon détecté')
  } else {
    duplicates.forEach(([name, count]) => console.log(`  ⚠️  "${name}" apparaît ${count} fois`))
  }
}

analyzeDB().catch(console.error)
