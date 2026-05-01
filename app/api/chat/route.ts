import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { callLLM } from '@/lib/llm/router'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(20).optional().default([]),
  stackContext: z.object({
    stack_name: z.string(),
    objective: z.string(),
    total_cost: z.number(),
    agents: z.array(z.object({ name: z.string(), role: z.string() })),
  }).optional(),
})

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })

  const validation = chatSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const { message, history, stackContext } = validation.data

  // Build conversation history for context
  const historyText = history.length > 0
    ? `\n<conversation_history>\n${history.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`).join('\n')}\n</conversation_history>\n`
    : ''

  const stackText = stackContext
    ? `\n<stack_actuel>\nStack: ${stackContext.stack_name}\nOutils: ${stackContext.agents.map(a => `${a.name} (${a.role})`).join(', ')}\nObjectif: ${stackContext.objective}\nCoût: ${stackContext.total_cost}€/mois\n</stack_actuel>\n`
    : ''

  const prompt = `Tu es l'assistant IA de Raspquery — une plateforme qui recommande des stacks d'outils IA personnalisés.

Tu es conversationnel, direct et utile. Tes réponses sont courtes (2-5 phrases max). Tu parles français.

WORKFLOW:
1. L'utilisateur décrit un besoin → tu poses des questions de clarification
2. Tu comprends son contexte → tu PROPOSES: "Veux-tu que je te génère un stack pour [objectif] ?"
3. Il confirme ("oui"/"vas-y"/etc.) → retourne {"intent": "build_stack", "response": "Parfait, je génère ton stack."}
4. Il refuse/hésite → retourne {"intent": "chat", "response": "..."}

RÈGLES INTENT (ULTRA-SIMPLE):

"build_stack" = L'utilisateur te DEMANDE ou t'ORDONNE de générer un stack MAINTENANT
  → Ton test mental : "Est-ce que l'utilisateur me dit de FAIRE quelque chose ou me DEMANDE si je PEUX faire quelque chose ?"
  → Si FAIRE → build_stack
  → Si DEMANDER/QUESTIONNER → chat
  → IMPORTANT: Quand tu retournes build_stack, tu DOIS aussi extraire l'objectif business de la conversation

"chat" = Tout le reste (questions, descriptions, propositions, hésitations)

EXEMPLES CLAIRS:
✓ "Oui" (après ta proposition) → build_stack (accord = instruction)
✓ "Vas-y" → build_stack (ordre direct)
✓ "Construis-moi un stack" → build_stack (ordre direct)
✗ "Tu peux en générer ?" → chat (question sur capacité, pas ordre)
✗ "Du coup tu peux faire ça ?" → chat (question, pas instruction)
✗ "C'est possible ?" → chat (question)
✗ "J'ai besoin d'aide" → chat (description, pas ordre)

Retourne UNIQUEMENT ce JSON (sans markdown):
{"intent": "chat" | "build_stack", "response": "ta réponse ici", "objective": "objectif extrait de la conversation (REQUIS si build_stack)"}

Si intent = "build_stack", tu DOIS inclure "objective" avec l'objectif business extrait de l'historique de conversation.
Si l'utilisateur n'a PAS donné d'objectif clair, retourne "chat" et demande plus de détails.

EXEMPLES:
User: "J'ai du mal à trouver des clients" → {"intent": "chat", "response": "Veux-tu que je te génère un stack pour ça ?"}
User: "Oui" → {"intent": "build_stack", "response": "Parfait, je génère ton stack.", "objective": "trouver des clients"}
User: "Construis-moi un stack pour ma prospection B2B" → {"intent": "build_stack", "response": "OK, je lance.", "objective": "prospection B2B"}
User: "Tu peux en générer ?" → {"intent": "chat", "response": "Oui ! Pour quel objectif ?"}
User (sans contexte): "Oui oui" → {"intent": "chat", "response": "Super ! Mais dis-moi d'abord : quel est ton objectif business ?"}

Retourne UNIQUEMENT ce JSON (sans markdown):
{"intent": "chat" | "build_stack", "response": "ta réponse ici"}
${stackText}${historyText}
Utilisateur: ${message}

Réponds directement.`

  try {
    const raw = await callLLM(prompt, 600)
    // Try to parse JSON intent response
    const jsonMatch = raw.replace(/<think>[\s\S]*?<\/think>/g, '').match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          response: parsed.response ?? raw,
          intent: parsed.intent ?? 'chat',
        })
      } catch { /* fall through to plain text */ }
    }
    return NextResponse.json({ response: raw, intent: 'chat' })
  } catch {
    return NextResponse.json({ error: 'Erreur LLM — réessaie.' }, { status: 500 })
  }
}
