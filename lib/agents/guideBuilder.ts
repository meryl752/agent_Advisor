/**
 * guideBuilder — Agent 4
 *
 * Pour chaque agent du stack :
 * 1. Cache Supabase (économise les crédits Tavily)
 * 2. Si miss : recherche Tavily (1 crédit)
 * 3. LLM : synthèse structurée des étapes
 * 4. Mise en cache 30 jours
 *
 * Concurrence maîtrisée : au plus 2 agents traités en parallèle (voir buildGuides).
 */

import { callLLM } from '@/lib/llm/router'
import { buildSearchQuery, searchTavily } from '@/lib/tavily/client'
import { getCachedGuide, setCachedGuide } from '@/lib/tavily/cache'
import { repairTruncatedJSON } from '@/lib/utils/jsonRepair'
import type { StackAgent, ImplementationStep, UserContext } from './types'

const TECH_LEVEL_FR: Record<string, string> = {
  beginner:     'débutant complet — aucun code, interfaces visuelles uniquement',
  intermediate: 'niveau intermédiaire — à l\'aise avec le no-code',
  advanced:     'développeur — peut coder et configurer des APIs',
}

function stripLlmNoise(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

/**
 * Extrait et parse le tableau JSON des étapes ; tente une réparation si tronqué.
 */
function parseImplementationStepsFromText(text: string): ImplementationStep[] | null {
  const cleaned = stripLlmNoise(text)
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return null
  const slice = jsonMatch[0]
  try {
    const steps = JSON.parse(slice) as ImplementationStep[]
    return Array.isArray(steps) && steps.length > 0 ? steps : null
  } catch {
    try {
      const repaired = repairTruncatedJSON(slice)
      const steps = JSON.parse(repaired) as ImplementationStep[]
      return Array.isArray(steps) && steps.length > 0 ? steps : null
    } catch {
      return null
    }
  }
}

/**
 * Build a precise task description for Tavily search.
 * Combines the agent's role in the stack with the user's objective.
 */
function buildTaskDescription(agent: StackAgent, objective: string): string {
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
  techLevel: string,
  preferredModel?: string
): Promise<ImplementationStep[]> {
  const task = buildTaskDescription(agent, objective)

  const cached = await getCachedGuide(agent.name, task)
  if (cached) {
    try {
      return JSON.parse(cached) as ImplementationStep[]
    } catch { /* cache corrupted, proceed */ }
  }

  const domain = agent.website_domain ?? ''
  const query = buildSearchQuery(agent.name, domain, task)
  const searchResults = await searchTavily(query)

  const docsContext = searchResults.length > 0
    ? searchResults.map((r, i) =>
        `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 600)}`
      ).join('\n\n---\n\n')
    : `Aucune documentation trouvée — génère les étapes depuis ta connaissance de ${agent.name}.`

  const sourceUrls = searchResults.map(r => r.url)

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

  const compactRetryPrompt = `Tu écris un guide d'implémentation pour l'outil "${agent.name}" (rôle dans le projet: "${agent.role}", objectif utilisateur: "${objective}").
Renvoie UNIQUEMENT un tableau JSON valide, 6 à 10 objets, format exact:
[{"step":1,"title":"...","action":"...","details":"...","tip":null}, ...]
Contraintes: français, étapes concrètes et ordonnées, zéro markdown, zéro texte hors du tableau.`

  try {
    let steps: ImplementationStep[] | null = null
    for (let attempt = 0; attempt < 2 && !steps; attempt++) {
      const userPrompt = attempt === 0 ? prompt : compactRetryPrompt
      const text = await callLLM(userPrompt, 2000, preferredModel)
      steps = parseImplementationStepsFromText(text)
    }

    if (!steps || steps.length === 0) {
      throw new Error('No JSON array in response after repair and retry')
    }

    const enriched = steps.map((s, i) => ({
      ...s,
      source_url: i === 0 && sourceUrls[0] ? sourceUrls[0] : undefined,
    }))

    await setCachedGuide(agent.name, task, JSON.stringify(enriched))

    return enriched
  } catch (err) {
    console.error(`[GuideBuilder] Failed for ${agent.name}:`, err)
    return []
  }
}

/**
 * Build guides for all agents with controlled concurrency (max 2 parallel).
 * Returns the stack agents enriched with implementation_steps.
 */
export async function buildGuides(
  agents: StackAgent[],
  ctx: UserContext
): Promise<StackAgent[]> {
  console.log(`[GuideBuilder] Building guides for ${agents.length} agents (max 2 parallel)...`)

  const enrichedAgents: StackAgent[] = []
  const BATCH_SIZE = 2

  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(agent => buildAgentGuide(agent, ctx.objective, ctx.tech_level, ctx.preferred_model))
    )

    batch.forEach((agent, idx) => {
      const result = results[idx]
      const steps = result.status === 'fulfilled' ? result.value : []
      if (result.status === 'rejected') {
        console.error(`[GuideBuilder] Agent ${agent.name} failed:`, result.reason)
      }
      enrichedAgents.push({ ...agent, implementation_steps: steps })
    })
  }

  return enrichedAgents
}
