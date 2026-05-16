import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { callLLM } from '@/lib/llm/router'
import { captureError, setSentryUser } from '@/lib/monitoring/sentry'
import { z } from 'zod'
import { llmLanguageInstruction } from '@/lib/i18n/locale'

const stackChatSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  stackContext: z.object({
    stack_name: z.string().min(1).max(200),
    objective: z.string().min(1).max(1000),
    total_cost: z.number().min(0),
    agents: z.array(z.object({
      name: z.string().min(1),
      role: z.string().min(1),
    })).min(1).max(20),
  }),
  locale: z.enum(['en', 'fr']).optional(),
})

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  setSentryUser(user.id)

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const validation = stackChatSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: validation.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { message, stackContext, locale: bodyLocale } = validation.data
  const locale = bodyLocale === 'fr' ? 'fr' : 'en'
  const langRule = llmLanguageInstruction(locale)

  const prompt = `
<role>
You are a StackAI expert — an AI consultant who knows the recommended stack below and answers the user's questions.
Keep answers short, precise, and actionable. No fluff.
${langRule}
</role>

<stack_context>
Stack: ${stackContext.stack_name}
Agents: ${stackContext.agents.map((a) => `${a.name} (${a.role})`).join(', ')}
Objective: ${stackContext.objective}
Cost: ${stackContext.total_cost}€/month
</stack_context>

<user_question>
${message}
</user_question>

Reply in 2-4 sentences max. Be direct, concrete, and actionable.
`

  try {
    const response = await callLLM(prompt, 512)
    return NextResponse.json({ response })
  } catch (err) {
    captureError(err, { endpoint: '/api/stack-chat', action: 'llm_chat' })
    return NextResponse.json({ error: 'LLM error — please retry in a moment.' }, { status: 500 })
  }
}
