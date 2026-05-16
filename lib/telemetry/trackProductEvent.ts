import { supabaseService } from '@/lib/supabase/server'
import type { ProductEventName, ProductEventSource } from './events'

export type TrackProductEventInput = {
  event_name: ProductEventName
  user_id?: string | null
  session_id?: string | null
  stack_id?: string | null
  properties?: Record<string, unknown>
  source?: ProductEventSource
}

/**
 * Fire-and-forget product telemetry. Never throws to callers.
 * Requires migration 20260518_product_events.sql on Supabase.
 */
export async function trackProductEvent(input: TrackProductEventInput): Promise<void> {
  try {
    const row = {
      user_id: input.user_id ?? null,
      session_id: input.session_id ?? null,
      stack_id: input.stack_id ?? null,
      event_name: input.event_name,
      properties: input.properties ?? {},
      source: input.source ?? 'api',
    }

    const { error } = await (supabaseService as any).from('product_events').insert(row)
    if (error) {
      console.warn('[trackProductEvent]', input.event_name, error.message)
    }
  } catch (err) {
    console.warn(
      '[trackProductEvent]',
      input.event_name,
      err instanceof Error ? err.message : err
    )
  }
}
