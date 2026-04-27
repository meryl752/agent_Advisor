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

  const prompt = `Tu es le moteur d'analyse d'un système de recommandation d'outils IA.
Ta mission : décomposer une demande utilisateur en un graphe structuré
de domaines et sous-tâches atomiques, chacune correspondant à exactement
un outil ou une action réalisable.

<context>
Objectif: "${ctx.objective}"
Secteur: ${ctx.sector}
Taille équipe: ${ctx.team_size}
Budget mensuel max: ${budgetValue}€
Niveau technique: ${ctx.tech_level}
Urgence: ${ctx.timeline}
Outils existants: ${ctx.current_tools.join(', ') || 'aucun'}
</context>

<instructions>
1. REFORMULE l'objectif de façon précise et actionnable.

2. IDENTIFIE tous les domaines fonctionnels impliqués.
   Un domaine = un grand axe de travail (ex: "Infrastructure",
   "Contenu", "Visibilité", "Analytics").
   Autant de domaines que nécessaire — ne regroupe pas
   artificiellement.

3. Pour chaque domaine, DÉCOMPOSE en sous-tâches atomiques.
   Une sous-tâche est atomique quand :
   - Elle correspond à exactement UN outil ou UNE action précise
   - Elle ne peut pas être scindée davantage sans perdre son sens
   - Elle est directement réalisable (pas un concept vague)
   
   Profondeur libre — laisse la complexité réelle de l'objectif
   dicter le nombre de sous-tâches. Ne limite pas artificiellement.

4. Pour chaque sous-tâche, INDIQUE :
   - La catégorie d'outil requise parmi : ${VALID_CATEGORIES.join(', ')}
     Raisonne sur le sens fonctionnel, pas sur les mots exacts
     de l'utilisateur.
   - Les dépendances : quelles autres sous-tâches doivent être
     complétées avant celle-ci (utilise les ids)
   - Si elle peut être automatisée ou si elle requiert une action
     humaine initiale

5. DÉTECTE les contraintes implicites non mentionnées mais évidentes
   selon le secteur et le contexte (ex: conformité RGPD, besoin
   mobile-first, contraintes légales sectorielles...).
   Laisse vide si aucune contrainte réelle n'est identifiable.

6. CONTEXTUALISE le secteur en 1-2 phrases sur les spécificités
   réelles qui influencent les choix d'outils.

7. Retourne UNIQUEMENT un JSON valide. Aucun markdown,
   aucun backtick, aucun texte avant ou après.
</instructions>

<output>
{
  "original": "reformulation claire et actionnable de l'objectif",
  "domains": [
    {
      "name": "Nom du domaine fonctionnel",
      "priority": 1,
      "subtasks": [
        {
          "id": "d1_t1",
          "action": "description précise de la sous-tâche atomique",
          "required_category": "categorie_exacte",
          "depends_on": [],
          "can_be_automated": true
        },
        {
          "id": "d1_t2",
          "action": "description précise",
          "required_category": "categorie_exacte",
          "depends_on": ["d1_t1"],
          "can_be_automated": false
        }
      ]
    }
  ],
  "implicit_constraints": ["contrainte implicite réelle avec explication courte"],
  "sector_context": "1-2 phrases sur les spécificités sectorielles",
  "budget_max": ${budgetValue}
}
</output>`

  try {
    // Force Qwen 2.5 72B ou Gemini Flash pour une analyse plus précise (maxTokens > 1200)
    // Sacrifie 1-2s de latence pour une meilleure détection des catégories
    const text = await callLLM(prompt, 1300)

    // Strip markdown fences if LLM wraps in ```json ... ```
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    const parsed = JSON.parse(cleaned)

    // Validate structure — throws if LLM returned unexpected shape
    const validated = AnalyzedQuerySchema.parse(parsed)

    // Générer les champs dérivés pour compatibilité avec le reste du système
    const subtasks: string[] = []
    const categoriesSet = new Set<string>()

    validated.domains.forEach(domain => {
      domain.subtasks.forEach(subtask => {
        subtasks.push(subtask.action)
        // Filter categories to only known valid ones
        if ((VALID_CATEGORIES as readonly string[]).includes(subtask.required_category)) {
          categoriesSet.add(subtask.required_category)
        }
      })
    })

    const result: AnalyzedQuery = {
      original:             validated.original,
      domains:              validated.domains,
      implicit_constraints: validated.implicit_constraints,
      sector_context:       validated.sector_context,
      budget_max:           validated.budget_max,
      subtasks:             subtasks,
      required_categories:  Array.from(categoriesSet),
    }

    console.log(
      `[QueryAnalyzer] ✅ ${result.domains.length} domaines | ` +
      `${result.subtasks.length} sous-tâches atomiques | ` +
      `catégories: [${result.required_categories.join(', ')}]`
    )
    
    return result

  } catch (err) {
    console.error('[QueryAnalyzer] ❌ Erreur:', err instanceof Error ? err.message : String(err))

    // Safe fallback — pipeline continues with minimal context
    return buildFallback(ctx.objective, ctx.sector, budgetValue)
  }
}
