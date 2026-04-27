/**
 * Script pour vérifier l'existence et l'utilisation de l'index HNSW
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.local') })

async function checkHNSWIndex() {
  console.log('🔍 Vérification de l\'index HNSW\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Vérifier les index sur la table agents
    console.log('📋 Recherche des index sur la table agents...\n')
    
    const { data: indexes, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'agents'
        ORDER BY indexname;
      `
    })

    if (error) {
      // Essayer une autre méthode si exec_sql n'existe pas
      console.log('Méthode alternative...\n')
      
      // Vérifier directement via une requête
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('embedding_jina, embedding_backup')
        .limit(1)
      
      if (agentsError) {
        console.error('❌ Erreur:', agentsError)
        process.exit(1)
      }

      console.log('✅ Colonnes trouvées:')
      if (agents && agents.length > 0) {
        const agent = agents[0] as any
        console.log(`   - embedding_jina: ${agent.embedding_jina ? 'EXISTS' : 'NULL'}`)
        console.log(`   - embedding_backup: ${agent.embedding_backup ? 'EXISTS' : 'NULL'}`)
      }
      
      console.log('\n⚠️  Impossible de vérifier les index directement.')
      console.log('   Vérifie manuellement dans Supabase Dashboard → Database → agents → Indexes')
      console.log('\n📋 Pour créer l\'index HNSW manuellement, exécute ce SQL:')
      console.log(`
CREATE INDEX IF NOT EXISTS agents_embedding_jina_hnsw_idx 
ON agents 
USING hnsw (embedding_jina vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
      `)
      return
    }

    if (indexes && indexes.length > 0) {
      console.log(`✅ ${indexes.length} index trouvés:\n`)
      indexes.forEach((idx: any) => {
        console.log(`   - ${idx.indexname}`)
        if (idx.indexname.includes('hnsw')) {
          console.log(`     ✅ Index HNSW trouvé!`)
        }
      })
    } else {
      console.log('⚠️  Aucun index trouvé')
    }

  } catch (err) {
    console.error('❌ Erreur:', err instanceof Error ? err.message : String(err))
  }
}

checkHNSWIndex()
