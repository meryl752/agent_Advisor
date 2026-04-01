import { callLLM } from '@/lib/llm/router'
import type { AnalyzedQuery, ScoredAgent, UserContext, FinalStack } from './types'

const BUDGET_MAP = {
  zero: 0, low: 50, medium: 200, high: 1000,
}

const TECH_LEVEL_DESCRIPTION = {
  beginner: 'débutant complet — aucun code, interfaces visuelles uniquement, setup en quelques clics',
  intermediate: 'niveau intermédiaire — à l\'aise avec le no-code, peut suivre des tutoriels techniques',
  advanced: 'niveau avancé — peut coder, configurer des APIs, gérer des intégrations complexes',
}

const TEAM_DESCRIPTION = {
  solo: 'entrepreneur solo — doit tout gérer seul, priorité aux outils autonomes',
  small: 'petite équipe 2-10 personnes — collaboration simple, pas de surcharge administrative',
  medium: 'équipe moyenne 10-50 — besoin de coordination et de reporting',
  large: 'grande organisation 50+ — besoin de scalabilité et de gouvernance',
}

export async function buildStack(
  ctx: UserContext,
  query: AnalyzedQuery,
  candidates: ScoredAgent[],
  referenceStacks: Array<{ title: string; agent_names: string[]; description: string }> = []
): Promise<FinalStack | null> {

  const candidateList = candidates.map((a, i) =>
    `${i + 1}. ID="${a.id}" | NOM="${a.name}" | CATÉGORIE=${a.category} | PRIX=${a.price_from}€/mois | DIFFICULTÉ=${a.setup_difficulty} | DÉLAI_VALEUR=${a.time_to_value} | SCORE_PERTINENCE=${a.relevance_score}/100 | RAISON_SÉLECTION="${a.relevance_reason}"`
  ).join('\n')

  // Ancrage "vérité terrain" — stacks validés par des experts
  const referenceSection = referenceStacks.length > 0
    ? `
<reference_stacks>
Ces stacks ont été validés par des experts pour des cas similaires.
Utilise-les comme ANCRAGE de qualité — pas comme copie exacte :
${referenceStacks.map(r => `• ${r.title}: ${r.agent_names.join(' → ')} — ${r.description}`).join('\n')}
</reference_stacks>
`
    : ''

  // E-COMMERCE EXPERTISE
  const ECOM_CONTEXT = `
<ecommerce_expertise>
Tu es spécialisé dans les stacks e-commerce. Pour chaque requête e-com, tu dois :
1. Identifier le sous-cas précis : dropshipping / POD / digital / physique / Amazon / B2B
2. Recommander les outils SPÉCIALISÉS pour ce sous-cas — pas des outils généralistes
3. Respecter l'ordre logique : Recherche produit → Boutique → Contenu → Marketing → Analytics → Rétention
4. Toujours inclure un outil de tracking/analytics ET un outil de rétention email
5. Privilégier les intégrations natives Shopify quand disponibles
</ecommerce_expertise>
`

  const isEcom = ['ecommerce', 'boutique', 'shopify', 'dropshipping', 'vendre', 'produit'].some(
    kw => ctx.objective.toLowerCase().includes(kw) ||
          query.sector_context?.toLowerCase().includes(kw)
  )

  const prompt = `
${isEcom ? ECOM_CONTEXT : ''}
<role>
Tu es un architecte de solutions IA d'élite. Tu construis des stacks d'outils IA sur mesure qui transforment concrètement les business. Chaque recommandation que tu fais est basée sur le profil EXACT de l'utilisateur — jamais générique, toujours spécifique.
</role>
${referenceSection}
<project_context>
OBJECTIF ANALYSÉ: ${query.original}
SECTEUR: ${ctx.sector}
CONTEXTE SECTORIEL: ${query.sector_context}
PROFIL TECHNIQUE: ${TECH_LEVEL_DESCRIPTION[ctx.tech_level]}
PROFIL ÉQUIPE: ${TEAM_DESCRIPTION[ctx.team_size]}
BUDGET MAXIMUM ABSOLU: ${BUDGET_MAP[ctx.budget]}€/mois
URGENCE: ${ctx.timeline}
OUTILS DÉJÀ EN PLACE: ${ctx.current_tools.join(', ') || 'aucun — partir de zéro'}
</project_context>

<subtasks_to_cover>
${query.subtasks.map((s, i) => `${i + 1}. ${s}`).join('\n')}
</subtasks_to_cover>

<implicit_constraints>
${query.implicit_constraints.map(c => `• ${c}`).join('\n') || '• Aucune contrainte spécifique détectée'}
</implicit_constraints>

<success_metrics>
${query.success_metrics.map(m => `• ${m}`).join('\n')}
</success_metrics>

<available_candidates>
${candidateList}
</available_candidates>

<critical_rules>
RÈGLE 1 — BUDGET: Le total_cost DOIT être ≤ ${BUDGET_MAP[ctx.budget]}€/mois. Violation = stack inutilisable.
RÈGLE 2 — NOMBRE: Sélectionne entre 4 et 6 agents. Ni plus, ni moins.
RÈGLE 3 — ORDRE: Les agents sont classés dans l'ordre CHRONOLOGIQUE d'implémentation. L'agent 1 est le premier à installer.
RÈGLE 4 — SPÉCIFICITÉ: Chaque description doit mentionner CE projet précis. INTERDIT de parler d'un outil en général.
RÈGLE 5 — RÉSULTATS CONCRETS: Chaque concrete_result doit être chiffré. "Tu gagnes X heures" ou "Tu économises Y€" ou "Tes clients reçoivent une réponse en Z secondes".
RÈGLE 6 — PROFIL: Respecte le niveau technique. Un débutant ne peut pas utiliser un outil "hard".
RÈGLE 7 — COMPLÉMENTARITÉ: Les agents doivent s'articuler entre eux. Explique comment l'agent N prépare le travail pour l'agent N+1.
</critical_rules>

<output_format>
JSON strict uniquement. Zéro markdown. Zéro backtick. Zéro texte avant ou après le JSON.
{
  "stack_name": "Nom court et mémorable qui décrit exactement ce que fait ce stack pour CE projet",
  "justification": "En 3 phrases maximum: (1) Le problème central résolu, (2) Comment les outils s'articulent entre eux dans CE projet précis, (3) Le résultat final attendu en chiffres",
  "total_cost": <nombre entier en euros>,
  "roi_estimate": <pourcentage entier>,
  "time_saved_per_week": <nombre d'heures économisées par semaine>,
  "quick_wins": [
    "Aujourd'hui: action précise avec l'outil X — résultat visible en Y heures",
    "Dans 48h: ce que tu automatises et le temps que tu récupères",
    "Dans 1 semaine: transformation concrète de ton process actuel"
  ],
  "warnings": [
    "Vigilance spécifique à CE projet et CE profil avec conseil concret pour l'éviter",
    "Limitation réelle d'un outil dans CE contexte avec alternative si problème"
  ],
  "subtasks": [
    {
      "name": "Nom de la sous-tâche",
      "without_ai": "Avant IA: X heures par semaine / Y€ par mois / Z étapes manuelles",
      "with_ai": "Après IA: résultat en N minutes, automatique, résultat concret visible",
      "tool_name": "Nom exact de l'outil qui couvre cette sous-tâche"
    }
  ],
  "agents": [
    {
      "id": "<UUID exact depuis available_candidates>",
      "name": "<nom exact>",
      "category": "<catégorie>",
      "price_from": <prix mensuel>,
      "score": <score 0-100>,
      "rank": <ordre d'implémentation 1,2,3...>,
      "website_domain": "<domaine.com>",
      "setup_difficulty": "<easy|medium|hard>",
      "time_to_value": "<délai pour voir les premiers résultats>",
      "role": "Son rôle SPÉCIFIQUE dans CE projet — pas en général",
      "reason": "Pourquoi CET outil plutôt qu'un autre pour CE profil précis (niveau technique + budget + secteur + urgence)",
      "concrete_result": "Exemple chiffré et précis: 'Tes [élément du projet] passent de X à Y, tu récupères Z heures/semaine'",
      "prompt_to_use": "Si l'outil est un LLM (ex: Claude, GPT, Gemini): le prompt exact à copier-coller pour accomplir sa mission dans CE projet, en français, adapté au contexte précis. Si l'outil n'est pas un LLM (ex: Make.com, Shopify, Zapier, Notion...): les 3-4 étapes concrètes pour le configurer et l'utiliser afin d'accomplir sa tâche dans ce projet précis. Commence directement par l'action, sans introduction."
    }
  ]
}
</output_format>`

  try {
    const text = await callLLM(prompt, 3000)

    // Extract JSON — strip any markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in LLM response')

    let raw = jsonMatch[0]

    // Attempt 1: direct parse
    try {
      return JSON.parse(raw) as FinalStack
    } catch {
      // Attempt 2: truncated JSON repair
      // Find the last complete agent object by locating the last valid closing brace
      // before the agents array closes
      raw = repairTruncatedJSON(raw)
      return JSON.parse(raw) as FinalStack
    }
  } catch (err) {
    console.error('StackBuilder error:', err)
    return null
  }
}

/**
 * Attempts to repair a JSON string that was truncated mid-way.
 * Closes any open arrays/objects so JSON.parse can succeed.
 */
function repairTruncatedJSON(raw: string): string {
  // Remove trailing incomplete string/value after last complete comma-separated item
  // Strategy: track open brackets and close them
  const stack: string[] = []
  let inString = false
  let escape = false
  let lastSafePos = 0

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === '{' || ch === '[') {
      stack.push(ch)
    } else if (ch === '}' || ch === ']') {
      stack.pop()
      if (stack.length === 0) lastSafePos = i + 1
    } else if ((ch === ',' || ch === ':') && stack.length <= 2) {
      lastSafePos = i
    }
  }

  if (stack.length === 0) return raw // already valid

  // Truncate to last safe position and close all open brackets
  let repaired = raw.slice(0, lastSafePos).trimEnd()
  // Remove trailing comma if any
  if (repaired.endsWith(',')) repaired = repaired.slice(0, -1)

  // Close in reverse order
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === '{' ? '}' : ']'
  }

  return repaired
}
