#!/usr/bin/env tsx
/**
 * Script de test pour vérifier le moteur de recommandation
 * après les modifications des poids du Matcher
 * 
 * Usage: npx tsx scripts/test-recommendation.ts
 */

import { orchestrateRecommendation } from '@/lib/agents/orchestrator'
import type { UserContext } from '@/lib/agents/types'

// ─── Test Cases ───────────────────────────────────────────────────────────────

const TEST_CASES: Array<{ name: string; context: UserContext; expectedTop3: string[] }> = [
  {
    name: 'Landing Page SaaS',
    context: {
      objective: 'I want to create an ultra-fast landing page for my new SaaS project. I need complete control over the design, smooth animations, and the ability to export the code or add custom React components if needed.',
      sector: 'Tech/SaaS',
      team_size: 'solo',
      budget: 'medium',
      tech_level: 'advanced',
      timeline: 'weeks',
      current_tools: [],
    },
    expectedTop3: ['Framer AI', 'v0.dev', 'Webflow'],
  },
  {
    name: 'Boutique Dropshipping',
    context: {
      objective: 'Je veux lancer une boutique dropshipping Shopify avec des produits tendance',
      sector: 'E-commerce',
      team_size: 'solo',
      budget: 'low',
      tech_level: 'beginner',
      timeline: 'asap',
      current_tools: [],
    },
    expectedTop3: ['Shopify', 'Minea', 'AutoDS'],
  },
  {
    name: 'API REST TypeScript',
    context: {
      objective: 'Développer une API REST avec TypeScript, PostgreSQL et authentification JWT',
      sector: 'Tech/SaaS',
      team_size: 'small',
      budget: 'medium',
      tech_level: 'advanced',
      timeline: 'weeks',
      current_tools: [],
    },
    expectedTop3: ['Cursor', 'GitHub Copilot', 'Replit AI'],
  },
]

// ─── Test Runner ──────────────────────────────────────────────────────────────

async function runTests() {
  console.log('🧪 Test du moteur de recommandation\n')
  console.log('═'.repeat(80))
  
  for (const testCase of TEST_CASES) {
    console.log(`\n📋 Test: ${testCase.name}`)
    console.log('─'.repeat(80))
    console.log(`Objectif: ${testCase.context.objective.slice(0, 100)}...`)
    console.log(`Attendu (top 3): ${testCase.expectedTop3.join(', ')}`)
    console.log()
    
    try {
      const result = await orchestrateRecommendation(testCase.context)
      
      if (!result) {
        console.log('❌ Erreur: Aucun résultat retourné')
        continue
      }
      
      const top3 = result.agents.slice(0, 3).map(a => a.name)
      console.log(`✅ Résultat (top 3): ${top3.join(', ')}`)
      
      // Vérifier si au moins 2 des 3 attendus sont dans le top 5
      const top5 = result.agents.slice(0, 5).map(a => a.name)
      const matches = testCase.expectedTop3.filter(expected => 
        top5.includes(expected)
      )
      
      if (matches.length >= 2) {
        console.log(`✅ Test RÉUSSI (${matches.length}/3 agents attendus dans le top 5)`)
      } else {
        console.log(`⚠️  Test PARTIEL (${matches.length}/3 agents attendus dans le top 5)`)
      }
      
      // Afficher les scores détaillés
      console.log('\n📊 Scores détaillés (top 5):')
      result.agents.slice(0, 5).forEach((agent, idx) => {
        console.log(`  ${idx + 1}. ${agent.name.padEnd(20)} - ${agent.category.padEnd(15)} - Score: ${agent.score}/100`)
      })
      
    } catch (err) {
      console.log(`❌ Erreur: ${err instanceof Error ? err.message : String(err)}`)
    }
    
    console.log()
  }
  
  console.log('═'.repeat(80))
  console.log('✅ Tests terminés\n')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

runTests().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
