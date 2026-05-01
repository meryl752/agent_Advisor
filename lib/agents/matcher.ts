import type { AnalyzedQuery, UserContext, ScoredAgent, VectorAgent } from './types'
import { BUDGET_MAP, DIFFICULTY_ALLOWED } from '@/lib/constants'

// ─── Constante RRF standard ───────────────────────────────────────────────────
const RRF_K = 60

// ─── Reciprocal Rank Fusion ───────────────────────────────────────────────────
/**
 * Fusionne deux classements indépendants en un score unique.
 *
 * Formule : score = 1/(k + rank_A) + 1/(k + rank_B)
 *
 * Avantages vs pondération manuelle :
 * - Résistant aux outliers (un score extrême ne domine pas tout)
 * - Pas besoin de normaliser les scores entre eux
 * - Mathématiquement prouvé supérieur aux poids fixes sur les benchmarks IR
 *
 * @param rankVector  Position dans le classement vectoriel (1 = meilleur)
 * @param rankBusiness Position dans le classement métier (1 = meilleur)
 */
function rrfScore(rankVector: number, rankBusiness: number): number {
  return (1 / (RRF_K + rankVector)) + (1 / (RRF_K + rankBusiness))
}

// ─── Score métier pur (sans vectoriel) ───────────────────────────────────────
/**
 * Calcule un score métier basé sur la pertinence catégorie, use_cases,
 * best_for, intégrations, difficulté et timeline.
 * Retourne null si l'agent doit être éliminé (hors budget).
 */
function computeBusinessScore(
  agent: VectorAgent,
  query: AnalyzedQuery,
  ctx: UserContext,
  allText: string,
  budgetMax: number,
  allowedDiff: string[],
): number | null {
  // ── Élimination stricte hors budget ──────────────────────────────────────
  // budget='zero' (0€) means free-only — filter out any paid agent
  // budget > 0 means filter agents exceeding the max
  if (budgetMax === 0 && agent.price_from > 0) {
    return null
  }
  if (budgetMax > 0 && agent.price_from > budgetMax) {
    return null
  }

  let score = 0

  // Catégorie exacte requise par l'analyseur (+20)
  // Réduit de 30 → 20 pour éviter la domination de la catégorie
  if (query.required_categories.includes(agent.category)) score += 20

  // Match use_cases sur objectif + sous-tâches (jusqu'à +35)
  // Augmenté de 25 → 35 car plus précis que la catégorie
  const useCaseMatches = (agent.use_cases ?? []).filter(uc =>
    allText.includes(uc.toLowerCase())
  ).length
  score += Math.min(useCaseMatches * 10, 35)

  // Match best_for — cas d'usage prioritaires (jusqu'à +20)
  // Augmenté de 15 → 20 car très pertinent
  const bestForMatches = (agent.best_for ?? []).filter(bf =>
    allText.includes(bf.toLowerCase())
  ).length
  score += Math.min(bestForMatches * 10, 20)

  // Pénalité not_for — éliminer les mauvais matchs (-20 par match)
  const notForMatches = (agent.not_for ?? []).filter(nf =>
    allText.includes(nf.toLowerCase())
  ).length
  score -= notForMatches * 20

  // Intégrations natives avec les outils actuels (+3 par intégration, max +10)
  const currentToolsLower = ctx.current_tools.map(t => t.toLowerCase())
  const integrationMatches = (agent.integrations ?? []).filter(intg =>
    currentToolsLower.some(t =>
      t.includes(intg.toLowerCase()) || intg.toLowerCase().includes(t)
    )
  ).length
  score += Math.min(integrationMatches * 3, 10)

  // Pénalité difficulté trop élevée (-15)
  const difficulty = agent.setup_difficulty ?? 'easy'
  if (!allowedDiff.includes(difficulty)) score -= 15

  // Pénalité timeline urgente + setup lent (-10)
  if (ctx.timeline === 'asap') {
    const ttv = (agent.time_to_value ?? '').toLowerCase()
    if (ttv.includes('semaine') || ttv.includes('mois')) score -= 10
  }

  return Math.max(0, score)
}

// ─── matchAgents — Hybrid Search avec RRF ────────────────────────────────────
/**
 * Combine la recherche vectorielle Supabase et le scoring métier via
 * Reciprocal Rank Fusion pour produire un classement final robuste.
 *
 * Pipeline :
 * 1. Filtrage strict hors budget
 * 2. Classement vectoriel (ordre de similarity Supabase)
 * 3. Classement métier (score catégorie + use_cases + best_for + intégrations)
 * 4. Fusion RRF des deux classements
 * 5. Normalisation du score final sur [0, 100]
 */
