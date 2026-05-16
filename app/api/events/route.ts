import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getInternalUserIdForRoute } from '@/lib/supabase/queries'
import { trackProductEvent } from '@/lib/telemetry/trackProductEvent'
import { PRODUCT_EVENTS } from '@/lib/telemetry/events'

const allowedEvents = new Set<string>(Object.values(PRODUCT_EVENTS))

const bodySchema = z.object({
  event_name: z.string().min(1).max(80),
  session_id: z.string().uuid().optional(),
  stack_id: z.string().uuid().optional(),
  properties: z.record(z.unknown()).optional().default({}),
})

/** POST /api/events — client-side product telemetry (auth required). */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const validation = bodySchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { event_name, session_id, stack_id, properties } = validation.data
  if (!allowedEvents.has(event_name)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  const internalId = await getInternalUserIdForRoute(userId)

  await trackProductEvent({
    event_name: event_name as (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS],
    user_id: internalId,
    session_id: session_id ?? null,
    stack_id: stack_id ?? null,
    properties,
    source: 'web',
  })

  return NextResponse.json({ ok: true })
}
