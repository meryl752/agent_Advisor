import { getGroqClient, GROQ_MODEL, GROQ_MODEL_FAST } from '@/lib/groq/client'
import { getGeminiClient } from '@/lib/gemini/client'

const CALL_TIMEOUT_MS = 28000 // 28s — Gemini can be slow on long prompts

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
    ),
  ])
}

async function callGroq(prompt: string, maxTokens: number, fast = false, retryCount = 0): Promise<string> {
  const client = getGroqClient()
  if (!client) {
    console.error('[LLM] Groq client is null - GROQ_API_KEY not found')
    throw new Error('Groq not configured')
  }
  const model = fast ? GROQ_MODEL_FAST : GROQ_MODEL
  console.log(`[LLM] Calling Groq ${model} with ${maxTokens} max tokens... (retry: ${retryCount})`)
  
  try {
    const res = await withTimeout(
      client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      CALL_TIMEOUT_MS,
      `Groq ${model}`
    )
    const text = res.choices[0]?.message?.content?.trim()
    if (!text) throw new Error('Groq empty response')
    console.log(`[LLM] Groq ${model} success - ${text.length} chars`)
    return text
  } catch (err: any) {
    // Rate limit - retry after delay
    if (err.message?.includes('rate_limit_exceeded') && retryCount < 2) {
      const waitTime = 3000 // 3 seconds
      console.warn(`[LLM] Rate limit hit, retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return callGroq(prompt, maxTokens, fast, retryCount + 1)
    }
    console.error(`[LLM] Groq ${model} failed:`, err.message)
    throw err
  }
}

async function callGemini(prompt: string): Promise<string> {
  const client = getGeminiClient()
  if (!client) throw new Error('Gemini not configured')
  try {
    const res = await withTimeout(
      client.generateContent(prompt),
      CALL_TIMEOUT_MS,
      'Gemini'
    )
    const text = res.response.text().trim()
    if (!text) throw new Error('Gemini empty response')
    return text
  } catch (err: any) {
    // Si quota dépassé, ne pas bloquer - laisser Groq prendre le relais
    if (err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[LLM] Gemini quota exceeded, falling back to Groq')
      throw new Error('Gemini quota exceeded')
    }
    throw err
  }
}

/**
 * Race Groq (fast 8b) vs Gemini in parallel — first to respond wins.
 * For large outputs (>1500 tokens), use 70b directly — 8b can't handle it.
 * Falls back to Groq 70b if both fast options fail.
 */
export async function callLLM(prompt: string, maxTokens = 1024): Promise<string> {
  const groqClient = getGroqClient()
  const geminiClient = getGeminiClient()

  console.log(`[LLM] callLLM invoked - maxTokens: ${maxTokens}, groq: ${!!groqClient}, gemini: ${!!geminiClient}`)

  if (!groqClient && !geminiClient) {
    console.error('[LLM] No LLM configured - check GROQ_API_KEY and GEMINI_API_KEY')
    throw new Error('No LLM configured')
  }

  // For large outputs, skip 8b — it truncates and produces invalid JSON
  const useFast = maxTokens <= 1200

  const attempts: Promise<string>[] = []
  if (groqClient) {
    console.log(`[LLM] Adding Groq to attempts (fast: ${useFast})`)
    attempts.push(callGroq(prompt, maxTokens, useFast))
  }
  if (geminiClient) {
    console.log('[LLM] Adding Gemini to attempts')
    attempts.push(callGemini(prompt))
  }

  try {
    const result = await Promise.any(attempts)
    console.log('[LLM] Promise.any succeeded')
    return result
  } catch (err: any) {
    console.error('[LLM] Promise.any failed:', err.message)
    // If we used fast and it failed, retry with 70b
    if (useFast && groqClient) {
      console.warn('[LLM] Fast models failed, trying Groq 70b...')
      return callGroq(prompt, maxTokens, false)
    }
    console.error('[LLM] All LLM calls failed - no fallback available')
    throw new Error('All LLM calls failed')
  }
}
