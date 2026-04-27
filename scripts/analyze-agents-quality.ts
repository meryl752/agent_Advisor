/**
 * Script d'analyse de la qualité des données agents
 * 
 * Ce script analyse tous les agents pour identifier :
 * - Erreurs de catégorisation
 * - Données manquantes (best_for, not_for, use_cases)
 * - Incohérences entre description et catégorie
 * - Agents mal configurés pour la recherche vectorielle
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

interface Agent {
  id: string
  name: string
  category: string
  description: string
  use_cases: string[]
  best_for?: string[]
  not_for?: string[]
  price_from: number
  score: number
  setup_difficulty?: string
  website_domain?: string
}

// Catégories valides
const VALID_CATEGORIES = [
  'copywriting', 'seo', 'automation', 'research',
  'image', 'video', 'coding', 'analytics',
  'crm', 'email', 'social', 'website'
]

// Mots-clés par catégorie pour détecter les erreurs
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  website: ['landing page', 'site web', 'website builder', 'web design', 'page builder', 'framer', 'webflow', 'wordpress'],
  coding: ['IDE', 'code', 'developer', 'programming', 'github', 'copilot', 'cursor', 'windsurf'],
  copywriting: ['content', 'writing', 'text', 'copy', 'article', 'blog'],
  image: ['design', 'graphic', 'photo', 'image', 'visual', 'illustration'],
  research: ['spy', 'research', 'analysis', 'data', 'market', 'competitor'],
  automation: ['workflow', 'automation', 'zapier', 'make', 'integration'],
  seo: ['seo', 'search engine', 'ranking', 'keywords', 'backlinks'],
  video: ['video', 'editing', 'montage', 'animation'],
  analytics: ['analytics', 'tracking', 'metrics', 'dashboard', 'reporting'],
  crm: ['crm', 'customer', 'sales', 'pipeline', 'leads'],
  email: ['email', 'newsletter', 'mailing', 'campaign'],
  social: ['social media', 'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
}

function analyzeAgents() {
  console.log('🔍 Analyse de la qualité des données agents\n')

  // Charger les agents
  const agentsPath = resolve(__dirname, '../agents_export.json')
  const agentsData = JSON.parse(readFileSync(agentsPath, 'utf-8'))
  const agents: Agent[] = agentsData

  console.log(`📊 Total agents: ${agents.length}\n`)

  // ── Analyse 1 : Données manquantes ────────────────────────────────────────
  console.log('═'.repeat(80))
  console.log('📋 ANALYSE 1 : DONNÉES MANQUANTES')
  console.log('═'.repeat(80))

  const missingBestFor = agents.filter(a => !a.best_for || a.best_for.length === 0)
  const missingNotFor = agents.filter(a => !a.not_for || a.not_for.length === 0)
  const missingUseCases = agents.filter(a => !a.use_cases || a.use_cases.length === 0)
  const missingDifficulty = agents.filter(a => !a.setup_difficulty)

  console.log(`\n❌ Agents sans best_for: ${missingBestFor.length} (${(missingBestFor.length / agents.length * 100).toFixed(1)}%)`)
  if (missingBestFor.length > 0) {
    console.log('   Top 10:')
    missingBestFor.slice(0, 10).forEach(a => console.log(`   - ${a.name} (${a.category})`))
  }

  console.log(`\n❌ Agents sans not_for: ${missingNotFor.length} (${(missingNotFor.length / agents.length * 100).toFixed(1)}%)`)
  if (missingNotFor.length > 0) {
    console.log('   Top 10:')
    missingNotFor.slice(0, 10).forEach(a => console.log(`   - ${a.name} (${a.category})`))
  }

  console.log(`\n❌ Agents sans use_cases: ${missingUseCases.length} (${(missingUseCases.length / agents.length * 100).toFixed(1)}%)`)
  
  console.log(`\n❌ Agents sans setup_difficulty: ${missingDifficulty.length} (${(missingDifficulty.length / agents.length * 100).toFixed(1)}%)`)

  // ── Analyse 2 : Erreurs de catégorisation ─────────────────────────────────
  console.log('\n\n' + '═'.repeat(80))
  console.log('🏷️  ANALYSE 2 : ERREURS DE CATÉGORISATION')
  console.log('═'.repeat(80))

  const miscategorized: Array<{ agent: Agent; suggestedCategory: string; reason: string }> = []

  agents.forEach(agent => {
    const text = `${agent.name} ${agent.description} ${agent.use_cases.join(' ')}`.toLowerCase()
    
    // Vérifier si la description correspond mieux à une autre catégorie
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (category === agent.category) continue
      
      const matchCount = keywords.filter(kw => text.includes(kw.toLowerCase())).length
      
      // Si 3+ mots-clés d'une autre catégorie matchent, c'est suspect
      if (matchCount >= 3) {
        const currentCategoryMatch = CATEGORY_KEYWORDS[agent.category]?.filter(kw => 
          text.includes(kw.toLowerCase())
        ).length || 0
        
        // Si la catégorie suggérée a plus de matches que la catégorie actuelle
        if (matchCount > currentCategoryMatch) {
          miscategorized.push({
            agent,
            suggestedCategory: category,
            reason: `${matchCount} keywords match "${category}" vs ${currentCategoryMatch} for "${agent.category}"`
          })
        }
      }
    }
  })

  console.log(`\n⚠️  Agents potentiellement mal catégorisés: ${miscategorized.length}`)
  if (miscategorized.length > 0) {
    console.log('\n   Top 20 cas critiques:\n')
    miscategorized.slice(0, 20).forEach(({ agent, suggestedCategory, reason }) => {
      console.log(`   ❌ ${agent.name}`)
      console.log(`      Catégorie actuelle: ${agent.category}`)
      console.log(`      Catégorie suggérée: ${suggestedCategory}`)
      console.log(`      Raison: ${reason}`)
      console.log(`      Description: ${agent.description.substring(0, 100)}...`)
      console.log()
    })
  }

  // ── Analyse 3 : Cas spécifiques problématiques ────────────────────────────
  console.log('\n' + '═'.repeat(80))
  console.log('🎯 ANALYSE 3 : CAS SPÉCIFIQUES PROBLÉMATIQUES')
  console.log('═'.repeat(80))

  // Landing page builders mal catégorisés
  const landingPageTools = agents.filter(a => {
    const text = `${a.name} ${a.description} ${a.use_cases.join(' ')}`.toLowerCase()
    return (text.includes('landing page') || text.includes('page builder') || 
            text.includes('website builder') || text.includes('site web')) &&
           a.category !== 'website'
  })

  console.log(`\n🌐 Landing page builders mal catégorisés: ${landingPageTools.length}`)
  landingPageTools.forEach(a => {
    console.log(`   - ${a.name} (catégorie: ${a.category}, devrait être: website)`)
    console.log(`     ${a.description.substring(0, 100)}...`)
  })

  // Outils de code mal catégorisés
  const codingTools = agents.filter(a => {
    const text = `${a.name} ${a.description}`.toLowerCase()
    return (text.includes('ide') || text.includes('code editor') || 
            text.includes('copilot') || text.includes('coding')) &&
           a.category !== 'coding'
  })

  console.log(`\n💻 Outils de code mal catégorisés: ${codingTools.length}`)
  codingTools.forEach(a => {
    console.log(`   - ${a.name} (catégorie: ${a.category}, devrait être: coding)`)
  })

  // ── Analyse 4 : Distribution par catégorie ────────────────────────────────
  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ANALYSE 4 : DISTRIBUTION PAR CATÉGORIE')
  console.log('═'.repeat(80))

  const categoryCount: Record<string, number> = {}
  agents.forEach(a => {
    categoryCount[a.category] = (categoryCount[a.category] || 0) + 1
  })

  console.log('\n')
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = (count / agents.length * 100).toFixed(1)
      const bar = '█'.repeat(Math.floor(count / 10))
      console.log(`   ${cat.padEnd(15)} ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`)
    })

  // ── Analyse 5 : Agents avec descriptions vagues ───────────────────────────
  console.log('\n\n' + '═'.repeat(80))
  console.log('📝 ANALYSE 5 : QUALITÉ DES DESCRIPTIONS')
  console.log('═'.repeat(80))

  const shortDescriptions = agents.filter(a => a.description.length < 50)
  const vagueDescriptions = agents.filter(a => {
    const text = a.description.toLowerCase()
    return text.includes('outil') && text.split(' ').length < 15
  })

  console.log(`\n⚠️  Descriptions trop courtes (<50 chars): ${shortDescriptions.length}`)
  if (shortDescriptions.length > 0) {
    console.log('   Exemples:')
    shortDescriptions.slice(0, 5).forEach(a => {
      console.log(`   - ${a.name}: "${a.description}"`)
    })
  }

  console.log(`\n⚠️  Descriptions vagues: ${vagueDescriptions.length}`)

  // ── Génération du rapport JSON ────────────────────────────────────────────
  const report = {
    timestamp: new Date().toISOString(),
    total_agents: agents.length,
    data_quality: {
      missing_best_for: missingBestFor.length,
      missing_not_for: missingNotFor.length,
      missing_use_cases: missingUseCases.length,
      missing_difficulty: missingDifficulty.length,
    },
    miscategorized: miscategorized.map(m => ({
      id: m.agent.id,
      name: m.agent.name,
      current_category: m.agent.category,
      suggested_category: m.suggestedCategory,
      reason: m.reason
    })),
    landing_page_tools_miscategorized: landingPageTools.map(a => ({
      id: a.id,
      name: a.name,
      current_category: a.category,
      description: a.description
    })),
    category_distribution: categoryCount,
    critical_issues: {
      agents_without_best_for: missingBestFor.map(a => ({ id: a.id, name: a.name, category: a.category })),
      agents_without_not_for: missingNotFor.map(a => ({ id: a.id, name: a.name, category: a.category })),
    }
  }

  const reportPath = resolve(__dirname, '../agents_quality_report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n\n✅ Rapport détaillé sauvegardé: ${reportPath}`)

  // ── Résumé final ───────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(80))
  console.log('📋 RÉSUMÉ EXÉCUTIF')
  console.log('═'.repeat(80))

  const qualityScore = 100 - (
    (missingBestFor.length / agents.length * 30) +
    (missingNotFor.length / agents.length * 20) +
    (miscategorized.length / agents.length * 50)
  )

  console.log(`\n🎯 Score de qualité global: ${qualityScore.toFixed(1)}/100`)
  console.log('\n📊 Problèmes critiques à corriger:')
  console.log(`   1. ${miscategorized.length} agents mal catégorisés (impact: CRITIQUE)`)
  console.log(`   2. ${missingBestFor.length} agents sans best_for (impact: ÉLEVÉ)`)
  console.log(`   3. ${missingNotFor.length} agents sans not_for (impact: MOYEN)`)
  console.log(`   4. ${landingPageTools.length} landing page builders mal catégorisés (impact: CRITIQUE)`)

  console.log('\n💡 Recommandations:')
  console.log('   1. Recatégoriser les landing page builders en "website"')
  console.log('   2. Enrichir les best_for et not_for pour tous les agents')
  console.log('   3. Vérifier manuellement les top 20 agents mal catégorisés')
  console.log('   4. Améliorer les descriptions trop courtes ou vagues')
  console.log('\n' + '═'.repeat(80))
}

analyzeAgents()
