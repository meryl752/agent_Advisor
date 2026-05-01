import { z } from 'zod'
import { callLLM } from '@/lib/llm/router'
import { BUDGET_MAP, VALID_CATEGORIES } from '@/lib/constants'
import type { UserContext, AnalyzedQuery } from './types'

// ─── Zod schema for LLM output validation ────────────────────────────────────
// Nouvelle structure avec domaines et sous-tâches atomiques

const AtomicSubtaskSchema = z.object({
  id:                z.string().regex(/^[a-zA-Z0-9_-]+$/, 'ID must be alphanumeric with underscores or hyphens'),
  action:            z.string().min(1),
  required_category: z.string().min(1),
  depends_on:        z.array(z.string()).default([]),
  can_be_automated:  z.boolean(),
})

const FunctionalDomainSchema = z.object({
  name:     z.string().min(1),
  priority: z.number().min(1),
  subtasks: z.array(AtomicSubtaskSchema).min(1),
})

const AnalyzedQuerySchema = z.object({
  original:             z.string().min(1),
  domains:              z.array(FunctionalDomainSchema).min(1),
  implicit_constraints: z.array(z.string()).default([]),
  sector_context:       z.string().default(''),
  budget_max:           z.number().min(0),
}).superRefine((data, ctx) => {
  // Collecter tous les IDs valides
  const allIds = new Set<string>()
  const duplicates = new Set<string>()
  
  data.domains.forEach(domain => {
    domain.subtasks.forEach(subtask => {
      if (allIds.has(subtask.id)) {
        duplicates.add(subtask.id)
      }
      allIds.add(subtask.id)
    })
  })
  
  // Vérifier les IDs dupliqués
  if (duplicates.size > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate task IDs found: ${Array.from(duplicates).join(', ')}`,
      path: ['domains'],
    })
  }
  
  // Vérifier que toutes les dépendances référencent des IDs existants
  data.domains.forEach((domain, domainIdx) => {
    domain.subtasks.forEach((subtask, subtaskIdx) => {
      subtask.depends_on.forEach(depId => {
        if (!allIds.has(depId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Task ${subtask.id} depends on non-existent task ${depId}`,
            path: ['domains', domainIdx, 'subtasks', subtaskIdx, 'depends_on'],
          })
        }
      })
    })
  })
})

// ─── Fallback typé pour continuer le pipeline en cas d'erreur ────────────────
function buildFallback(objective: string, sector: string, budgetValue: number): AnalyzedQuery {
  return {
    original:             objective,
    domains:              [{
      name: 'Objectif principal',
      priority: 1,
      subtasks: [{
        id: 'd1_t1',
        action: objective,
        required_category: 'automation',
        depends_on: [],
        can_be_automated: true,
      }]
    }],
    implicit_constraints: [],
    sector_context:       sector,
    budget_max:           budgetValue,
    subtasks:             [objective],
    required_categories:  [],
  }
}

