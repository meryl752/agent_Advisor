import { callLLM } from '@/lib/llm/router'
import type { UserContext, AnalyzedQuery } from './types'

const BUDGET_MAP = {
    zero: 0, low: 50, medium: 200, high: 1000,
}

export async function analyzeQuery(ctx: UserContext): Promise<AnalyzedQuery> {
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
BUDGET MENSUEL MAX: ${BUDGET_MAP[ctx.budget]}€
NIVEAU TECHNIQUE: ${ctx.tech_level}
URGENCE: ${ctx.timeline}
OUTILS DÉJÀ EN PLACE: ${ctx.current_tools.join(', ') || 'aucun'}
</user_request>

<instructions>
1. REFORMULE l'objectif de façon précise et actionnable
2. DÉCOMPOSE en sous-tâches concrètes — chaque sous-tâche doit être:
   - Spécifique et mesurable
   - Directement liée à l'objectif principal
   - Réalisable avec un outil IA
3. IDENTIFIE les catégories d'outils nécessaires parmi:
   copywriting, image, automation, analytics, customer_service, seo, prospecting, coding, research, video
4. DÉTECTE les contraintes implicites que l'utilisateur n'a pas mentionnées mais qui sont évidentes
   Exemple: "lancer Shopify" implique forcément: besoin de photos produits, de fiches produits, de SAV, de marketing
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
    "Métrique 1: chiffrée et mesurable (ex: réduire le temps de réponse client de 6h à 30 secondes)",
    "Métrique 2: chiffrée et mesurable"
  ],
  "budget_max": ${BUDGET_MAP[ctx.budget]}
}
</output_format>`

    try {
        const text = await callLLM(prompt, 1024)
        return JSON.parse(text) as AnalyzedQuery
    } catch (err) {
        console.error('QueryAnalyzer error:', err)
        return {
            original: ctx.objective,
            subtasks: [ctx.objective],
            required_categories: [],
            implicit_constraints: [],
            sector_context: ctx.sector,
            success_metrics: [],
            budget_max: BUDGET_MAP[ctx.budget],
        }
    }
}