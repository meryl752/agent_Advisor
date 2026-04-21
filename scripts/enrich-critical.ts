/**
 * Enrichissement manuel des 12 agents critiques
 * Données curées manuellement pour garantir la qualité
 */

import fs from 'fs'
import path from 'path'

interface Agent {
  id: string
  name: string
  best_for: string[]
  not_for: string[]
  [key: string]: any
}

// Données curées manuellement pour les 12 agents critiques
const ENRICHMENTS: Record<string, { best_for: string[], not_for: string[] }> = {
  'Claude Sonnet': {
    best_for: ['rédacteurs', 'analystes', 'développeurs', 'consultants', 'chercheurs'],
    not_for: ['création de sites web', 'design graphique', 'montage vidéo', 'génération d\'images'],
  },
  'Midjourney': {
    best_for: ['designers', 'créateurs de contenu', 'marketeurs', 'illustrateurs', 'artistes'],
    not_for: ['sites web fonctionnels', 'applications', 'réservations', 'e-commerce', 'bases de données'],
  },
  'Perplexity Pro': {
    best_for: ['chercheurs', 'analystes', 'journalistes', 'consultants', 'étudiants'],
    not_for: ['création de contenu', 'design', 'automatisation', 'sites web'],
  },
  'Buffer AI': {
    best_for: ['community managers', 'marketeurs sociaux', 'agences', 'créateurs de contenu'],
    not_for: ['e-commerce', 'sites web', 'CRM', 'prospection'],
  },
  'Clay': {
    best_for: ['équipes sales', 'growth hackers', 'prospecteurs B2B', 'agences'],
    not_for: ['sites web', 'design', 'contenu créatif', 'SEO'],
  },
  'Make.com': {
    best_for: ['no-coders', 'ops managers', 'automatiseurs', 'startups', 'PME'],
    not_for: ['développement complexe', 'applications mobiles', 'sites web publics'],
  },
  'Polar Analytics': {
    best_for: ['e-commerce', 'data analysts', 'CMO', 'growth teams'],
    not_for: ['sites web', 'contenu', 'prospection', 'design'],
  },
  'Canva AI': {
    best_for: ['non-designers', 'marketeurs', 'réseaux sociaux', 'startups', 'solopreneurs'],
    not_for: ['sites web complexes', 'applications', 'design professionnel haut de gamme'],
  },
  'Apollo.io': {
    best_for: ['équipes sales B2B', 'prospecteurs', 'SDR', 'agences'],
    not_for: ['sites web', 'design', 'contenu', 'e-commerce B2C'],
  },
  'Instantly AI': {
    best_for: ['cold email', 'prospection B2B', 'agences', 'sales teams'],
    not_for: ['sites web', 'design', 'SEO', 'contenu créatif'],
  },
  'Tidio AI': {
    best_for: ['e-commerce', 'support client', 'PME', 'sites web'],
    not_for: ['prospection', 'analytics avancé', 'design', 'contenu'],
  },
  'Surfer SEO': {
    best_for: ['rédacteurs SEO', 'agences', 'blogueurs', 'marketeurs de contenu'],
    not_for: ['sites web', 'design', 'prospection', 'automatisation'],
  },
}

async function main() {
  console.log('🚀 Enrichissement des 12 agents critiques...\n')

  const agentsPath = path.join(process.cwd(), 'agents_export.json')
  const agents: Agent[] = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'))

  // Backup
  const backupPath = path.join(process.cwd(), 'agents_export.backup.json')
  fs.writeFileSync(backupPath, JSON.stringify(agents, null, 2))
  console.log(`💾 Backup créé: ${backupPath}\n`)

  let enriched = 0

  for (const [agentName, enrichment] of Object.entries(ENRICHMENTS)) {
    const index = agents.findIndex(a => a.name === agentName)
    
    if (index !== -1) {
      agents[index].best_for = enrichment.best_for
      agents[index].not_for = enrichment.not_for
      
      console.log(`✅ ${agentName}`)
      console.log(`   best_for: [${enrichment.best_for.join(', ')}]`)
      console.log(`   not_for: [${enrichment.not_for.join(', ')}]\n`)
      
      enriched++
    } else {
      console.log(`❌ ${agentName} non trouvé\n`)
    }
  }

  // Sauvegarder
  fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2))

  console.log(`\n✅ Terminé! ${enriched}/12 agents enrichis`)
  console.log(`📁 Fichier mis à jour: ${agentsPath}`)
}

main().catch(console.error)
