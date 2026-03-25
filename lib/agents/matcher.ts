import type { Agent } from '@/lib/supabase/types'
import type { AnalyzedQuery, UserContext, ScoredAgent } from './types'

const BUDGET_MAP = {
    zero: 0, low: 50, medium: 200, high: 1000,
}

const DIFFICULTY_MAP = {
    beginner: ['easy'],
    intermediate: ['easy', 'medium'],
    advanced: ['easy', 'medium', 'hard'],
}

export function matchAgents(
  agents: Agent[],
  query: AnalyzedQuery,
  ctx: UserContext
): ScoredAgent[] {
  const budgetMax = BUDGET_MAP[ctx.budget]
  const allowedDifficulties = DIFFICULTY_MAP[ctx.tech_level]
  const objectiveLower = ctx.objective.toLowerCase()

  // Outils spécialistes par plateforme/usage
  const specialistBonus: Record<string, string[]> = {
    'taplio':         ['linkedin'],
    'tweet hunter':   ['twitter', 'x ', 'tweet'],
    'buffer':         ['social', 'réseaux', 'programmer', 'scheduling'],
    'hootsuite':      ['social', 'réseaux', 'instagram'],
    'opus clip':      ['vidéo', 'youtube', 'tiktok', 'reels'],
    'descript':       ['podcast', 'vidéo', 'transcription'],
    'surfer':         ['seo', 'référencement', 'blog'],
    'ahrefs':         ['backlink', 'seo', 'concurrent'],
    'instantly':      ['cold email', 'email froid'],
    'apollo':         ['leads', 'b2b', 'prospection'],
    'tidio':          ['shopify', 'chatbot', 'service client'],
    'heygen':         ['avatar', 'vidéo formation'],
    'gamma':          ['présentation', 'slides', 'pitch'],
    'otter':          ['réunion', 'transcription', 'meeting'],
  }

  const scored = agents.map(agent => {
    let score = 0
    const agentNameLower = agent.name.toLowerCase()
    const agentDifficulty = (agent as Agent & { setup_difficulty?: string }).setup_difficulty ?? 'easy'
    const ttv = (agent as Agent & { time_to_value?: string }).time_to_value ?? ''

    // ── 1. Pertinence catégorie (base) ──────────────────────────────────────
    if (query.required_categories.includes(agent.category)) score += 22

    // ── 2. Match use_cases sur l'objectif ET les sous-tâches ────────────────
    const allText = [objectiveLower, ...query.subtasks.map(s => s.toLowerCase())].join(' ')
    const useCaseMatches = agent.use_cases.filter(uc => allText.includes(uc)).length
    score += useCaseMatches * 9

    // ── 3. Score de base pondéré (qualité intrinsèque) ──────────────────────
    score += agent.roi_score * 0.25 + agent.score * 0.15

    // ── 4. Bonus spécialiste — outil conçu pour ce cas exact ────────────────
    for (const [toolName, keywords] of Object.entries(specialistBonus)) {
      if (agentNameLower.includes(toolName)) {
        const matches = keywords.filter(kw => objectiveLower.includes(kw)).length
        score += matches * 25 // Fort bonus spécialiste
      }
    }

    // ── 5. Compatibilité outils actuels ─────────────────────────────────────
    const currentToolsLower = ctx.current_tools.map(t => t.toLowerCase())
    const compatMatches = agent.compatible_with?.filter(c =>
      currentToolsLower.some(t => t.includes(c) || c.includes(t))
    ).length ?? 0
    score += compatMatches * 10

    // ── 6. Filtre budget — NEUTRE sur le scoring, juste éliminatoire ────────
    // IMPORTANT: un outil hors budget est éliminé mais le score des autres
    // n'est PAS boosté. Le meilleur stack à 50€ reste aussi bien scoré.
    if (budgetMax > 0 && agent.price_from > budgetMax) {
      score = -100 // Éliminé — hors budget
    }

    // ── 7. Filtre niveau technique ──────────────────────────────────────────
    if (!allowedDifficulties.includes(agentDifficulty)) {
      score -= 30 // Pénalité mais pas élimination totale
    }

    // ── 8. Timeline urgente → favoriser setup rapide ────────────────────────
    if (ctx.timeline === 'asap') {
      if (ttv.includes('heure')) score += 12
      else if (ttv.includes('semaine')) score -= 8
    }

    // ── 9. Bonus description contextuelle ───────────────────────────────────
    const sectorLower = ctx.sector.toLowerCase()
    if (agent.description?.toLowerCase().includes(sectorLower)) score += 6

    const relevance_reason = buildRelevanceReason(agent, query, useCaseMatches, compatMatches)

    return {
      ...agent,
      website_domain: (agent as Agent & { website_domain?: string }).website_domain,
      setup_difficulty: agentDifficulty,
      time_to_value: ttv,
      relevance_score: Math.max(0, Math.min(score, 100)),
      relevance_reason,
    } as ScoredAgent
  })

  return scored
    .filter(a => a.relevance_score > 5) // Seuil minimal
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 12)
}

function buildRelevanceReason(
    agent: Agent,
    query: AnalyzedQuery,
    useCaseMatches: number,
    compatMatches: number
): string {
    const reasons = []
    if (query.required_categories.includes(agent.category)) {
        reasons.push(`catégorie ${agent.category} requise pour cet objectif`)
    }
    if (useCaseMatches > 0) {
        reasons.push(`${useCaseMatches} cas d'usage correspondent`)
    }
    if (compatMatches > 0) {
        reasons.push(`compatible avec ${compatMatches} outil(s) existant(s)`)
    }
    return reasons.join(', ') || 'correspondance générale'
}