export async function analyzeQuery(ctx: UserContext): Promise<AnalyzedQuery> {
  const budgetValue = BUDGET_MAP[ctx.budget] ?? 0

  // ── Passe 1 : Analyse légère — sous-tâches et catégories ─────────────────
  // Format simple, jamais tronqué, rapide
  const pass1Prompt = `Tu es un expert en automatisation IA. Décompose cet objectif en sous-tâches concrètes.

OBJECTIF: "${ctx.objective}"
SECTEUR: ${ctx.sector} | BUDGET: ${budgetValue}€/mois | NIVEAU: ${ctx.tech_level}

Retourne UNIQUEMENT ce JSON (sans markdown, sans backtick) :
{
  "subtasks": ["sous-tâche 1 précise", "sous-tâche 2 précise", "..."],
  "categories": ["categorie1", "categorie2"],
  "sector_context": "1 phrase sur les spécificités sectorielles",
  "constraints": ["contrainte implicite si évidente"]
}

Catégories disponibles: ${VALID_CATEGORIES.join(', ')}
Règle: autant de sous-tâches que nécessaire pour couvrir TOUT l'objectif.`

  let subtasks: string[] = []
  let required_categories: string[] = []
  let sector_context = ctx.sector
  let implicit_constraints: string[] = []

  try {
    const pass1Text = await callLLM(pass1Prompt, 800)
    const cleaned1 = pass1Text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed1 = JSON.parse(cleaned1)

    subtasks = Array.isArray(parsed1.subtasks) ? parsed1.subtasks : [ctx.objective]
    required_categories = Array.isArray(parsed1.categories)
      ? parsed1.categories.filter((c: string) => (VALID_CATEGORIES as readonly string[]).includes(c))
      : []
    sector_context = parsed1.sector_context || ctx.sector
    implicit_constraints = Array.isArray(parsed1.constraints) ? parsed1.constraints : []

    console.log(`[QueryAnalyzer] ✅ Passe 1 — ${subtasks.length} sous-tâches | catégories: [${required_categories.join(', ')}]`)
  } catch (err) {
    console.error('[QueryAnalyzer] ❌ Passe 1 échouée:', err instanceof Error ? err.message : String(err))
    return buildFallback(ctx.objective, ctx.sector, budgetValue)
  }

  // ── Passe 2 : Enrichissement pour objectifs complexes (5+ sous-tâches) ───
  // Génère les domaines fonctionnels et dépendances pour une meilleure structure
  let domains: AnalyzedQuery['domains'] = [{
    name: 'Objectif principal',
    priority: 1,
    subtasks: subtasks.map((action, i) => ({
      id: `d1_t${i + 1}`,
      action,
      required_category: required_categories[i] ?? required_categories[0] ?? 'automation',
      depends_on: i > 0 ? [] : [],
      can_be_automated: true,
    }))
  }]

  if (subtasks.length >= 5) {
    const pass2Prompt = `Regroupe ces sous-tâches en domaines fonctionnels logiques.

SOUS-TÂCHES:
${subtasks.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Retourne UNIQUEMENT ce JSON (sans markdown, sans balises think) :
{
  "domains": [
    {
      "name": "Nom du domaine",
      "priority": 1,
      "task_indices": [0, 1, 2]
    }
  ]
}`

    try {
      const pass2Text = await callLLM(pass2Prompt, 600)
      // Strip thinking tags and markdown fences
      const cleaned2 = pass2Text
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      const parsed2 = JSON.parse(cleaned2)

      if (Array.isArray(parsed2.domains) && parsed2.domains.length > 0) {
        domains = parsed2.domains.map((d: any, di: number) => ({
          name: d.name ?? `Domaine ${di + 1}`,
          priority: d.priority ?? di + 1,
          subtasks: (d.task_indices ?? []).map((idx: number, ti: number) => ({
            id: `d${di + 1}_t${ti + 1}`,
            action: subtasks[idx] ?? subtasks[0],
            required_category: required_categories[idx] ?? required_categories[0] ?? 'automation',
            depends_on: [],
            can_be_automated: true,
          })).filter((s: any) => s.action)
        })).filter((d: any) => d.subtasks.length > 0)

        console.log(`[QueryAnalyzer] ✅ Passe 2 — ${domains.length} domaines fonctionnels`)
      }
    } catch (err) {
      console.warn('[QueryAnalyzer] ⚠️ Passe 2 échouée, domaine unique utilisé:', err instanceof Error ? err.message : String(err))
      // Pas grave — on garde le domaine unique de la passe 1
    }
  }

  const result: AnalyzedQuery = {
    original: ctx.objective,
    domains,
    implicit_constraints,
    sector_context,
    budget_max: budgetValue,
    subtasks,
    required_categories,
  }

  console.log(
    `[QueryAnalyzer] ✅ ${result.domains.length} domaines | ` +
    `${result.subtasks.length} sous-tâches | ` +
    `catégories: [${result.required_categories.join(', ')}]`
  )

  return result
}
