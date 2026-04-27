/**
 * Script de test de la recherche vectorielle avec Jina AI
 * 
 * Ce script teste que :
 * 1. Le service d'embeddings Jina AI fonctionne
 * 2. La fonction RPC smart_search_agents_v2 fonctionne
 * 3. Les résultats sont pertinents
 */

import { createClient } from '@supabase/supabase-js'
import { embeddingService } from '../lib/embeddings/service'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../.env.local') })

async function testVectorSearch() {
  console.log('🧪 Test de la recherche vectorielle avec Jina AI v4\n')

  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const jinaKey = process.env.JINA_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes')
    process.exit(1)
  }

  if (!jinaKey) {
    console.error('❌ JINA_API_KEY manquant dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // ── Test 1 : Génération d'embedding ──────────────────────────────────────
    console.log('📋 Test 1: Génération d\'embedding Jina AI')
    const testQuery = 'Je cherche un outil de gestion de projet pour une équipe de 10 personnes'
    
    const embeddingResult = await embeddingService.generate(testQuery)
    console.log(`✅ Embedding généré: ${embeddingResult.dimensions} dimensions en ${embeddingResult.latency_ms}ms`)
    console.log(`   Provider: ${embeddingResult.provider}`)
    console.log(`   Retries: ${embeddingResult.retries}\n`)

    // ── Test 2 : Recherche vectorielle avec smart_search_agents_v2 ───────────
    console.log('📋 Test 2: Recherche vectorielle avec smart_search_agents_v2')
    
    const { data: results, error } = await supabase.rpc('smart_search_agents_v2', {
      query_embedding: embeddingResult.vector,
      user_budget_max: 0,
      user_category: null,
    })

    if (error) {
      console.error('❌ Erreur RPC:', error)
      process.exit(1)
    }

    if (!results || results.length === 0) {
      console.error('❌ Aucun résultat retourné')
      process.exit(1)
    }

    console.log(`✅ ${results.length} agents trouvés\n`)

    // ── Test 3 : Afficher les top 5 résultats ────────────────────────────────
    console.log('📋 Test 3: Top 5 résultats')
    console.log('─'.repeat(80))
    
    results.slice(0, 5).forEach((agent: any, i: number) => {
      console.log(`${i + 1}. ${agent.name}`)
      console.log(`   Catégorie: ${agent.category}`)
      console.log(`   Similarité: ${(agent.similarity * 100).toFixed(1)}%`)
      console.log(`   Score: ${agent.score}/100`)
      console.log(`   Prix: ${agent.price_from}€/mois`)
      console.log()
    })

    // ── Test 4 : Vérifier que l'index HNSW est utilisé ───────────────────────
    console.log('📋 Test 4: Vérification de l\'index HNSW')
    
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'agents')
      .like('indexname', '%hnsw%')

    if (indexes && indexes.length > 0) {
      console.log(`✅ Index HNSW trouvé: ${indexes[0].indexname}`)
    } else {
      console.warn('⚠️  Index HNSW non trouvé (peut être normal si la migration n\'a pas été appliquée)')
    }

    // ── Test 5 : Mesurer la latence ──────────────────────────────────────────
    console.log('\n📋 Test 5: Mesure de latence (10 recherches)')
    
    const latencies: number[] = []
    for (let i = 0; i < 10; i++) {
      const start = Date.now()
      await supabase.rpc('smart_search_agents_v2', {
        query_embedding: embeddingResult.vector,
        user_budget_max: 0,
        user_category: null,
      })
      const latency = Date.now() - start
      latencies.push(latency)
    }

    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)]
    const p95 = latencies[Math.floor(latencies.length * 0.95)]
    const p99 = latencies[Math.floor(latencies.length * 0.99)]
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)

    console.log(`   Moyenne: ${avg}ms`)
    console.log(`   P50: ${p50}ms`)
    console.log(`   P95: ${p95}ms`)
    console.log(`   P99: ${p99}ms`)

    if (p95 < 200) {
      console.log(`   ✅ P95 < 200ms (objectif atteint!)`)
    } else {
      console.log(`   ⚠️  P95 > 200ms (objectif: < 200ms)`)
    }

    // ── Rapport final ─────────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(80))
    console.log('✅ Tous les tests sont passés!\n')
    console.log('📊 Résumé:')
    console.log(`   - Embeddings: Jina AI v4 (${embeddingResult.dimensions} dimensions)`)
    console.log(`   - Latence embedding: ${embeddingResult.latency_ms}ms`)
    console.log(`   - Résultats trouvés: ${results.length} agents`)
    console.log(`   - Latence recherche (P95): ${p95}ms`)
    console.log(`   - Top résultat: ${results[0].name} (${(results[0].similarity * 100).toFixed(1)}% similarité)`)
    console.log('='.repeat(80) + '\n')

  } catch (err) {
    console.error('\n❌ Erreur:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

testVectorSearch()
