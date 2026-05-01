/**
 * Detect French text in agent fields and replace with English equivalents.
 * Uses a static translation map — no external API calls.
 *
 * Usage:
 *   node scripts/db-translate-to-english.mjs          # dry-run (no writes)
 *   node scripts/db-translate-to-english.mjs --apply  # commit updates
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

// ---------------------------------------------------------------------------
// French detection (exported for testing)
// ---------------------------------------------------------------------------

export const FRENCH_INDICATORS = [
  /\b(avec|pour|les|des|une|est|dans|sur|par|qui|que|pas|plus|très|aussi|mais|donc|car|ou|et|du|au|aux|ce|se|sa|son|ses|leur|leurs|nous|vous|ils|elles|je|tu|il|elle|on|mon|ton|ma|ta|mes|tes|nos|vos|un|la|le|en|de|à|y|ne|ni)\b/i,
  /[àâäéèêëîïôùûüçœæ]/,
]

/**
 * Returns true if the text contains French indicators.
 * @param {string} text
 * @returns {boolean}
 */
export function isFrench(text) {
  if (!text || typeof text !== 'string') return false
  return FRENCH_INDICATORS.some(re => re.test(text))
}

// ---------------------------------------------------------------------------
// Static translation map (exported for testing)
// ---------------------------------------------------------------------------

export const TRANSLATIONS = {
  // Descriptions
  'Moteur de recherche IA pour la veille et la recherche en temps réel.':
    'AI-powered search engine for real-time research and competitive intelligence.',
  'Planification de contenu social avec suggestions IA.':
    'Social content scheduling with AI-powered suggestions.',
  'Enrichissement de données et personnalisation d\'outreach à l\'IA.':
    'AI-powered data enrichment and outreach personalization.',
  'Meilleur modèle LLM pour la rédaction, l\'analyse et le code.':
    'Top LLM model for writing, analysis, and code generation.',
  'Modèle open source de génération d\'images, auto-hébergeable.':
    'Open-source self-hostable image generation model.',
  'Automatisation open source auto-hébergeable, très flexible.':
    'Open-source self-hostable automation platform, highly flexible.',
  'Outil de prospection et d\'enrichissement de données B2B.':
    'B2B prospecting and data enrichment tool.',
  'Plateforme de création de contenu IA pour le copywriting et le marketing.':
    'AI content creation platform for copywriting and marketing.',
  'Outil de planification et d\'analyse des réseaux sociaux.':
    'Social media scheduling and analytics tool.',
  'Plateforme d\'automatisation du marketing par email.':
    'Email marketing automation platform.',
  'Outil de recherche de mots-clés et d\'analyse SEO.':
    'Keyword research and SEO analysis tool.',
  'Plateforme de gestion de la relation client (CRM).':
    'Customer relationship management (CRM) platform.',
  'Outil de création de vidéos IA avec avatars.':
    'AI video creation tool with avatars.',
  'Plateforme d\'analyse web et de suivi des conversions.':
    'Web analytics and conversion tracking platform.',
  'Assistant IA pour la gestion de boutique e-commerce.':
    'AI assistant for e-commerce store management.',
  'Outil de support client e-commerce centralisé.':
    'Centralized e-commerce customer support tool.',
  'Plateforme de recherche de contacts B2B en temps réel.':
    'Real-time B2B contact search platform.',
  'Outil d\'optimisation de contenu SEO en temps réel.':
    'Real-time SEO content optimization tool.',
  'Modèle de génération d\'images par OpenAI.':
    'Image generation model by OpenAI.',
  'Outil de création de vidéos IA multilingues.':
    'Multilingual AI video creation tool.',
  'Plateforme d\'analyse web gratuite de Google.':
    'Free web analytics platform by Google.',
  'IDE avec assistance IA pour le développement.':
    'AI-assisted IDE for software development.',
  'API de recherche web optimisée pour les agents IA.':
    'Web search API optimized for AI agents.',

  // best_for / not_for / use_cases array values
  'chercheurs': 'researchers',
  'analystes': 'analysts',
  'journalistes': 'journalists',
  'consultants': 'consultants',
  'étudiants': 'students',
  'création de contenu': 'content creation',
  'design': 'design',
  'automatisation': 'automation',
  'sites web': 'websites',
  'community managers': 'community managers',
  'marketeurs sociaux': 'social media marketers',
  'agences': 'agencies',
  'créateurs de contenu': 'content creators',
  'e-commerce': 'e-commerce',
  'CRM': 'CRM',
  'prospection': 'prospecting',
  'équipes sales': 'sales teams',
  'growth hackers': 'growth hackers',
  'prospecteurs B2B': 'B2B prospectors',
  'contenu créatif': 'creative content',
  'SEO': 'SEO',
  'rédacteurs': 'writers',
  'développeurs': 'developers',
  'création de sites web': 'website creation',
  'design graphique': 'graphic design',
  'montage vidéo': 'video editing',
  'génération d\'images': 'image generation',
  'usage intensif': 'high-volume usage',
  'équipes techniques': 'technical teams',
  '1 jour': '1 day',
  '1 semaine': '1 week',
  '2 semaines': '2 weeks',
  '1 mois': '1 month',
  'Facile': 'Easy',
  'Moyen': 'Medium',
  'Difficile': 'Hard',
  'tous': 'all',
  'marketeurs': 'marketers',
  'équipes marketing': 'marketing teams',
  'PME': 'SMBs',
  'grandes entreprises': 'large enterprises',
  'startups': 'startups',
  'freelances': 'freelancers',
  'solopreneurs': 'solopreneurs',
  'équipes RH': 'HR teams',
  'équipes commerciales': 'sales teams',
  'équipes support': 'support teams',
  'non-développeurs': 'non-developers',
  'utilisateurs non techniques': 'non-technical users',
  'petites équipes': 'small teams',
  'grandes équipes': 'large teams',
  'entreprises B2B': 'B2B companies',
  'entreprises B2C': 'B2C companies',
  'e-commerçants': 'e-commerce merchants',
  'influenceurs': 'influencers',
  'créateurs': 'creators',
  'fondateurs': 'founders',
  'dirigeants': 'executives',
  'managers': 'managers',
  'commerciaux': 'salespeople',
  'recruteurs': 'recruiters',
  'formateurs': 'trainers',
  'enseignants': 'teachers',
  'médecins': 'doctors',
  'avocats': 'lawyers',
  'comptables': 'accountants',
  'ingénieurs': 'engineers',
  'designers': 'designers',
  'photographes': 'photographers',
  'vidéastes': 'videographers',
  'podcasters': 'podcasters',
  'blogueurs': 'bloggers',
  'rédaction': 'writing',
  'analyse': 'analysis',
  'recherche': 'research',
  'automatisation des emails': 'email automation',
  'gestion de projet': 'project management',
  'service client': 'customer service',
  'génération de leads': 'lead generation',
  'optimisation SEO': 'SEO optimization',
  'création d\'images': 'image creation',
  'création de vidéos': 'video creation',
  'analyse de données': 'data analysis',
  'intégration d\'outils': 'tool integration',
  'personnalisation': 'personalization',
  'segmentation': 'segmentation',
  'reporting': 'reporting',
  'tableau de bord': 'dashboard',
  'collaboration': 'collaboration',
  'gestion des tâches': 'task management',
  'planification': 'scheduling',
  'publication': 'publishing',
  'suivi': 'tracking',
  'optimisation': 'optimization',
  'formation': 'training',
  'onboarding': 'onboarding',
  'support': 'support',
  'vente': 'sales',
  'marketing': 'marketing',
  'finance': 'finance',
  'juridique': 'legal',
  'ressources humaines': 'human resources',
  'opérations': 'operations',
  'produit': 'product',
  'technique': 'technical',
  'créatif': 'creative',
  'stratégique': 'strategic',
}

