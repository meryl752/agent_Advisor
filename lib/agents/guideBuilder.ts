/**
 * guideBuilder — Agent 4
 *
 * For each agent in the stack:
 * 1. Check Supabase cache (avoid burning Tavily credits)
 * 2. If miss: search Tavily for official setup docs (1 credit)
 * 3. LLM synthesizes a structured step-by-step guide from the docs
 * 4. Cache result for 30 days
 *
 * All agents are processed in parallel to minimize latency.
 */

import { callLLM } from '@/lib/llm/router'
import { buildSearchQuery, searchTavily } from '@/lib/tavily/client'
import { getCachedGuide, setCachedGuide } from '@/lib/tavily/cache'
import type { StackAgent, ImplementationStep, UserContext } from './types'

const TECH_LEVEL_FR: Record<string, string> = {
  beginner:     'débutant complet — aucun code, interfaces visuelles uniquement',
  intermediate: 'niveau intermédiaire — à l\'aise avec le no-code',
  advanced:     'développeur — peut coder et configurer des APIs',
}

/**
 * Build a precise task description for Tavily search.
 * Combines the agent's role in the stack with the user's objective.
 */
function buildTaskDescription(agent: StackAgent, objective: string): string {
  // Extract the core action from the role — keep it short for search
  const roleKeywords = agent.role
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, ' ')
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 6)
    .join(' ')
  return `${roleKeywords} ${objective.slice(0, 60)}`
}

/**
 * Generate implementation steps for a single agent.
 * Uses Tavily for fresh docs + LLM for structured synthesis.
 */
async function buildAgentGuide(
  agent: StackAgent,
  objective: string,
  techLevel: string
): Promise<ImplementationStep[]> {
  const task = buildTaskDescription(agent, objective)

  // 1. Check cache first — avoid Tavily credit burn
  const cached = await getCachedGuide(agent.name, task)
  if (cached) {
    try {
      return JSON.parse(cached) as ImplementationStep[]
    } catch { /* cache corrupted, proceed */ }
  }

  // 2. Tavily search — 1 credit
  const domain = agent.website_domain ?? ''
  const query = buildSearchQuery(agent.name, domain, task)
  const searchResults = await searchTavily(query)

  // 3. Build context from search results
  const docsContext = searchResults.length > 0
    ? searchResults.map((r, i) =>
        `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 600)}`
      ).join('\n\n---\n\n')
    : `Aucune documentation trouvée — génère les étapes depuis ta connaissance de ${agent.name}.`

  const sourceUrls = searchResults.map(r => r.url)

  // 4. LLM prompt — surgical and structured
  const prompt = `Tu es un expert en implémentation d'outils SaaS et IA. Tu dois créer un guide d'implémentation COMPLET et PRÉCIS pour configurer ${agent.name} dans le contexte suivant.

<context>
OUTIL: ${agent.name}
RÔLE DANS LE PROJET: ${agent.role}
OBJECTIF GLOBAL: ${objective}
NIVEAU TECHNIQUE DE L'UTILISATEUR: ${TECH_LEVEL_FR[techLevel] ?? techLevel}
DOMAINE: ${domain}
</context>

<documentation_officielle>
${docsContext}
</documentation_officielle>

<instructions>
Génère entre 6 et 10 étapes d'implémentation CONCRÈTES et ORDONNÉES pour que l'utilisateur configure ${agent.name} afin d'accomplir exactement: "${agent.role}".

RÈGLES ABSOLUES:
1. Commence par la toute première action (créer un compte si nécessaire, ou se connecter)
2. Chaque étape = une action précise et unique — pas de regroupement
3. Utilise des verbes d'action: "Clique sur", "Rends-toi dans", "Copie le", "Colle dans", "Active le"
4. Adapte au niveau technique: ${TECH_LEVEL_FR[techLevel] ?? techLevel}
5. Mentionne les menus, boutons, sections EXACTS quand tu les connais
6. Si une étape nécessite une info externe (token, clé API), explique exactement où la trouver
7. La dernière étape doit valider que ça fonctionne (test, vérification)
8. NE PAS inclure d'étapes génériques — chaque étape doit être spécifique à CE projet
</instructions>

<output_format>
JSON strict uniquement. Zéro markdown. Zéro texte avant ou après.
[
  {
    "step": 1,
    "title": "Titre court de l'étape (max 6 mots)",
    "action": "Instruction courte et directe (max 15 mots)",
    "details": "Explication complète avec contexte, où cliquer, quoi remplir, pourquoi cette étape est nécessaire. Minimum 2 phrases.",
    "tip": "Conseil pro ou avertissement optionnel — null si rien à ajouter"
  }
]
</output_format>`

  try {
    const text = await callLLM(prompt, 2000)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const steps = JSON.parse(jsonMatch[0]) as ImplementationStep[]

    // Inject source URLs into relevant steps
    const enriched = steps.map((s, i) => ({
      ...s,
      source_url: i === 0 && sourceUrls[0] ? sourceUrls[0] : undefined,
    }))

    // 5. Cache for 30 days
    await setCachedGuide(agent.name, task, JSON.stringify(enriched))

    return enriched
  } catch (err) {
    console.error(`[GuideBuilder] Failed for ${agent.name}:`, err)
    return []
  }
}

/**
 * Build guides for all agents in parallel.
 * Returns the stack agents enriched with implementation_steps.
 */
export async function buildGuides(
  agents: StackAgent[],
  ctx: UserContext
): Promise<StackAgent[]> {
  console.log(`[GuideBuilder] Building guides for ${agents.length} agents in parallel...`)

  const results = await Promise.allSettled(
    agents.map(agent => buildAgentGuide(agent, ctx.objective, ctx.tech_level))
  )

  return agents.map((agent, i) => {
    const result = results[i]
    const steps = result.status === 'fulfilled' ? result.value : []
    if (result.status === 'rejected') {
      console.error(`[GuideBuilder] Agent ${agent.name} failed:`, result.reason)
    }
    return { ...agent, implementation_steps: steps }
  })
}
