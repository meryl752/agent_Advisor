/**
 * Script de migration des embeddings vers Jina AI (1024D, colonne embedding_jina).
 *
 * Usage:
 *   npx tsx scripts/migrate-embeddings.ts [--dry-run] [--limit N] [--priority] [--only-missing] [--delay-ms 250]
 */

import { createClient } from '@supabase/supabase-js'
import { embeddingService } from '../lib/embeddings/service'
import { buildAgentDocumentText } from '../lib/embeddings/buildAgentDocumentText'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

interface MigrationOptions {
  dryRun: boolean
  limit?: number
  priority: boolean
  batchSize: number
  onlyMissing: boolean
  delayMs: number
}

interface Agent {
  id: string
  name: string
  category: string | null
  description: string | null
  use_cases: string[] | null
  best_for: string[] | null
  not_for: string[] | null
  score: number
}

function parseArgInt(flag: string, fallback: number): number {
  const i = process.argv.indexOf(flag)
  if (i === -1 || !process.argv[i + 1]) return fallback
  const n = parseInt(process.argv[i + 1], 10)
  return Number.isFinite(n) ? n : fallback
}

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function migrateEmbeddings(options: MigrationOptions) {
  const { dryRun, limit, priority, batchSize, onlyMissing, delayMs } = options

  console.log('🚀 Migration des embeddings Jina (embedding_jina)\n')
  if (onlyMissing) console.log('   Filtre: uniquement les agents sans embedding_jina\n')
  if (dryRun) console.log('⚠️  Mode DRY-RUN — aucune écriture en base\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const jinaKey = process.env.JINA_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    process.exit(1)
  }
  if (!jinaKey) {
    console.error('❌ JINA_API_KEY manquant dans .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('📋 Étape 1: lecture des agents...')

    let query = supabase
      .from('agents')
      .select('id, name, category, description, use_cases, best_for, not_for, score')

    if (onlyMissing) query = query.is('embedding_jina', null)
    if (priority) {
      query = query.order('score', { ascending: false })
      console.log('   Tri: score décroissant (--priority)')
    }
    if (limit) {
      query = query.limit(limit)
      console.log(`   Limite: ${limit} agents`)
    }

    const { data: agents, error } = await query

    if (error || !agents) {
      console.error('❌ Erreur lecture agents:', error)
      process.exit(1)
    }

    console.log(`✅ ${agents.length} agent(s) à traiter\n`)

    let migrated = 0
    let failed = 0
    let skipped = 0
    const errors: Array<{ agent: string; error: string }> = []
    const startTime = Date.now()

    const list = agents as Agent[]

    for (let gi = 0; gi < list.length; gi++) {
      const agent = list[gi]
      if (gi === 0 || gi % batchSize === 0) {
        console.log(`\n🔄 Progression ${gi + 1}/${list.length} — ${agent.name}`)
      }

      try {
        const text = buildAgentDocumentText(agent)
        if (!text.trim()) {
          console.log(`   ⏭️  ${agent.name} — texte vide, ignoré`)
          skipped++
          continue
        }

        const result = await embeddingService.generate(text)

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('agents')
            .update({
              embedding_jina: result.vector,
              embedding_provider: 'jina',
              embedding_updated_at: new Date().toISOString(),
            })
            .eq('id', agent.id)

          if (updateError) throw new Error(`DB: ${updateError.message}`)
        }

        migrated++
        if ((gi + 1) % 20 === 0 || gi === list.length - 1) {
          console.log(`   … ${gi + 1}/${list.length} traités (dernier: ${agent.name}, ${result.latency_ms}ms)`)
        }

        if (delayMs > 0 && gi < list.length - 1) await sleep(delayMs)
      } catch (err) {
        failed++
        const errorMsg = err instanceof Error ? err.message : String(err)
        errors.push({ agent: agent.name, error: errorMsg })
        console.log(`   ❌ ${agent.name} — ${errorMsg}`)
        if (delayMs > 0 && gi < list.length - 1) await sleep(delayMs)
      }

      if ((gi + 1) % batchSize === 0 && gi < list.length - 1) {
        console.log('   ⏸️  Pause 2s entre lots…')
        await sleep(2000)
      }
    }

    const totalTime = Date.now() - startTime
    console.log('\n' + '='.repeat(60))
    console.log('Terminé\n')
    console.log(`   Migrés / simulés: ${migrated}`)
    console.log(`   Échecs: ${failed}`)
    console.log(`   Ignorés: ${skipped}`)
    console.log(`   Durée: ${(totalTime / 1000).toFixed(1)}s`)
    if (errors.length) {
      console.log(`\n   Premières erreurs:`)
      errors.slice(0, 8).forEach(e => console.log(`   - ${e.agent}: ${e.error}`))
      if (errors.length > 8) console.log(`   … +${errors.length - 8}`)
    }
    if (!dryRun && migrated > 0) {
      console.log('\n   Ensuite: npx tsx scripts/analyze-agent-catalog.ts')
    }
    console.log('='.repeat(60) + '\n')
  } catch (err) {
    console.error('\n❌ Erreur fatale:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

const args = process.argv.slice(2)

const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : undefined,
  priority: args.includes('--priority'),
  batchSize: parseArgInt('--batch-size', 10),
  onlyMissing: args.includes('--only-missing'),
  delayMs: parseArgInt('--delay-ms', 200),
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx tsx scripts/migrate-embeddings.ts [options]

Options:
  --dry-run           Simulation (appels Jina réels, pas d’update DB)
  --limit <n>         Traiter au plus n agents
  --priority          Trier par score décroissant
  --only-missing      Uniquement embedding_jina IS NULL (recommandé après une import partielle)
  --delay-ms <n>      Pause entre chaque agent (ms), défaut 200 ; 0 pour max vitesse
  --batch-size <n>    Taille de lot pour les pauses entre lots, défaut 10
  --help, -h          Aide

Exemples:
  npx tsx scripts/migrate-embeddings.ts --only-missing --delay-ms 250
  npx tsx scripts/migrate-embeddings.ts --dry-run --limit 5
  npx tsx scripts/migrate-embeddings.ts --priority --limit 100
`)
  process.exit(0)
}

migrateEmbeddings(options)
