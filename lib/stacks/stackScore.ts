import type { AppLocale } from '@/lib/i18n/locale'
import type { Stack } from '@/lib/supabase/types'
import type { StackAgentRow } from './stackMetrics'

export type ScoreDimensionId = 'tool_quality' | 'coverage' | 'synergy' | 'budget_fit'

export type ScoreDimension = {
  id: ScoreDimensionId
  label: string
  score: number
  hint: string
}

export type StackScoreResult = {
  overall: number
  dimensions: ScoreDimension[]
  tips: string[]
  computed_at: string
}

export function parseScoreBreakdown(raw: unknown): StackScoreResult | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (typeof o.overall !== 'number' || !Array.isArray(o.dimensions)) return null
  return raw as StackScoreResult
}

const LABELS: Record<AppLocale, Record<ScoreDimensionId, { label: string; hint: string }>> = {
  en: {
    tool_quality: { label: 'Tool fit', hint: 'How well each tool matches your goal' },
    coverage: { label: 'Coverage', hint: 'Breadth of your workflow covered' },
    synergy: { label: 'Synergy', hint: 'Tools that work together' },
    budget_fit: { label: 'Budget fit', hint: 'Cost vs value of the stack' },
  },
  fr: {
    tool_quality: { label: 'Adéquation', hint: 'Pertinence des outils pour ton objectif' },
    coverage: { label: 'Couverture', hint: 'Part du besoin couverte par le stack' },
    synergy: { label: 'Synergie', hint: 'Outils qui s’intègrent entre eux' },
    budget_fit: { label: 'Budget', hint: 'Rapport coût / valeur du stack' },
  },
}

function clamp(n: number, min = 40, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function integrationSynergyScore(agents: StackAgentRow[]): number {
  if (agents.length < 2) return 72
  const names = agents.map((a) => a.name.toLowerCase())
  let linked = 0
  let pairs = 0
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      pairs++
      const a = agents[i]
      const b = agents[j]
      const ints = (a.integrations ?? []).map((x) => x.toLowerCase())
      const match =
        ints.some((x) => b.name.toLowerCase().includes(x) || x.includes(b.name.toLowerCase())) ||
        (b.integrations ?? []).some(
          (x) => a.name.toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(a.name.toLowerCase())
        )
      if (match) linked++
    }
  }
  if (pairs === 0) return 70
  return clamp(55 + (linked / pairs) * 45)
}

function coverageScore(agents: StackAgentRow[], objective: string): number {
  const categories = new Set(agents.map((a) => a.category))
  const wordCount = objective.trim().split(/\s+/).filter(Boolean).length
  const targetTools = wordCount > 40 ? 4 : wordCount > 20 ? 3 : 2
  const toolScore = Math.min(100, (agents.length / targetTools) * 85)
  const catScore = Math.min(100, categories.size * 28)
  return clamp(toolScore * 0.6 + catScore * 0.4)
}

function budgetFitScore(totalCost: number, agentCount: number): number {
  if (agentCount === 0) return 40
  const perTool = totalCost / agentCount
  if (totalCost === 0) return 88
  if (totalCost <= 80) return 92
  if (totalCost <= 200) return 78
  if (totalCost <= 400) return 62
  if (perTool > 120) return 48
  return 55
}

function toolQualityScore(agents: StackAgentRow[], storedScore: number): number {
  if (agents.length === 0) return clamp(storedScore || 50)
  const avgCatalog = agents.reduce((s, a) => s + (a.score ?? 50), 0) / agents.length
  const blend = storedScore > 0 ? storedScore * 0.45 + avgCatalog * 0.55 : avgCatalog
  return clamp(blend)
}

function buildTips(
  locale: AppLocale,
  dimensions: ScoreDimension[],
  agents: StackAgentRow[]
): string[] {
  const tips: string[] = []
  const byId = Object.fromEntries(dimensions.map((d) => [d.id, d.score])) as Record<
    ScoreDimensionId,
    number
  >

  if (byId.synergy < 70 && agents.length >= 2) {
    tips.push(
      locale === 'fr'
        ? 'Active le suivi digest : on t’alertera si des outils mieux intégrés peuvent remplacer une partie du stack.'
        : 'Enable stack tracking — we’ll alert you when better-integrated tools can replace part of your stack.'
    )
  }
  if (byId.budget_fit < 65) {
    tips.push(
      locale === 'fr'
        ? 'Ton coût mensuel est élevé : une alerte « baisse de prix » ou une alternative peut faire monter ce score.'
        : 'Monthly cost is high — price-drop alerts or a cheaper alternative can raise this score.'
    )
  }
  if (byId.coverage < 72) {
    tips.push(
      locale === 'fr'
        ? 'Régénère le stack avec un objectif plus précis pour couvrir plus d’étapes du projet.'
        : 'Regenerate with a sharper objective to cover more of your workflow.'
    )
  }
  if (byId.tool_quality >= 80 && tips.length === 0) {
    tips.push(
      locale === 'fr'
        ? 'Excellent alignement — garde le suivi actif pour conserver un score élevé quand le marché bouge.'
        : 'Strong alignment — keep tracking enabled to maintain a high score as the market changes.'
    )
  }
  return tips.slice(0, 3)
}

export function computeStackScore(
  stack: Stack,
  agents: StackAgentRow[],
  locale: AppLocale = 'en'
): StackScoreResult {
  const objective = stack.objective ?? ''
  const liveCost = agents.reduce((s, a) => s + (a.price_from ?? 0), 0)

  const tool_quality = toolQualityScore(agents, stack.score ?? 0)
  const coverage = coverageScore(agents, objective)
  const synergy = integrationSynergyScore(agents)
  const budget_fit = budgetFitScore(liveCost, agents.length)

  const overall = clamp(
    tool_quality * 0.35 + coverage * 0.25 + synergy * 0.2 + budget_fit * 0.2
  )

  const labels = LABELS[locale]
  const dimensions: ScoreDimension[] = (
    ['tool_quality', 'coverage', 'synergy', 'budget_fit'] as ScoreDimensionId[]
  ).map((id) => ({
    id,
    label: labels[id].label,
    score: id === 'tool_quality' ? tool_quality : id === 'coverage' ? coverage : id === 'synergy' ? synergy : budget_fit,
    hint: labels[id].hint,
  }))

  return {
    overall,
    dimensions,
    tips: buildTips(locale, dimensions, agents),
    computed_at: new Date().toISOString(),
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#CAFF32'
  if (score >= 65) return '#FF6B35'
  return '#ef4444'
}

export function scoreHeadline(locale: AppLocale, overall: number): string {
  if (overall >= 85) {
    return locale === 'fr'
      ? 'Stack très efficace — tu économises temps, argent et charge mentale.'
      : 'Highly effective stack — you save time, money, and mental overhead.'
  }
  if (overall >= 70) {
    return locale === 'fr'
      ? 'Bon stack — quelques optimisations peuvent encore augmenter ton score.'
      : 'Solid stack — a few optimizations can still raise your score.'
  }
  return locale === 'fr'
    ? 'Marge de progression — suis les alertes et améliore ton stack.'
    : 'Room to improve — follow alerts and tune your stack.'
}
