/**
 * Cache Tavily results in Supabase.
 * Key: hash of (tool_name + task_description)
 * TTL: 30 days — docs don't change that fast
 */

import { supabaseService } from '@/lib/supabase/server'

const TTL_DAYS = 30

function cacheKey(toolName: string, task: string): string {
  // Simple deterministic key — lowercase, normalized
  return `${toolName.toLowerCase().replace(/\s+/g, '-')}::${task.toLowerCase().replace(/\s+/g, '-').slice(0, 80)}`
}

export async function getCachedGuide(toolName: string, task: string): Promise<string | null> {
  try {
    const key = cacheKey(toolName, task)
    const { data } = await (supabaseService as any)
      .from('guide_cache')
      .select('content, created_at')
      .eq('cache_key', key)
      .single()

    if (!data) return null

    // Check TTL
    const age = Date.now() - new Date(data.created_at).getTime()
    if (age > TTL_DAYS * 24 * 60 * 60 * 1000) return null

    return data.content as string
  } catch {
    return null
  }
}

export async function setCachedGuide(toolName: string, task: string, content: string): Promise<void> {
  try {
    const key = cacheKey(toolName, task)
    await (supabaseService as any)
      .from('guide_cache')
      .upsert({ cache_key: key, content, created_at: new Date().toISOString() }, { onConflict: 'cache_key' })
  } catch (err) {
    console.warn('[GuideCache] Failed to cache:', err)
  }
}
