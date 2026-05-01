import { callLLM } from '@/lib/llm/router'
import { BUDGET_MAP } from '@/lib/constants'
import type { AnalyzedQuery, ScoredAgent, UserContext, FinalStack } from './types'

export async function buildStack(
  ctx: UserContext,
  query: AnalyzedQuery,
  candidates: ScoredAgent[],
  referenceStacks: Array<{ title: string; agent_names: string[]; description: string }> = []
): Promise<FinalStack | null> {

  // Dynamic tool count based on subtasks — 1 tool per subtask, min 3, max 8
  const subtaskCount = query.subtasks.length
  const minTools = Math.max(3, Math.min(subtaskCount, 4))
  const maxTools = Math.min(8, Math.max(subtaskCount + 1, 4))

  const candidateList = candidates.map((a, i) => {
    const useCase = a.use_cases?.[0] || ''
    const bestFor = a.best_for?.[0] || ''
    return `${i + 1}. ID="${a.id}" NOM="${a.name}" CAT=${a.category} PRIX=${a.price_from}€ DIFF=${a.setup_difficulty} SCORE=${a.relevance_score}/100 | USE="${useCase}" | FOR="${bestFor}"`
  }).join('\n')

  const referenceSection = referenceStacks.length > 0
    ? `STACKS RÉFÉRENCE: ${referenceStacks.map(r => `${r.title}: ${r.agent_names.join('→')}`).join(' | ')}\n`
    : ''

  const budgetMax = BUDGET_MAP[ctx.budget]
  const techMap = { beginner: 'débutant (no-code)', intermediate: 'intermédiaire (no-code avancé)', advanced: 'avancé (code OK)' }
  const teamMap = { solo: 'solo', small: 'petite équipe', medium: 'équipe moyenne', large: 'grande org' }

  const prompt = `Tu es un expert en stacks IA. Construis le stack optimal pour cet utilisateur.

CONTEXTE:
- Objectif: ${query.original}
- Secteur: ${ctx.sector} | ${query.sector_context}
- Profil: ${techMap[ctx.tech_level]} | ${teamMap[ctx.team_size]} | budget MAX ${budgetMax}€/mois | urgence: ${ctx.timeline}
- Outils existants: ${ctx.current_tools.join(', ') || 'aucun'}
${referenceSection}
SOUS-TÂCHES À COUVRIR:
${query.subtasks.map((s, i) => `${i + 1}. ${s}`).join('\n')}

CANDIDATS DISPONIBLES:
${candidateList}

RÈGLES STRICTES:
1. BUDGET: total_cost ≤ ${budgetMax}€/mois OBLIGATOIRE
2. NOMBRE: ${minTools}-${maxTools} agents (1 par sous-tâche, pas de doublons fonctionnels)
3. ORDRE: classés par ordre d'implémentation (1 = premier à installer)
4. SPÉCIFICITÉ: chaque description parle de CE projet précis, jamais générique
5. RÉSULTATS: concrete_result toujours chiffré (heures/€ économisés)
6. NIVEAU: respecte le niveau technique (débutant = easy uniquement)
7. ANTI-REDONDANCE: jamais 2 outils avec la même fonction principale
8. USE_CASES: le rôle assigné à chaque outil DOIT correspondre à ses USE_CASES réels — ne jamais inventer un rôle qui n'est pas dans ses use_cases
9. COUVERTURE: si un besoin n'est pas couvert, l'indiquer dans warnings

JSON UNIQUEMENT (pas de markdown, pas de texte avant/après):
{
  "stack_name": "nom court mémorable",
  "justification": "3 phrases: problème résolu, articulation des outils, résultat chiffré",
  "total_cost": <entier €>,
  "roi_estimate": <% entier>,
  "time_saved_per_week": <heures>,
  "quick_wins": ["Aujourd'hui: action+résultat", "Dans 48h: action+résultat", "Dans 1 semaine: transformation"],
  "warnings": ["vigilance spécifique si nécessaire"],
  "subtasks": [{"name": "...", "without_ai": "avant: X h/sem", "with_ai": "après: Y min", "tool_name": "..."}],
  "agents": [{
    "id": "<UUID exact>",
    "name": "<nom exact>",
    "category": "<catégorie>",
    "price_from": <prix>,
    "score": <0-100>,
    "rank": <1,2,3...>,
    "website_domain": "<domaine.com>",
    "setup_difficulty": "<easy|medium|hard>",
    "time_to_value": "<délai>",
    "role": "rôle spécifique dans CE projet",
    "reason": "pourquoi cet outil pour CE profil",
    "concrete_result": "chiffré: X→Y, Z heures/sem récupérées",
    "prompt_to_use": "si LLM: prompt exact à copier. si autre: 3-4 étapes de config concrètes"
  }]
}`

  try {
    const text = await callLLM(prompt, 4000)

    // Extract JSON — strip any markdown fences
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in LLM response')

    let raw = jsonMatch[0]

    // Attempt 1: direct parse
    let stack: FinalStack
    try {
      stack = JSON.parse(raw) as FinalStack
    } catch {
      // Attempt 2: truncated JSON repair
      raw = repairTruncatedJSON(raw)
      stack = JSON.parse(raw) as FinalStack
    }

    // ── VALIDATION POST-GÉNÉRATION : Anti-Redondance ──────────────────────
    // Détecte et supprime les outils avec la même fonction principale
    const emailTools = ['Lavender', 'Outreach']
    const ideTools = ['Cursor', 'GitHub Copilot', 'Windsurf']
    const seoTools = ['Ahrefs', 'Semrush']
    const productTools = ['Minea', 'Sell The Trend']
    const redundantPairs = [emailTools, ideTools, seoTools, productTools]

    for (const pair of redundantPairs) {
      const found = stack.agents.filter(a => pair.includes(a.name))
      if (found.length > 1) {
        // Garder seulement le premier (meilleur score/rank)
        const toRemove = found.slice(1)
        stack.agents = stack.agents.filter(a => !toRemove.some(r => r.id === a.id))
        console.warn(`[StackBuilder] ✂️ Removed ${toRemove.map(r => r.name).join(', ')} - redundant with ${found[0].name}`)
      }
    }

    // ── VALIDATION POST-GÉNÉRATION : Couverture Complète ──────────────────
    // Détecte les besoins non couverts et génère des warnings
    const coverageKeywords = [
      { keyword: 'calendrier', suggestion: 'Calendly' },
      { keyword: 'calendar', suggestion: 'Calendly' },
      { keyword: 'scheduling', suggestion: 'Calendly' },
      { keyword: 'qualifier', suggestion: 'Chili Piper' },
      { keyword: 'crm', suggestion: 'HubSpot' },
      { keyword: 'analytics', suggestion: 'Google Analytics' },
    ]

    for (const { keyword, suggestion } of coverageKeywords) {
      if (ctx.objective.toLowerCase().includes(keyword)) {
        const covered = stack.agents.some(a => 
          a.role.toLowerCase().includes(keyword) || 
          a.name.toLowerCase().includes(keyword) ||
          a.concrete_result.toLowerCase().includes(keyword)
        )
        if (!covered) {
          const warningText = `Besoin non couvert: ${keyword}. Aucun outil disponible dans les candidats. Considère d'ajouter ${suggestion} manuellement.`
          // Éviter les doublons
          if (!stack.warnings.some(w => w.includes(keyword))) {
            stack.warnings.push(warningText)
            console.warn(`[StackBuilder] ⚠️ ${warningText}`)
          }
        }
      }
    }

    return stack
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
