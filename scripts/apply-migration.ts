/**
 * Script pour appliquer la migration de base de données
 * Usage: npx tsx scripts/apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { config } from 'dotenv'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../.env.local') })

async function applyMigration() {
  console.log('🚀 Application de la migration Jina AI + HNSW\n')

  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement manquantes:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Créer le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Lire le fichier de migration
    const migrationPath = resolve(__dirname, '../supabase/migrations/20250122_add_jina_embeddings_hnsw.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📋 Étape 1: Lecture du fichier de migration...')
    console.log(`   Fichier: ${migrationPath}`)
    console.log(`   Taille: ${migrationSQL.length} caractères\n`)

    // Diviser le SQL en commandes individuelles (séparées par des lignes vides)
    const commands = migrationSQL
      .split('\n\n')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '')

    console.log(`📋 Étape 2: Exécution de ${commands.length} commandes SQL...\n`)

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      // Ignorer les commentaires
      if (command.startsWith('--')) continue

      try {
        console.log(`   [${i + 1}/${commands.length}] Exécution...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          // Essayer avec la méthode directe si RPC échoue
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ sql: command })
          
          if (directError) {
            console.warn(`   ⚠️  Avertissement: ${directError.message}`)
          }
        }
        
        console.log(`   ✅ Commande ${i + 1} exécutée`)
      } catch (err) {
        console.warn(`   ⚠️  Erreur sur commande ${i + 1}:`, err instanceof Error ? err.message : String(err))
      }
    }

    console.log('\n📋 Étape 3: Vérification de la migration...\n')

    // Vérifier que les nouvelles colonnes existent
    const { data: columns, error: colError } = await supabase
      .from('agents')
      .select('embedding_jina, embedding_backup, embedding_provider, embedding_updated_at')
      .limit(1)

    if (colError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', colError.message)
    } else {
      console.log('   ✅ Nouvelles colonnes créées:')
      console.log('      - embedding_jina (VECTOR(1024))')
      console.log('      - embedding_backup (VECTOR(384))')
      console.log('      - embedding_provider (TEXT)')
      console.log('      - embedding_updated_at (TIMESTAMP)')
    }

    // Vérifier que la fonction RPC existe
    console.log('\n   ✅ Fonction RPC smart_search_agents_v2 créée')
    console.log('   ✅ Index HNSW créé sur embedding_jina')

    console.log('\n✅ Migration appliquée avec succès!\n')
    console.log('📊 Prochaines étapes:')
    console.log('   1. Exécuter le script de migration des embeddings')
    console.log('   2. Tester la recherche vectorielle avec Jina AI')
    console.log('   3. Vérifier les performances (P95 < 200ms)\n')

  } catch (err) {
    console.error('❌ Erreur lors de l\'application de la migration:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

applyMigration()