/**
 * Translate a single string value using the TRANSLATIONS map.
 * Falls back to the original if no translation found.
 * @param {string} value
 * @returns {string}
 */
export function translateField(value) {
  if (!value || typeof value !== 'string') return value
  return TRANSLATIONS[value] ?? value
}

/**
 * Translate an array of strings, preserving length and non-empty elements.
 * @param {string[]} arr
 * @returns {string[]}
 */
export function translateArray(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => {
    const translated = translateField(item)
    // Ensure no null/empty elements
    return translated && translated.length > 0 ? translated : item
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🌐 Running translation in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, description, use_cases, best_for, not_for')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  let totalRowsUpdated = 0
  let totalFieldsTranslated = 0
  let hasErrors = false

  const BATCH_SIZE = 20
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE)

    for (const agent of batch) {
      const updatedFields = []
      const updates = {}

      // Check description
      if (isFrench(agent.description)) {
        const translated = translateField(agent.description)
        if (translated !== agent.description) {
          updates.description = translated
          updatedFields.push('description')
        }
      }

      // Check use_cases array
      if (Array.isArray(agent.use_cases)) {
        const hasFrench = agent.use_cases.some(v => isFrench(v))
        if (hasFrench) {
          updates.use_cases = translateArray(agent.use_cases)
          updatedFields.push('use_cases')
        }
      }

      // Check best_for array
      if (Array.isArray(agent.best_for)) {
        const hasFrench = agent.best_for.some(v => isFrench(v))
        if (hasFrench) {
          updates.best_for = translateArray(agent.best_for)
          updatedFields.push('best_for')
        }
      }

      // Check not_for array
      if (Array.isArray(agent.not_for)) {
        const hasFrench = agent.not_for.some(v => isFrench(v))
        if (hasFrench) {
          updates.not_for = translateArray(agent.not_for)
          updatedFields.push('not_for')
        }
      }

      if (updatedFields.length === 0) continue

      console.log(
        `${PREFIX} UPDATE id=${agent.id} name="${agent.name}" fields=[${updatedFields.join(', ')}]`
      )

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('agents')
          .update(updates)
          .eq('id', agent.id)

        if (error) {
          console.error(`ERROR: Failed to update "${agent.name}": ${error.message}`)
          hasErrors = true
        } else {
          totalRowsUpdated++
          totalFieldsTranslated += updatedFields.length
        }
      } else {
        totalRowsUpdated++
        totalFieldsTranslated += updatedFields.length
      }
    }

    // Rate limit protection
    if (!DRY_RUN && i + BATCH_SIZE < agents.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(
    `\nTranslation complete: ${totalRowsUpdated} agent rows ${DRY_RUN ? 'would be updated' : 'updated'}, ${totalFieldsTranslated} fields translated`
  )

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