export function matchAgents(
  agents: VectorAgent[],
  query: AnalyzedQuery,
  ctx: UserContext,
): ScoredAgent[] {
  const budgetMax   = BUDGET_MAP[ctx.budget] ?? 0
  const allowedDiff = DIFFICULTY_ALLOWED[ctx.tech_level] ?? ['easy']
  const allText     = [
    ctx.objective,
    ...query.subtasks,
    query.sector_context ?? '',
  ].join(' ').toLowerCase()

  console.log(`[Matcher] RRF scoring — ${agents.length} agents (budget=${budgetMax}€, tech=${ctx.tech_level})`)

  // ── Étape 1 : Calcul des scores métier + élimination hors budget ──────────
  const withBusiness = agents.map(agent => {
    const businessScore = computeBusinessScore(
      agent, query, ctx, allText, budgetMax, allowedDiff
    )
    if (businessScore === null) {
      console.log(`[Matcher] ❌ ${agent.name} éliminé — ${agent.price_from}€ > budget ${budgetMax}€`)
      return null
    }
    return { agent, businessScore }
  }).filter((x): x is { agent: VectorAgent; businessScore: number } => x !== null)

  console.log(`[Matcher] ${withBusiness.length} agents après filtrage budget`)

  if (withBusiness.length === 0) return []

  // ── Étape 2 : Classement vectoriel (déjà trié par Supabase ORDER BY similarity) ──
  // On conserve l'ordre d'entrée comme classement vectoriel (rank 1 = meilleur)
  const vectorRanks = new Map<string, number>()
  withBusiness.forEach(({ agent }, idx) => {
    vectorRanks.set(agent.id, idx + 1)
  })

  // ── Étape 3 : Classement métier (tri par businessScore décroissant) ────────
  const sortedByBusiness = [...withBusiness].sort(
    (a, b) => b.businessScore - a.businessScore
  )
  const businessRanks = new Map<string, number>()
  sortedByBusiness.forEach(({ agent }, idx) => {
    businessRanks.set(agent.id, idx + 1)
  })

  // ── Étape 4 : Fusion RRF ──────────────────────────────────────────────────
  const fused = withBusiness.map(({ agent, businessScore }) => {
    const rankV = vectorRanks.get(agent.id) ?? withBusiness.length
    const rankB = businessRanks.get(agent.id) ?? withBusiness.length
    const rrf   = rrfScore(rankV, rankB)
    return { agent, businessScore, rankV, rankB, rrf }
  })

  // ── Étape 5 : Normalisation sur [0, 100] ──────────────────────────────────
  const maxRrf = Math.max(...fused.map(f => f.rrf))
  const minRrf = Math.min(...fused.map(f => f.rrf))
  const range  = maxRrf - minRrf || 1 // éviter division par zéro

  const results: ScoredAgent[] = fused.map(({ agent, businessScore, rankV, rankB, rrf }) => {
    const relevance_score = Math.round(((rrf - minRrf) / range) * 100)

    // Raison lisible
    const reasons: string[] = []
    if ((agent.similarity ?? 0) >= 0.7) {
      reasons.push(`similarité sémantique élevée (${((agent.similarity ?? 0) * 100).toFixed(0)}%)`)
    }
    if (query.required_categories.includes(agent.category)) {
      reasons.push(`catégorie ${agent.category} requise`)
    }
    const useCaseMatches = (agent.use_cases ?? []).filter(uc =>
      allText.includes(uc.toLowerCase())
    ).length
    if (useCaseMatches > 0) reasons.push(`${useCaseMatches} use case(s) correspondent`)
    const bestForMatches = (agent.best_for ?? []).filter(bf =>
      allText.includes(bf.toLowerCase())
    ).length
    if (bestForMatches > 0) reasons.push(`optimisé pour ce cas d'usage`)

    const relevance_reason = reasons.join(' · ') || `RRF rank vectoriel #${rankV}, métier #${rankB}`

    return {
      id:               agent.id,
      name:             agent.name,
      category:         agent.category,
      description:      agent.description,
      price_from:       agent.price_from,
      score:            agent.score,
      roi_score:        agent.roi_score,
      use_cases:        agent.use_cases ?? [],
      compatible_with:  agent.compatible_with ?? [],
      best_for:         agent.best_for,
      integrations:     agent.integrations,
      website_domain:   agent.website_domain,
      setup_difficulty: agent.setup_difficulty ?? 'easy',
      time_to_value:    agent.time_to_value,
      similarity:       agent.similarity ?? 0,
      relevance_score,
      relevance_reason,
    } satisfies ScoredAgent
  })

  const sorted = results.sort((a, b) => b.relevance_score - a.relevance_score)

  console.log(
    `[Matcher] ✅ RRF terminé — top 3: ${sorted.slice(0, 3).map(a => `${a.name}(${a.relevance_score})`).join(', ')}`
  )

  return sorted.slice(0, 15)
}
