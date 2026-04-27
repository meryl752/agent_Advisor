/**
 * Script de test pour le service d'embeddings
 * Usage: npx tsx scripts/test-embedding-service.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(__dirname, '../.env.local') })

import { embeddingService } from '../lib/embeddings/service'

async function testEmbeddingService() {
  console.log('🧪 Test du service d\'embeddings\n')

  try {
    // Test 1: Génération d'embedding simple
    console.log('Test 1: Génération d\'embedding simple')
    const text1 = 'Je veux créer un site web pour mon restaurant italien'
    const result1 = await embeddingService.generate(text1)
    
    console.log(`✅ Embedding généré:`)
    console.log(`   - Provider: ${result1.provider}`)
    console.log(`   - Dimensions: ${result1.dimensions}`)
    console.log(`   - Latence: ${result1.latency_ms}ms`)
    console.log(`   - Retries: ${result1.retries}`)
    console.log(`   - Vecteur (premiers 5 éléments): [${result1.vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`)

    // Test 2: Génération d'embedding avec texte plus long
    console.log('Test 2: Génération d\'embedding avec texte long')
    const text2 = `
      Je cherche des outils d'IA pour automatiser mon marketing digital.
      J'ai besoin de créer du contenu pour les réseaux sociaux, 
      d'analyser les performances de mes campagnes,
      et de générer des visuels attractifs pour mes publicités.
      Mon budget est limité à 200€ par mois.
    `
    const result2 = await embeddingService.generate(text2)
    
    console.log(`✅ Embedding généré:`)
    console.log(`   - Provider: ${result2.provider}`)
    console.log(`   - Dimensions: ${result2.dimensions}`)
    console.log(`   - Latence: ${result2.latency_ms}ms`)
    console.log(`   - Retries: ${result2.retries}\n`)

    // Test 3: Statistiques du service
    console.log('Test 3: Statistiques du service')
    const stats = embeddingService.getStats()
    console.log(`✅ Statistiques:`)
    console.log(`   - Requêtes: ${stats.requests}`)
    console.log(`   - Erreurs: ${stats.errors}`)
    console.log(`   - Latence moyenne: ${stats.avgLatency}ms`)
    console.log(`   - Taux d'erreur: ${stats.errorRate}\n`)

    console.log('✅ Tous les tests ont réussi!')
  } catch (err) {
    console.error('❌ Erreur lors des tests:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

testEmbeddingService()
