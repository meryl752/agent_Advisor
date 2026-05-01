/**
 * Test d'évaluation unique — un seul scénario pour éviter le rate limiting
 */
import { describe, it } from 'vitest'
import { runOrchestrator } from '../orchestrator'
import type { UserContext } from '../types'

const hasKeys = process.env.GROQ_API_KEY
const describeIfKeys = hasKeys ? describe : describe.skip

describeIfKeys('Single evaluation', () => {
  it('evaluates agence marketing stack quality', async () => {
    const ctx: UserContext = {
      objective: 'Je veux automatiser la création de contenu pour mon agence marketing — posts LinkedIn, emails clients, rapports mensuels et veille concurrentielle',
      sector: 'agence',
      team_size: 'small',
      budget: 'medium',
      tech_level: 'intermediate',
      timeline: 'weeks',
      current_tools: ['notion', 'slack'],
    }

    const result = await runOrchestrator(ctx)

    if (!result) {
      console.log('[EVAL] No result — Groq rate limited')
      return
    }

    console.log('\n=== STACK GÉNÉRÉ ===')
    console.log(`Nom: ${result.stack.stack_name}`)
    console.log(`Agents: ${result.stack.agents.length}`)
    console.log(`Coût: ${result.stack.total_cost}€/mois`)
    console.log(`ROI: +${result.stack.roi_estimate}%`)
    console.log(`Mode: ${result.meta.retrieval_mode}`)
    console.log(`Sous-tâches détectées: ${result.meta.subtasks_detected}`)
    console.log('\nOutils recommandés:')
    result.stack.agents.forEach((a, i) => {
      console.log(`  ${i+1}. ${a.name} — ${a.role} — ${a.price_from}€/mois`)
      console.log(`     Résultat concret: ${a.concrete_result}`)
    })
    console.log('\nQuick wins:')
    result.stack.quick_wins?.forEach(w => console.log(`  • ${w}`))

    // LLM judge evaluation
    const { callLLM } = await import('@/lib/llm/router')
    const agentList = result.stack.agents.map((a, i) =>
      `${i+1}. ${a.name} — ${a.role} — ${a.price_from}€/mois`
    ).join('\n')

    const judgePrompt = `Évalue ce stack IA recommandé sur 10. Réponds UNIQUEMENT en JSON sans markdown.

OBJECTIF: "${ctx.objective}"
PROFIL: intermédiaire, petite équipe, budget 200€/mois, outils existants: Notion, Slack

STACK (${result.stack.agents.length} outils):
${agentList}

JSON: {"score": <0-10>, "verdict": "<bon|moyen|insuffisant>", "reason": "<1 phrase>", "missing": "<outil manquant si évident>"}`

    try {
      const judgeResponse = await callLLM(judgePrompt, 300)
      const cleaned = judgeResponse.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const evaluation = JSON.parse(jsonMatch[0])
        console.log('\n=== ÉVALUATION LLM-JUGE ===')
        console.log(`Score: ${evaluation.score}/10`)
        console.log(`Verdict: ${evaluation.verdict}`)
        console.log(`Raison: ${evaluation.reason}`)
        if (evaluation.missing) console.log(`Manquant: ${evaluation.missing}`)
      }
    } catch (e) {
      console.log('[EVAL] Judge failed:', e)
    }
  }, 90_000)
}, 120_000)
