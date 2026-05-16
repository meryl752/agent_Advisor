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
import { llmLanguageInstruction } from '@/lib/i18n/locale'

const TECH_LEVEL_EN: Record<string, string> = {
  beginner: 'complete beginner — no code, visual interfaces only',
  intermediate: 'intermediate — comfortable with no-code',
  advanced: 'developer — can code and configure APIs',
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
  preferredModel?: string,
  locale: 'en' | 'fr' = 'en'
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
    : `No documentation found — generate steps from your knowledge of ${agent.name}.`

  const sourceUrls = searchResults.map(r => r.url)

  const langLine = llmLanguageInstruction(locale)

  const prompt = `You are an expert at implementing SaaS and AI tools. Create a COMPLETE, PRECISE implementation guide to set up ${agent.name} in this context.
${langLine}

<context>
TOOL: ${agent.name}
ROLE IN PROJECT: ${agent.role}
OVERALL OBJECTIVE: ${objective}
USER TECH LEVEL: ${TECH_LEVEL_EN[techLevel] ?? techLevel}
DOMAIN: ${domain}
</context>

<official_docs>
${docsContext}
</official_docs>

<instructions>
Generate 6 to 10 CONCRETE, ORDERED implementation steps so the user configures ${agent.name} to accomplish exactly: "${agent.role}".

RULES:
1. Start with the very first action (create account if needed, or sign in)
2. Each step = one precise action — no bundling
3. Use action verbs: "Click", "Go to", "Copy", "Paste", "Enable"
4. Match tech level: ${TECH_LEVEL_EN[techLevel] ?? techLevel}
5. Name exact menus, buttons, sections when known
6. For API keys/tokens, explain exactly where to find them
7. Last step must verify it works (test, check)
8. No generic steps — each step must be specific to THIS project
9. Write all step text in English
</instructions>

<output_format>
Strict JSON only. No markdown. No text before or after.
[
  {
    "step": 1,
    "title": "Short step title (max 6 words)",
    "action": "Short direct instruction (max 15 words)",
    "details": "Full explanation with context, where to click, what to fill, why this step matters. At least 2 sentences.",
    "tip": "Optional pro tip or warning — null if none"
  }
]
</output_format>`

  const compactRetryPrompt =
    locale === 'fr'
      ? `Guide d'implémentation pour "${agent.name}" (rôle: "${agent.role}", objectif: "${objective}").
Tableau JSON uniquement, 6-10 étapes, format: [{"step":1,"title":"...","action":"...","details":"...","tip":null}]
${langLine}`
      : `Implementation guide for "${agent.name}" (role: "${agent.role}", objective: "${objective}").
JSON array only, 6-10 steps: [{"step":1,"title":"...","action":"...","details":"...","tip":null}]
${langLine}`

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
      batch.map(agent =>
        buildAgentGuide(
          agent,
          ctx.objective,
          ctx.tech_level,
          ctx.preferred_model,
          ctx.locale === 'fr' ? 'fr' : 'en'
        )
      )
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
