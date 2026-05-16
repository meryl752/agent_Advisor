import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { callGemma } from '@/lib/llm/router'
import { getUserMemory, formatMemoryForPrompt } from '@/lib/supabase/memory'
import { resolveSessionLocale, llmLanguageInstruction, type AppLocale } from '@/lib/i18n/locale'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  sessionId: z.string().uuid().optional(),
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const validation = chatSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { message, history, stackContext, sessionId } = validation.data

  let storedLocale: AppLocale | undefined
  if (sessionId) {
    const { getConversationLocale } = await import('@/lib/supabase/queries')
    storedLocale = await getConversationLocale(sessionId)
  }

  const userTexts = [
    ...history.filter((m) => m.role === 'user').map((m) => m.content),
    message,
  ]
  const locale = resolveSessionLocale(storedLocale, userTexts)

  const memory = await getUserMemory(user.id).catch(() => null)
  const memoryText = memory ? formatMemoryForPrompt(memory) : ''

  const historyText = history.length > 0
    ? `\n<conversation_history>\n${history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n</conversation_history>\n`
    : ''

  const stackText = stackContext
    ? `\n<current_stack>\nStack: ${stackContext.stack_name}\nTools: ${stackContext.agents.map(a => `${a.name} (${a.role})`).join(', ')}\nObjective: ${stackContext.objective}\nCost: ${stackContext.total_cost}€/month\n</current_stack>\n`
    : ''

  const langRule = llmLanguageInstruction(locale)

  const prompt = `You are Raspquery's AI assistant — a platform that recommends personalized AI tool stacks for founders and creators.

YOUR ROLE:
- Chat naturally to understand the user's context and needs
- Answer questions about AI tools, automation, and productivity
- Decide when to generate a stack — like Claude generating an artifact

LANGUAGE:
${langRule}

STACK GENERATION RULES:
Set "generate_stack": true if ANY of these apply:
1. The user explicitly asks to generate (e.g. generate, create, build, go, do it, now — or French: génère, crée, vas-y, allez)
2. The business objective is clear AND you asked at least one clarifying question
3. The user confirms after your clarifying question (yes, ok, sure, oui, d'accord)

ABSOLUTE TRIGGERS — generate IMMEDIATELY if the user says:
- generate, build, create, make it, go, let's go, do it, now
- génère, crée, vas-y, fais-le, allez, maintenant

Set "generate_stack": false ONLY if:
- Initial greeting with no business context
- General question with no business angle
- Completely vague first message

BEHAVIOR:
- If the user says "go" / "génère" / "build it" → generate IMMEDIATELY
- If the need is clear → generate without asking
- If vague → ask ONE clarifying question, then generate on the next reply
- Never ask more than 2 questions before generating
- Use the user profile to personalize

${memoryText}${stackText}${historyText}
User: ${message}

Return this JSON:
{
  "response": "your natural reply to the user",
  "objective": "precise need/objective summary if identified (null otherwise)",
  "generate_stack": true or false,
  "ready_reason": "why you generate now (null if generate_stack is false)"
}`

  try {
    const raw = await callGemma(prompt, 600)
    const jsonMatch = raw.replace(/<think>[\s\S]*?<\/think>/g, '').match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          response: parsed.response ?? raw,
          objective: parsed.objective ?? null,
          generate_stack: parsed.generate_stack === true,
          locale,
        })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ response: raw, objective: null, locale })
  } catch {
    return NextResponse.json({ error: 'LLM error — please retry.' }, { status: 500 })
  }
}
