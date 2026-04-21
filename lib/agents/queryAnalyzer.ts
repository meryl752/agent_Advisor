import { z } from 'zod'
import { callLLM } from '@/lib/llm/router'
import { BUDGET_MAP, VALID_CATEGORIES } from '@/lib/constants'
import type { UserContext, AnalyzedQuery } from './types'

// ─── Zod schema for LLM output validation ────────────────────────────────────
// Prevents silent failures when the LLM returns an unexpected structure

const AnalyzedQuerySchema = z.object({
  original:             z.string().min(1),
  subtasks:             z.array(z.string()).min(1).max(10),
  required_categories:  z.array(z.string()).min(0).max(5),
  implicit_constraints: z.array(z.string()).default([]),
  sector_context:       z.string().default(''),
  success_metrics:      z.array(z.string()).default([]),
  budget_max:           z.number().min(0),
})

export async function analyzeQuery(ctx: UserContext): Promise<AnalyzedQuery> {
  const budgetValue = BUDGET_MAP[ctx.budget] ?? 0

  const prompt = `
<role>
Tu es un consultant senior en transformation digitale et IA, spécialisé dans l'optimisation des processus business par les outils IA. Tu as accompagné plus de 500 entreprises dans leur adoption de l'IA.
</role>

<mission>
Analyser en profondeur la demande suivante et en extraire TOUTE l'information nécessaire pour construire un stack IA parfaitement adapté.
</mission>

<user_request>
OBJECTIF EXPRIMÉ: "${ctx.objective}"
SECTEUR D'ACTIVITÉ: ${ctx.sector}
TAILLE ÉQUIPE: ${ctx.team_size}
BUDGET MENSUEL MAX: ${budgetValue}€
NIVEAU TECHNIQUE: ${ctx.tech_level}
URGENCE: ${ctx.timeline}
OUTILS DÉJÀ EN PLACE: ${ctx.current_tools.join(', ') || 'aucun'}
</user_request>

<instructions>
1. REFORMULE l'objectif de façon précise et actionnable
2. DÉCOMPOSE en sous-tâches concrètes — chaque sous-tâche doit être:
   - Spécifique et mesurable
   - Directement liée à l'objectif principal
   - Réalisable avec un outil IA ou digital
3. IDENTIFIE les catégories d'outils nécessaires parmi:
   ${VALID_CATEGORIES.join(', ')}
   
   ATTENTION - Mapping des besoins vers catégories:
   - "créer un site web", "site internet", "landing page" → website
   - "réservation", "booking", "prise de rendez-vous" → automation
   - "être trouvé sur Google", "référencement local", "SEO local" → seo
   - "contenu", "textes", "descriptions" → copywriting
   - "images", "photos", "visuels" → image
   
4. DÉTECTE les contraintes implicites que l'utilisateur n'a pas mentionnées mais qui sont évidentes
5. CONTEXTUALISE selon le secteur — chaque secteur a ses spécificités
6. DÉFINIS des métriques de succès MESURABLES et CHIFFRÉES
</instructions>

<output_format>
JSON strict, aucun markdown, aucun backtick, aucun texte avant ou après:
{
  "original": "Reformulation précise et actionnable de l'objectif",
  "subtasks": [
    "Sous-tâche 1: action concrète + résultat attendu",
    "Sous-tâche 2: action concrète + résultat attendu",
    "Sous-tâche 3: action concrète + résultat attendu",
    "Sous-tâche 4: action concrète + résultat attendu",
    "Sous-tâche 5: action concrète + résultat attendu"
  ],
  "required_categories": ["catégorie1", "catégorie2", "catégorie3"],
  "implicit_constraints": [
    "Contrainte implicite 1 avec explication",
    "Contrainte implicite 2 avec explication"
  ],
  "sector_context": "Analyse du contexte sectoriel: défis spécifiques, opportunités IA, benchmarks du secteur",
  "success_metrics": [
    "Métrique 1: chiffrée et mesurable",
    "Métrique 2: chiffrée et mesurable"
  ],
  "budget_max": ${budgetValue}
}
</output_format>`

  try {
    const text = await callLLM(prompt, 1024)

    // Strip markdown fences if LLM wraps in ```json ... ```
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    const parsed = JSON.parse(cleaned)

    // Validate structure — throws if LLM returned unexpected shape
    const validated = AnalyzedQuerySchema.parse(parsed)

    // Filter categories to only known valid ones
    validated.required_categories = validated.required_categories.filter(c =>
      (VALID_CATEGORIES as readonly string[]).includes(c)
    )

    console.log(`[QueryAnalyzer] ✅ ${validated.subtasks.length} sous-tâches | catégories: [${validated.required_categories.join(', ')}]`)
    return validated as AnalyzedQuery

  } catch (err) {
    console.error('[QueryAnalyzer] ❌ Erreur:', err instanceof Error ? err.message : String(err))

    // Safe fallback — pipeline continues with minimal context
    return {
      original:             ctx.objective,
      subtasks:             [ctx.objective],
      required_categories:  [],
      implicit_constraints: [],
      sector_context:       ctx.sector,
      success_metrics:      [],
      budget_max:           budgetValue,
    }
  }
}
