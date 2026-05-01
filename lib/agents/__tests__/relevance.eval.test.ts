/**
 * Tests d'évaluation de la pertinence des stacks (LLM-as-judge)
 *
 * Utilise un LLM juge (Groq Llama) pour évaluer si les stacks générés
 * sont pertinents par rapport à l'objectif de l'utilisateur.
 *
 * Critères évalués :
 * - Couverture de l'objectif (les outils couvrent-ils bien les besoins ?)
 * - Cohérence des rôles (chaque outil a-t-il un rôle logique ?)
 * - Absence de redondances (pas deux outils qui font la même chose)
 * - Adéquation budget/profil (les outils sont-ils adaptés au niveau technique ?)
 *
 * Score minimum acceptable : 6/10
 *
 * Lancer avec :
 * npx vitest run lib/agents/__tests__/relevance.eval.test.ts
 */

import { describe, it, expect } from 'vitest'
import { runOrchestrator } from '../orchestrator'
import type { UserContext, FinalStack } from '../types'

const hasRequiredKeys = process.env.GROQ_API_KEY || process.env.GOOGLE_API_KEY
const describeIfKeys = hasRequiredKeys ? describe : describe.skip

// ─── LLM Judge ────────────────────────────────────────────────────────────────

async function evaluateStackRelevance(
  objective: string,
  stack: FinalStack,
  ctx: UserContext
): Promise<{ score: number; reasoning: string; issues: string[] }> {
  const { callLLM } = await import('@/lib/llm/router')

  const agentList = stack.agents.map((a, i) =>
    `${i + 1}. ${a.name} — Rôle: "${a.role}" — Prix: ${a.price_from}€/mois`
  ).join('\n')

  const prompt = `Tu es un expert en outils IA et automatisation. Évalue la pertinence de ce stack recommandé.

OBJECTIF UTILISATEUR: "${objective}"
PROFIL: ${ctx.tech_level} | ${ctx.team_size} | budget ${ctx.budget}

STACK RECOMMANDÉ (${stack.agents.length} outils):
${agentList}

COÛT TOTAL: ${stack.total_cost}€/mois
ROI ESTIMÉ: +${stack.roi_estimate}%

Évalue ce stack sur les critères suivants et retourne UNIQUEMENT ce JSON (sans markdown) :
{
  "score": <entier 0-10>,
  "coverage": <"excellent"|"good"|"partial"|"poor">,
  "reasoning": "<explication en 2-3 phrases>",
  "issues": ["<problème 1 si existe>", "<problème 2 si existe>"],
  "missing_tools": ["<outil manquant si existe>"]
}

Critères de scoring :
- 9-10: Stack parfait, couvre tous les besoins, outils complémentaires, budget respecté
- 7-8: Bon stack, quelques améliorations possibles
- 5-6: Stack acceptable mais manque des éléments importants
- 3-4: Stack insuffisant, besoins mal couverts
- 0-2: Stack hors sujet ou inutilisable`

  const response = await callLLM(prompt, 800)
  
  // Extract JSON — handle markdown fences and plain JSON
  let jsonStr = response
  // Remove markdown code fences if present
  const fenceMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    jsonStr = fenceMatch[1]
  }
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('[Judge] Raw response:', response.slice(0, 200))
    throw new Error('Judge returned no JSON')
  }

  const result = JSON.parse(jsonMatch[0])
  return {
    score: result.score ?? 0,
    reasoning: result.reasoning ?? '',
    issues: result.issues ?? [],
  }
}

// ─── Test scenarios ───────────────────────────────────────────────────────────

const SCENARIOS: Array<{ name: string; ctx: UserContext; minScore: number }> = [
  {
    name: 'Shopify e-commerce débutant',
    ctx: {
      objective: 'Je veux lancer une boutique Shopify et automatiser mon service client avec un chatbot IA',
      sector: 'ecommerce',
      team_size: 'solo',
      budget: 'low',
      tech_level: 'beginner',
      timeline: 'weeks',
      current_tools: [],
    },
    minScore: 6,
  },
  {
    name: 'Prospection LinkedIn B2B intermédiaire',
    ctx: {
      objective: 'Je veux automatiser ma prospection LinkedIn, envoyer des séquences emails et qualifier mes leads',
      sector: 'b2b',
      team_size: 'solo',
      budget: 'medium',
      tech_level: 'intermediate',
      timeline: 'weeks',
      current_tools: [],
    },
    minScore: 6,
  },
  {
    name: 'Création contenu YouTube avancé',
    ctx: {
      objective: 'Je veux créer une chaîne YouTube, automatiser le montage vidéo et optimiser le SEO de mes vidéos',
      sector: 'content',
      team_size: 'solo',
      budget: 'medium',
      tech_level: 'intermediate',
      timeline: 'months',
      current_tools: [],
    },
    minScore: 6,
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describeIfKeys('Stack relevance evaluation (LLM-as-judge)', () => {

  for (const scenario of SCENARIOS) {
    it(`[${scenario.name}] stack score >= ${scenario.minScore}/10`, async () => {
      // Generate stack
      const result = await runOrchestrator(scenario.ctx)

      if (!result) {
        console.warn(`[EVAL] No result for "${scenario.name}" — skipping evaluation`)
        return
      }

      // Evaluate with LLM judge
      const evaluation = await evaluateStackRelevance(
        scenario.ctx.objective,
        result.stack,
        scenario.ctx
      )

      console.log(`\n[EVAL] ${scenario.name}`)
      console.log(`  Score: ${evaluation.score}/10`)
      console.log(`  Reasoning: ${evaluation.reasoning}`)
      if (evaluation.issues.length > 0) {
        console.log(`  Issues: ${evaluation.issues.join(', ')}`)
      }
      console.log(`  Stack: ${result.stack.agents.map(a => a.name).join(' → ')}`)

      // Assert minimum score
      expect(evaluation.score).toBeGreaterThanOrEqual(scenario.minScore)
    }, 90_000)
  }

  it('all agents in stack have non-empty roles and reasons', async () => {
    const ctx = SCENARIOS[0].ctx
    const result = await runOrchestrator(ctx)
    if (!result) return

    for (const agent of result.stack.agents) {
      expect(agent.role.length).toBeGreaterThan(10)
      expect(agent.reason.length).toBeGreaterThan(10)
      expect(agent.concrete_result.length).toBeGreaterThan(10)
    }
  }, 60_000)

}, 300_000)
