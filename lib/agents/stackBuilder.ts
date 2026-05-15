import { callLLM } from '@/lib/llm/router'
import { repairTruncatedJSON } from '@/lib/utils/jsonRepair'
import { BUDGET_MAP } from '@/lib/constants'
import type { AnalyzedQuery, ScoredAgent, UserContext, FinalStack, StackAgent } from './types'

// ─── Impact level from roi_score (DB) ────────────────────────────────────────

function getImpactLevel(roiScore: number): string {
  if (roiScore >= 80) return 'élevé'
  if (roiScore >= 50) return 'moyen'
  return 'modéré'
}

// ─── Format candidates for Appel 1 (rich context) ───────────────────────────

function formatCandidatesForSelection(candidates: ScoredAgent[]): string {
  return candidates.map((a, i) => {
    const useCases = a.use_cases?.slice(0, 5).join(', ') || 'N/A'
    const bestFor = a.best_for?.slice(0, 3).join(', ') || 'N/A'
    return [
      `${i + 1}. ID="${a.id}" | NOM="${a.name}" | PRIX=${a.price_from}€ | DIFF=${a.setup_difficulty || 'easy'} | SCORE=${a.relevance_score}/100`,
      `   USE_CASES: ${useCases}`,
      `   BEST_FOR: ${bestFor}`,
    ].join('\n')
  }).join('\n\n')
}

// ─── Format selected tools for Appel 2 ──────────────────────────────────────

function formatSelectedToolsForEnrichment(
  selectedTools: Array<ScoredAgent & { rank: number; assignedSubtask: string }>
): string {
  return selectedTools.map(t => {
    const useCases = t.use_cases?.slice(0, 5).join(', ') || 'N/A'
    const bestFor = t.best_for?.slice(0, 3).join(', ') || 'N/A'
    return [
      `[RANK ${t.rank}] NOM="${t.name}" | SOUS-TÂCHE: "${t.assignedSubtask}"`,
      `   DESCRIPTION: ${t.description}`,
      `   USE_CASES: ${useCases}`,
      `   BEST_FOR: ${bestFor}`,
    ].join('\n')
  }).join('\n\n')
}

