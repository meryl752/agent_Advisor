import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { callLLM } from '@/lib/llm/router'
import { getUserMemory, formatMemoryForPrompt } from '@/lib/supabase/memory'
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

  // Load user memory
  const memory = await getUserMemory(user.id).catch(() => null)
  const memoryText = memory ? formatMemoryForPrompt(memory) : ''

  const historyText = history.length > 0
    ? `\n<conversation_history>\n${history.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`).join('\n')}\n</conversation_history>\n`
    : ''

  const stackText = stackContext
    ? `\n<stack_actuel>\nStack: ${stackContext.stack_name}\nOutils: ${stackContext.agents.map(a => `${a.name} (${a.role})`).join(', ')}\nObjectif: ${stackContext.objective}\nCoût: ${stackContext.total_cost}€/mois\n</stack_actuel>\n`
    : ''

  const prompt = `Tu es l'assistant IA de Raspquery — une plateforme qui recommande des stacks d'outils IA personnalisés pour les entrepreneurs et créateurs.

TON RÔLE:
- Converser naturellement avec l'utilisateur pour comprendre son contexte et ses besoins
- Répondre à ses questions sur les outils IA, l'automatisation, la productivité
- L'aider à clarifier son besoin si c'est vague — une seule question à la fois, pas un interrogatoire
- Ne jamais générer de stack toi-même — c'est le moteur de recommandation qui s'en charge quand l'utilisateur le décide

COMPORTEMENT:
- Si le besoin est clair dès le départ, réponds directement et mentionne que tu peux générer un stack si l'utilisateur le souhaite
- Si le besoin est vague, pose UNE seule question de clarification
- Si l'utilisateur pose une question simple sur un outil, réponds directement sans pousser vers un stack
- Utilise le profil et l'historique de l'utilisateur pour personnaliser tes réponses — ne repose jamais des questions auxquelles il a déjà répondu
- Reste concis, naturel, utile — pas de questions en cascade

${memoryText}${stackText}${historyText}
Utilisateur: ${message}

Retourne ce JSON:
{
  "response": "ta réponse naturelle à l'utilisateur",
  "objective": "résumé du besoin/objectif si identifié dans la conversation (null sinon)"
}`

  try {
    const raw = await callLLM(prompt, 600)
    const jsonMatch = raw.replace(/<think>[\s\S]*?<\/think>/g, '').match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          response: parsed.response ?? raw,
          objective: parsed.objective ?? null,
        })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ response: raw, objective: null })
  } catch {
    return NextResponse.json({ error: 'Erreur LLM — réessaie.' }, { status: 500 })
  }
}
