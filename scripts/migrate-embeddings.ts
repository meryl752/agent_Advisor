/**
 * Script de migration des embeddings vers Jina AI v4
 * 
 * Ce script régénère tous les embeddings existants en utilisant Jina AI v4
 * au lieu de HuggingFace, et les stocke dans la nouvelle colonne embedding_jina.
 * 
 * Usage:
 *   npx tsx scripts/migrate-embeddings.ts                    # Migration complète
 *   npx tsx scripts/migrate-embeddings.ts --dry-run          # Simulation sans modifications
 *   npx tsx scripts/migrate-embeddings.ts --limit 10         # Migrer seulement 10 agents
 *   npx tsx scripts/migrate-embeddings.ts --priority         # Migrer les top agents d'abord
 */

import { createClient } from '@supabase/supabase-js'
import { embeddingService } from '../lib/embeddings/service'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../.env.local') })

interface MigrationOptions {
  dryRun: boolean
  limit?: number
  priority: boolean
  batchSize: number
}

interface Agent {
  id: string
  name: string
  description: string
  use_cases: string[]
  score: number
}

async function migrateEmbeddings(options: MigrationOptions) {
  const { dryRun, limit, priority, batchSize } = options

  console.log('🚀 Migration des embeddings vers Jina AI v4\n')
  
  if (dryRun) {
    console.log('⚠️  Mode DRY-RUN - Aucune modification ne sera effectuée\n')
  }

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
    // ── Étape 1 : Récupérer les agents à migrer ──────────────────────────────
    console.log('📋 Étape 1: Récupération des agents...')
    
    let query = supabase
      .from('agents')
      .select('id, name, description, use_cases, score')

    // Trier par score si mode prioritaire
    if (priority) {
      query = query.order('score', { ascending: false })
      console.log('   Mode prioritaire: migration des top agents d\'abord')
    }

    // Limiter le nombre d'agents si spécifié
    if (limit) {
      query = query.limit(limit)
      console.log(`   Limite: ${limit} agents`)
    }

    const { data: agents, error } = await query

    if (error || !agents) {
      console.error('❌ Erreur lors de la récupération des agents:', error)
      process.exit(1)
    }

    console.log(`✅ ${agents.length} agents à migrer\n`)

    // ── Étape 2 : Migrer les embeddings par batch ────────────────────────────
    console.log('📋 Étape 2: Migration des embeddings...\n')

    let migrated = 0
    let failed = 0
    let skipped = 0
    const errors: Array<{ agent: string; error: string }> = []
    const startTime = Date.now()

    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize)
      
      console.log(`\n🔄 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(agents.length / batchSize)} (${batch.length} agents)`)

      for (const agent of batch) {
        try {
          // Construire le texte pour l'embedding
          const text = [
            agent.name,
            agent.description || '',
            ...(agent.use_cases || []),
          ].filter(Boolean).join(' ')

          if (!text.trim()) {
            console.log(`   ⏭️  ${agent.name} - Pas de texte, ignoré`)
            skipped++
            continue
          }

          // Générer le nouvel embedding avec Jina AI
          const result = await embeddingService.generate(text)

          if (!dryRun) {
            // Mettre à jour la base de données
            const { error: updateError } = await supabase
              .from('agents')
              .update({
                embedding_jina: result.vector,
                embedding_provider: 'jina',
                embedding_updated_at: new Date().toISOString(),
              })
              .eq('id', agent.id)

            if (updateError) {
              throw new Error(`DB update failed: ${updateError.message}`)
            }
          }

          migrated++
          console.log(`   ✅ ${agent.name} - ${result.dimensions}D en ${result.latency_ms}ms`)

        } catch (err) {
          failed++
          const errorMsg = err instanceof Error ? err.message : String(err)
          errors.push({ agent: agent.name, error: errorMsg })
          console.log(`   ❌ ${agent.name} - ${errorMsg}`)
        }
      }

      // Pause entre les batches pour éviter les rate limits
      if (i + batchSize < agents.length) {
        console.log('   ⏸️  Pause 2s...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // ── Étape 3 : Rapport final ──────────────────────────────────────────────
    const totalTime = Date.now() - startTime
    const avgTime = migrated > 0 ? Math.round(totalTime / migrated) : 0

    console.log('\n\n' + '='.repeat(60))
    console.log('✅ Migration terminée!\n')
    console.log('📊 Rapport:')
    console.log(`   - Agents migrés: ${migrated}`)
    console.log(`   - Échecs: ${failed}`)
    console.log(`   - Ignorés: ${skipped}`)
    console.log(`   - Temps total: ${(totalTime / 1000).toFixed(1)}s`)
    console.log(`   - Temps moyen par agent: ${avgTime}ms`)
    console.log(`   - Fallback HuggingFace: ${embeddingService.getStats().errors}`)

    if (errors.length > 0) {
      console.log(`\n❌ Erreurs (${errors.length}):`)
      errors.slice(0, 10).forEach(e => {
        console.log(`   - ${e.agent}: ${e.error}`)
      })
      if (errors.length > 10) {
        console.log(`   ... et ${errors.length - 10} autres erreurs`)
      }
    }

    console.log('\n📋 Prochaines étapes:')
    if (dryRun) {
      console.log('   1. Relancer sans --dry-run pour appliquer la migration')
    } else {
      console.log('   1. Vérifier que les embeddings sont bien créés')
      console.log('   2. Tester la recherche vectorielle')
      console.log('   3. Mesurer les performances (P95 < 200ms)')
    }
    console.log('='.repeat(60) + '\n')

  } catch (err) {
    console.error('\n❌ Erreur fatale:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : undefined,
  priority: args.includes('--priority'),
  batchSize: 10, // 10 agents par batch pour éviter les rate limits
}

// Afficher l'aide si demandé
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/migrate-embeddings.ts [options]

Options:
  --dry-run          Simulation sans modifications
  --limit <number>   Migrer seulement N agents
  --priority         Migrer les top agents d'abord (par score)
  --help, -h         Afficher cette aide

Exemples:
  npx tsx scripts/migrate-embeddings.ts
  npx tsx scripts/migrate-embeddings.ts --dry-run
  npx tsx scripts/migrate-embeddings.ts --limit 10
  npx tsx scripts/migrate-embeddings.ts --priority --limit 50
  `)
  process.exit(0)
}

migrateEmbeddings(options)