// ─── Main builder ────────────────────────────────────────────────────────────

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

  const budgetMax = BUDGET_MAP[ctx.budget]
  const techMap = { beginner: 'débutant (no-code)', intermediate: 'intermédiaire (no-code avancé)', advanced: 'avancé (code OK)' }
  const teamMap = { solo: 'solo', small: 'petite équipe', medium: 'équipe moyenne', large: 'grande org' }

  const candidatesFormatted = formatCandidatesForSelection(candidates)

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL 1 — Sélection pure (IDs + subtask coverage + warnings)
  // Le LLM ne fait QUE choisir — zéro narration, zéro créativité
  // ══════════════════════════════════════════════════════════════════════════

  const selectionPrompt = `Tu sélectionnes les meilleurs outils IA depuis une liste de candidats.

CONTEXTE UTILISATEUR:
- Objectif: ${query.original}
- Secteur: ${ctx.sector}
- Budget MAX: ${budgetMax}€/mois
- Niveau technique: ${ctx.tech_level}
- Outils existants: ${ctx.current_tools.join(', ') || 'aucun'}

SOUS-TÂCHES À COUVRIR:
${query.subtasks.map((s, i) => `${i + 1}. ${s}`).join('\n')}

CANDIDATS (capacités réelles depuis notre base):
${candidatesFormatted}

RÈGLES:
1. Budget total des outils sélectionnés ≤ ${budgetMax}€/mois
2. 1 outil par sous-tâche — pas de doublons fonctionnels
3. Nombre d'outils: ${minTools}-${maxTools}
4. Respecte le niveau technique — si beginner, écarte les outils "hard"
5. Si une sous-tâche n'est couverte par aucun candidat, indique-le dans warnings

JSON UNIQUEMENT (pas de markdown, pas de texte avant/après):
{
  "selected_ids": ["uuid1", "uuid2"],
  "subtask_coverage": {"sous-tâche exacte 1": "uuid1", "sous-tâche exacte 2": "uuid2"},
  "warnings": ["besoin non couvert: X"]
}`

  let selectedIds: string[] = []
  let subtaskCoverage: Record<string, string> = {}
  let selectionWarnings: string[] = []

  try {
    console.log('[StackBuilder] Appel 1 — Sélection...')
    const selectionText = await callLLM(selectionPrompt, 800, ctx.preferred_model)
    const jsonMatch = selectionText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in selection response')

    const selection = JSON.parse(jsonMatch[0])
    selectedIds = Array.isArray(selection.selected_ids) ? selection.selected_ids : []
    subtaskCoverage = selection.subtask_coverage ?? {}
    selectionWarnings = Array.isArray(selection.warnings) ? selection.warnings : []

    console.log(`[StackBuilder] ✅ Appel 1 — ${selectedIds.length} outils sélectionnés`)
  } catch (err) {
    console.error('[StackBuilder] ❌ Appel 1 échoué:', err)
    return null
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDATION PROGRAMMATIQUE (code pur, 0 LLM)
  // Vérifie la cohérence de la sélection avec les données réelles
  // ══════════════════════════════════════════════════════════════════════════

  // 1. Filtrer les IDs invalides (qui n'existent pas dans les candidats)
  const validIds = selectedIds.filter(id => candidates.some(c => c.id === id))
  if (validIds.length !== selectedIds.length) {
    const invalidCount = selectedIds.length - validIds.length
    console.warn(`[StackBuilder] ⚠️ ${invalidCount} ID(s) invalide(s) supprimé(s)`)
  }

  if (validIds.length === 0) {
    console.error('[StackBuilder] ❌ Aucun ID valide après validation')
    return null
  }

  // 2. Construire les outils sélectionnés avec les données RÉELLES de la DB
  let selectedTools = validIds.map((id, index) => {
    const candidate = candidates.find(c => c.id === id)!
    // Retrouver quelle sous-tâche est assignée à cet outil
    const assignedSubtask = Object.entries(subtaskCoverage)
      .find(([, toolId]) => toolId === id)?.[0] ?? query.subtasks[index] ?? ''
    return {
      ...candidate,
      rank: index + 1,
      assignedSubtask,
    }
  })

  // 3. Vérification budget — retirer les outils les plus chers si nécessaire
  let totalCost = selectedTools.reduce((sum, t) => sum + t.price_from, 0)
  while (totalCost > budgetMax && selectedTools.length > minTools) {
    const mostExpensive = selectedTools.reduce((max, t) =>
      t.price_from > max.price_from ? t : max, selectedTools[0])
    selectedTools = selectedTools.filter(t => t.id !== mostExpensive.id)
    totalCost = selectedTools.reduce((sum, t) => sum + t.price_from, 0)
    console.warn(`[StackBuilder] ✂️ ${mostExpensive.name} retiré (budget: ${totalCost}€/${budgetMax}€)`)
    selectionWarnings.push(`${mostExpensive.name} retiré pour respecter le budget de ${budgetMax}€/mois`)
  }

  // 4. Anti-redondance (déterministe — groupes fonctionnels)
  const redundantGroups = [
    ['Lavender', 'Outreach', 'Lemlist', 'Instantly'],
    ['Cursor', 'GitHub Copilot', 'Windsurf', 'Codeium'],
    ['Ahrefs', 'Semrush', 'Moz'],
    ['Minea', 'Sell The Trend', 'Dropship.io'],
  ]

  for (const group of redundantGroups) {
    const found = selectedTools.filter(t => group.includes(t.name))
    if (found.length > 1) {
      const toRemove = found.slice(1)
      selectedTools = selectedTools.filter(t => !toRemove.some(r => r.id === t.id))
      console.warn(`[StackBuilder] ✂️ Anti-redondance: ${toRemove.map(r => r.name).join(', ')} retiré(s) — doublon avec ${found[0].name}`)
    }
  }

  // 5. Re-ranking après filtrage
  selectedTools = selectedTools.map((t, i) => ({ ...t, rank: i + 1 }))

  console.log(`[StackBuilder] ✅ Validation — ${selectedTools.length} outils validés, coût: ${selectedTools.reduce((s, t) => s + t.price_from, 0)}€/${budgetMax}€`)

  // ══════════════════════════════════════════════════════════════════════════
  // APPEL 2 — Enrichissement narratif
  // Le LLM contextualise les outils pour CE projet — ancré dans les use_cases
  // ══════════════════════════════════════════════════════════════════════════

  const selectedToolsFormatted = formatSelectedToolsForEnrichment(selectedTools)

  const enrichmentPrompt = `Tu enrichis la présentation d'outils IA sélectionnés pour un utilisateur spécifique.

UTILISATEUR:
- Objectif: ${query.original}
- Secteur: ${ctx.sector} | ${query.sector_context}
- Profil: ${techMap[ctx.tech_level]} | ${teamMap[ctx.team_size]}

OUTILS SÉLECTIONNÉS (données vérifiées depuis notre base):
${selectedToolsFormatted}

Pour chaque outil, génère:
- "role": rôle spécifique dans CE projet. DOIT s'appuyer sur un des USE_CASES listés, appliqué au contexte du projet et du secteur "${ctx.sector}". Max 15 mots.
- "reason": pourquoi cet outil pour CE profil précis. Max 25 mots.
- "concrete_result": résultat concret attendu pour CE projet. INTERDICTION d'inventer des chiffres, heures ou pourcentages. Décris le résultat fonctionnel uniquement.

Pour le stack global, génère:
- "stack_name": nom court et mémorable (max 4 mots)
- "justification": 2-3 phrases — problème résolu + articulation des outils
- "quick_wins": ["Aujourd'hui: action concrète", "Dans 48h: action", "Dans 1 semaine: transformation"]

INTERDICTIONS ABSOLUES:
- NE PAS inventer de chiffres (heures économisées, ROI, pourcentages, nombre de leads)
- NE PAS inventer de fonctionnalités qu'un outil n'a pas selon ses USE_CASES
- NE PAS généraliser — chaque phrase parle de CE projet dans le secteur "${ctx.sector}"

JSON UNIQUEMENT (pas de markdown, pas de texte avant/après):
{
  "stack_name": "...",
  "justification": "...",
  "quick_wins": ["...", "...", "..."],
  "agents": [
    {"id": "uuid", "role": "...", "reason": "...", "concrete_result": "..."}
  ]
}`

  try {
    console.log('[StackBuilder] Appel 2 — Enrichissement...')
    const enrichmentText = await callLLM(enrichmentPrompt, 2000, ctx.preferred_model)
    const jsonMatch = enrichmentText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in enrichment response')

    let enrichmentRaw = jsonMatch[0]
    let enrichment: any
    try {
      enrichment = JSON.parse(enrichmentRaw)
    } catch {
      enrichmentRaw = repairTruncatedJSON(enrichmentRaw)
      enrichment = JSON.parse(enrichmentRaw)
    }

    console.log(`[StackBuilder] ✅ Appel 2 — "${enrichment.stack_name}"`)

    // ════════════════════════════════════════════════════════════════════════
    // POST-PROCESSING (code pur, 0 LLM)
    // Assemble le FinalStack avec données DB + narration LLM
    // ════════════════════════════════════════════════════════════════════════

    const enrichedAgents = Array.isArray(enrichment.agents) ? enrichment.agents : []

    // Assembler les agents finaux : données réelles DB + textes LLM
    const finalAgents: StackAgent[] = selectedTools.map(tool => {
      const llmData = enrichedAgents.find((a: any) => a.id === tool.id) ?? {}

      // ── Validation du role : ancré dans un vrai use_case ──────────────
      let role = llmData.role ?? tool.use_cases[0] ?? 'Outil recommandé'
      const roleWords = role.toLowerCase().split(/\s+/)
      const useCasesLower = (tool.use_cases ?? []).map((uc: string) => uc.toLowerCase())
      const isAnchored = useCasesLower.some((uc: string) =>
        roleWords.some((word: string) => word.length > 3 && uc.includes(word))
      )

      if (!isAnchored && tool.use_cases.length > 0) {
        role = `${tool.use_cases[0]} pour ${ctx.sector}`
        console.warn(`[StackBuilder] ⚠️ Role corrigé pour ${tool.name} (non ancré dans use_cases)`)
      }

      // ── concrete_result : qualitatif LLM + impact calculé depuis roi_score DB ──
      const qualitativeResult = llmData.concrete_result
        ?? `${tool.use_cases[0] ?? 'Automatisation'} pour votre projet`
      const impactLevel = getImpactLevel(tool.roi_score)
      const concreteResult = `${qualitativeResult} — Impact estimé : ${impactLevel}`

      return {
        id: tool.id,
        name: tool.name,
        category: tool.category,
        price_from: tool.price_from,           // DB — jamais LLM
        score: tool.relevance_score,            // Matcher — jamais LLM
        rank: tool.rank,
        role,
        reason: llmData.reason ?? tool.relevance_reason,
        concrete_result: concreteResult,
        website_domain: tool.website_domain,    // DB
        setup_difficulty: tool.setup_difficulty, // DB
        time_to_value: tool.time_to_value,      // DB
      }
    })

    // ── Métriques stack-level calculées depuis la DB ──────────────────────
    const finalTotalCost = finalAgents.reduce((sum, a) => sum + a.price_from, 0)
    const avgRoi = selectedTools.length > 0
      ? Math.round(selectedTools.reduce((sum, t) => sum + (t.roi_score ?? 50), 0) / selectedTools.length)
      : 50

    // ── Subtasks depuis le mapping subtask_coverage ───────────────────────
    const finalSubtasks = query.subtasks.map(subtask => {
      // Matching exact ou fuzzy sur les clés de subtask_coverage
      const toolId = subtaskCoverage[subtask] ??
        Object.entries(subtaskCoverage).find(([key]) =>
          key.toLowerCase().includes(subtask.toLowerCase().slice(0, 20)) ||
          subtask.toLowerCase().includes(key.toLowerCase().slice(0, 20))
        )?.[1]

      const tool = selectedTools.find(t => t.id === toolId)
      return {
        name: subtask,
        without_ai: 'Processus manuel',
        with_ai: tool ? `Automatisé via ${tool.name}` : 'Non couvert',
        tool_name: tool?.name ?? 'N/A',
      }
    })

    // ── Détection de sous-tâches non couvertes → warnings ────────────────
    const uncoveredSubtasks = finalSubtasks.filter(s => s.tool_name === 'N/A')
    if (uncoveredSubtasks.length > 0) {
      uncoveredSubtasks.forEach(s => {
        const warningText = `Besoin non couvert : "${s.name}". Aucun outil correspondant trouvé.`
        if (!selectionWarnings.some(w => w.includes(s.name.slice(0, 20)))) {
          selectionWarnings.push(warningText)
        }
      })
    }

    const finalStack: FinalStack = {
      stack_name: enrichment.stack_name ?? 'Stack IA Recommandé',
      justification: enrichment.justification ?? '',
      total_cost: finalTotalCost,                                  // DB
      roi_estimate: avgRoi,                                        // DB (roi_score moyen)
      time_saved_per_week: Math.round(avgRoi / 10),                // Estimé depuis roi_score
      quick_wins: Array.isArray(enrichment.quick_wins) ? enrichment.quick_wins : [],
      warnings: selectionWarnings,
      subtasks: finalSubtasks,
      agents: finalAgents,
    }

    console.log(`[StackBuilder] ✅ Stack final: "${finalStack.stack_name}" — ${finalStack.agents.length} agents, ${finalStack.total_cost}€/mois`)

    return finalStack
  } catch (err) {
    console.error('[StackBuilder] ❌ Appel 2 échoué:', err)
    return null
  }
}
