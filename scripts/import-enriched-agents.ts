/**
 * Script d'import des agents enrichis par Claude dans Supabase
 * 
 * Étapes :
 * 1. Fusionner tous les batches enrichis
 * 2. Filtrer les outils hors scope
 * 3. Générer les embeddings Jina AI
 * 4. Upsert dans Supabase
 */

import { createClient } from '@supabase/supabase-js'
import { embeddingService } from '../lib/embeddings/service'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Outils à exclure (hors scope productivité business)
const EXCLUDE_NAMES = new Set([
  'Replika', 'Trade Ideas', 'Tripplanner', 'Huntr', 'GAJIX',
  'Pantera Deals', 'Safebet', // à compléter selon les batches
])

interface EnrichedAgent {
  name: string
  category: string
  price_from: number
  use_cases: string[]
  best_for: string[]
  not_for: string[]
  score: number
  description?: string
  website_domain?: string
  setup_difficulty?: string
  time_to_value?: string
}

async function loadAllBatches(dir: string): Promise<EnrichedAgent[]> {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  console.log(`📂 Chargement de ${files.length} fichiers...`)
  
  const all: EnrichedAgent[] = []
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    const batch = JSON.parse(content)
    all.push(...batch)
    console.log(`  ✓ ${file}: ${batch.length} agents`)
  }
  
  return all
}

async function generateEmbedding(agent: EnrichedAgent): Promise<number[]> {
  const text = [
    agent.name,
    agent.description || '',
    ...agent.use_cases.slice(0, 5),
    ...agent.best_for.slice(0, 3),
  ].filter(Boolean).join('. ')
  
  const result = await embeddingService.generate(text)
  return result.vector
}

async function upsertAgent(agent: EnrichedAgent, embedding: number[]) {
  const { data, error } = await supabase
    .from('agents')
    .upsert({
      name: agent.name,
      category: agent.category,
      description: agent.description || `${agent.name} - ${agent.use_cases[0]}`,
      price_from: agent.price_from,
      score: agent.score,
      roi_score: agent.score,
      use_cases: agent.use_cases,
      compatible_with: [],
      best_for: agent.best_for,
      not_for: agent.not_for,
      integrations: [],
      website_domain: agent.website_domain || '',
      setup_difficulty: agent.setup_difficulty || 'easy',
      time_to_value: agent.time_to_value || '1 jour',
      embedding_jina: embedding,
    }, {
      onConflict: 'name', // Update si le nom existe déjà
    })
    .select()
  
  if (error) {
    console.error(`  ❌ ${agent.name}:`, error.message)
    return false
  }
  
  return true
}

async function main() {
  console.log('🚀 Import des agents enrichis dans Supabase\n')
  
  // Charger tous les batches
  const enrichedDir = path.join(__dirname, '../../vector-fix/enriched')
  const agents = await loadAllBatches(enrichedDir)
  console.log(`\n📊 Total: ${agents.length} agents chargés`)
  
  // Filtrer les outils hors scope
  const filtered = agents.filter(a => !EXCLUDE_NAMES.has(a.name))
  console.log(`✂️  Filtrés: ${agents.length - filtered.length} agents exclus`)
  console.log(`✅ À importer: ${filtered.length} agents\n`)
  
  // Import avec embeddings
  let success = 0
  let failed = 0
  
  for (let i = 0; i < filtered.length; i++) {
    const agent = filtered[i]
    console.log(`[${i+1}/${filtered.length}] ${agent.name}`)
    
    try {
      // Générer embedding
      const embedding = await generateEmbedding(agent)
      
      // Upsert dans Supabase
      const ok = await upsertAgent(agent, embedding)
      if (ok) {
        success++
        console.log(`  ✓ Importé`)
      } else {
        failed++
      }
      
      // Checkpoint tous les 50
      if ((i + 1) % 50 === 0) {
        console.log(`\n📊 Checkpoint: ${success} réussis, ${failed} échecs\n`)
      }
      
      // Rate limit Jina AI
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (err: any) {
      failed++
      console.error(`  ❌ Erreur:`, err.message)
    }
  }
  
  console.log(`\n✅ Import terminé`)
  console.log(`   Réussis: ${success}`)
  console.log(`   Échecs: ${failed}`)
}

main().catch(console.error)
