/**
 * Script d'enrichissement automatique des agents
 * Utilise Groq pour générer best_for et not_for manquants
 */

import fs from 'fs'
import path from 'path'
import Groq from 'groq-sdk'

const GROQ_API_KEY = process.env.GROQ_API_KEY
if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY manquante dans les variables d\'environnement')
  process.exit(1)
}

const groq = new Groq({ apiKey: GROQ_API_KEY })

interface Agent {
  id: string
  name: string
  category: string
  description: string
  use_cases: string[]
  best_for: string[]
  not_for: string[]
  [key: string]: any
}

async function enrichAgent(agent: Agent): Promise<{ best_for: string[], not_for: string[] }> {
  const prompt = `Tu es un expert en outils SaaS et IA. Analyse cet outil et génère des recommandations précises.

OUTIL: ${agent.name}
CATÉGORIE: ${agent.category}
DESCRIPTION: ${agent.description}
USE CASES: ${agent.use_cases.join(', ')}

INSTRUCTIONS:
1. Génère 3-5 profils/secteurs pour lesquels cet outil est PARFAIT (best_for)
2. Génère 2-4 cas d'usage pour lesquels cet outil est INADAPTÉ (not_for)

RÈGLES:
- Sois SPÉCIFIQUE (pas "marketeurs" mais "marketeurs de contenu B2B")
- Sois HONNÊTE sur les limites (not_for)
- Utilise des termes recherchables (mots-clés que les utilisateurs tapent)
- En français

EXEMPLES:
- best_for: ["créateurs de contenu", "agences marketing", "e-commerce", "startups tech"]
- not_for: ["sites e-commerce complexes", "applications mobiles", "bases de données"]

Réponds UNIQUEMENT en JSON strict, sans markdown:
{
  "best_for": ["profil 1", "profil 2", "profil 3"],
  "not_for": ["cas 1", "cas 2"]
}`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    })

    const text = response.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      best_for: parsed.best_for || [],
      not_for: parsed.not_for || [],
    }
  } catch (err) {
    console.error(`❌ Erreur pour ${agent.name}:`, err instanceof Error ? err.message : err)
    return { best_for: [], not_for: [] }
  }
}

async function main() {
  console.log('🚀 Enrichissement des agents...\n')

  const agentsPath = path.join(process.cwd(), 'agents_export.json')
  const agents: Agent[] = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'))

  // Filtrer les agents à enrichir
  const toEnrich = agents.filter(a => 
    (a.best_for?.length === 0 || !a.best_for) || 
    (a.not_for?.length === 0 || !a.not_for)
  )

  console.log(`📊 ${toEnrich.length} agents à enrichir sur ${agents.length} total\n`)

  let enriched = 0
  let failed = 0

  for (const agent of toEnrich) {
    console.log(`⏳ Enrichissement: ${agent.name}...`)

    const enrichment = await enrichAgent(agent)

    if (enrichment.best_for.length > 0 || enrichment.not_for.length > 0) {
      // Mettre à jour l'agent
      const index = agents.findIndex(a => a.id === agent.id)
      if (index !== -1) {
        if (enrichment.best_for.length > 0) {
          agents[index].best_for = enrichment.best_for
        }
        if (enrichment.not_for.length > 0) {
          agents[index].not_for = enrichment.not_for
        }
        console.log(`   ✅ best_for: [${enrichment.best_for.join(', ')}]`)
        console.log(`   ✅ not_for: [${enrichment.not_for.join(', ')}]`)
        enriched++
      }
    } else {
      console.log(`   ❌ Échec`)
      failed++
    }

    // Pause pour éviter le rate limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Sauvegarder
  const backupPath = path.join(process.cwd(), 'agents_export.backup.json')
  fs.writeFileSync(backupPath, JSON.stringify(agents, null, 2))
  fs.writeFileSync(agentsPath, JSON.stringify(agents, null, 2))

  console.log(`\n✅ Terminé!`)
  console.log(`   - ${enriched} agents enrichis`)
  console.log(`   - ${failed} échecs`)
  console.log(`   - Backup: ${backupPath}`)
}

main().catch(console.error)
