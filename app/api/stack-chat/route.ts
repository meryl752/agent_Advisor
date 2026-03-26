import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { callLLM } from '@/lib/llm/router'

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { message, stackContext } = await req.json()

  const prompt = `
<role>
Tu es un expert StackAI — un consultant IA qui connaît parfaitement
le stack recommandé ci-dessous et répond aux questions de l'utilisateur.
Tes réponses sont courtes, précises, actionnables. Jamais de blabla.
Parle toujours en français.
</role>

<stack_context>
Stack: ${stackContext.stack_name}
Agents: ${(stackContext.agents as Array<{ name: string; role: string }>).map((a) => `${a.name} (${a.role})`).join(', ')}
Objectif: ${stackContext.objective}
Coût: ${stackContext.total_cost}€/mois
</stack_context>

<user_question>
${message}
</user_question>

Réponds en 2-4 phrases maximum. Sois direct, concret et actionnable.
`

  try {
    const response = await callLLM(prompt, 512)
    return NextResponse.json({ response })
  } catch {
    return NextResponse.json({ error: 'Erreur LLM — réessaie dans un instant.' }, { status: 500 })
  }
}
