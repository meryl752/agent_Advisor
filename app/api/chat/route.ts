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
- Décider automatiquement quand générer un stack — comme Claude génère un artifact

RÈGLES DE GÉNÉRATION DE STACK:
Tu dois mettre "generate_stack": true si L'UNE de ces conditions est remplie :
1. L'utilisateur demande explicitement de générer ("génère", "crée", "fais-le", "go", "let's go", "vas-y", "maintenant", "bordel", "putain", "allez")
2. L'objectif business est clair ET tu as posé au moins 1 question de clarification
3. L'utilisateur confirme après ta question de clarification ("oui", "ok", "d'accord", "exactement")

IMPORTANT - MOTS DÉCLENCHEURS ABSOLUS:
Si l'utilisateur dit l'un de ces mots, tu DOIS générer IMMÉDIATEMENT sans exception:
- "génère", "génère-la", "génère la", "génère le"
- "vas-y", "vas y", "allez", "go"
- "fais-le", "fais le", "crée-le", "crée le"
- "bordel", "putain" (frustration = il veut que tu génères)
- "maintenant", "tout de suite"

Tu dois mettre "generate_stack": false UNIQUEMENT si :
- Le message est une salutation initiale (hello, bonjour, ça va)
- L'utilisateur pose une question générale sans contexte business
- L'objectif est complètement vague et tu n'as AUCUNE info (premier message flou)

COMPORTEMENT:
- Si l'utilisateur dit "go", "génère", "fais-le" → génère IMMÉDIATEMENT même si tu as des doutes
- Si le besoin est clair → génère automatiquement sans poser de question
- Si le besoin est vague → pose UNE seule question de clarification, puis génère à la réponse suivante
- Ne pose JAMAIS plus de 2 questions avant de générer
- Utilise le profil utilisateur pour personnaliser — ne repose jamais des questions déjà répondues
- Reste concis, naturel, utile

${memoryText}${stackText}${historyText}
Utilisateur: ${message}

Retourne ce JSON:
{
  "response": "ta réponse naturelle à l'utilisateur",
  "objective": "résumé précis du besoin/objectif si identifié (null sinon)",
  "generate_stack": true ou false,
  "ready_reason": "pourquoi tu génères maintenant (null si generate_stack est false)"
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
          generate_stack: parsed.generate_stack === true,
        })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ response: raw, objective: null })
  } catch {
    return NextResponse.json({ error: 'Erreur LLM — réessaie.' }, { status: 500 })
  }
}
