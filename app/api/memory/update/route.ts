import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { saveConversation, compressAndUpdateMemory } from '@/lib/supabase/memory'

const schema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000),
  })).max(50),
  stackGenerated: z.boolean().optional().default(false),
  stackId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })

  const validation = schema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const { sessionId, messages, stackGenerated, stackId } = validation.data

  // Only save if there are actual user messages
  const hasUserMessages = messages.some(m => m.role === 'user')
  if (!hasUserMessages) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    // 1. Save the raw conversation
    await saveConversation(user.id, sessionId, messages, { stackGenerated, stackId })

    // 2. Compress unsummarized conversations into user_memory
    // Run async — don't block the response
    compressAndUpdateMemory(user.id).catch(err =>
      console.warn('[memory/update] Compression error:', err)
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[memory/update] Error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
