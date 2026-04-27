import { getGroqClient, GROQ_MODEL, GROQ_MODEL_FALLBACK } from '@/lib/groq/client'
import { getAnthropicClient, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { getGeminiClient } from '@/lib/gemini/client'

const CALL_TIMEOUT_MS = 10000 // 10s — timeout raisonnable pour une bonne UX web

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
    ),
  ])
}

async function callGroq(prompt: string, maxTokens: number, retryCount = 0): Promise<string> {
  const client = getGroqClient()
  if (!client) {
    throw new Error('Groq not configured')
  }
  
  // Utiliser Llama 3.3 70B directement (fonctionne bien)
  const model = retryCount === 0 ? GROQ_MODEL : GROQ_MODEL_FALLBACK
  console.log(`[LLM] Calling Groq ${model} with ${maxTokens} max tokens... (retry: ${retryCount})`)
  
  try {
    const res = await withTimeout(
      client.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      CALL_TIMEOUT_MS,
      `Groq ${model}`
    )
    const text = res.choices[0]?.message?.content?.trim()
    if (!text) throw new Error('Groq empty response')
    // Strip Qwen3 thinking tags if present (<think>...</think>)
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    console.log(`[LLM] Groq ${model} success - ${cleaned.length} chars`)
    return cleaned
  } catch (err: any) {
    // Rate limit - retry after delay
    if (err.message?.includes('rate_limit_exceeded') && retryCount < 2) {
      const waitTime = 3000
      console.warn(`[LLM] Groq rate limit, retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return callGroq(prompt, maxTokens, retryCount + 1)
    }
    
    // Si Qwen échoue, essayer Llama en fallback
    if (retryCount === 0 && model === GROQ_MODEL) {
      console.warn(`[LLM] Groq ${model} failed, trying fallback model...`)
      return callGroq(prompt, maxTokens, 1)
    }
    
    console.error(`[LLM] Groq ${model} failed:`, err.message)
    throw err
  }
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const client = getAnthropicClient()
  if (!client) throw new Error('Anthropic not configured')

  console.log(`[LLM] Calling Claude ${CLAUDE_MODEL} with ${maxTokens} max tokens...`)

  try {
    const res = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
      CALL_TIMEOUT_MS,
      `Claude ${CLAUDE_MODEL}`
    )
    const text = res.content[0].type === 'text' ? res.content[0].text.trim() : ''
    if (!text) throw new Error('Claude empty response')
    console.log(`[LLM] Claude success - ${text.length} chars`)
    return text
  } catch (err: any) {
    console.error('[LLM] Claude failed:', err.message)
    throw err
  }
}


async function callGeminiFlash(prompt: string, maxTokens: number): Promise<string> {
  const client = getGeminiClient()
  if (!client) throw new Error('Gemini not configured')

  console.log(`[LLM] Calling Gemini Flash with ${maxTokens} max tokens...`)
  
  try {
    const res = await withTimeout(
      client.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
      CALL_TIMEOUT_MS,
      'Gemini Flash'
    )
    const text = res.response.text().trim()
    if (!text) throw new Error('Gemini empty response')
    console.log(`[LLM] Gemini Flash success - ${text.length} chars`)
    return text
  } catch (err: any) {
    if (err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[LLM] Gemini quota exceeded')
      throw new Error('Gemini quota exceeded')
    }
    console.error('[LLM] Gemini Flash failed:', err.message)
    throw err
  }
}

/**
 * Stratégie de routing LLM
 *
 * Fast mode (≤1200 tokens) — QueryAnalyzer :
 *   Groq Llama 70B direct (gratuit, rapide, fiable)
 *
 * Slow mode (>1200 tokens) — StackBuilder :
 *   Claude 3.5 Sonnet (raisonnement multi-critères, fiable à 99%)
 *   Fallback Groq Llama 70B si Claude indisponible
 */
export async function callLLM(prompt: string, maxTokens = 1024): Promise<string> {
  const groqClient   = getGroqClient()
  const claudeClient = getAnthropicClient()

  console.log(`[LLM] callLLM invoked - maxTokens: ${maxTokens}, claude: ${!!claudeClient}, groq: ${!!groqClient}`)

  if (!groqClient && !claudeClient) {
    throw new Error('No LLM configured — check ANTHROPIC_API_KEY, GROQ_API_KEY')
  }

  // Fast mode — Groq Llama 70B direct (QueryAnalyzer)
  if (maxTokens <= 1200) {
    console.log('[LLM] Fast mode — Groq Llama 70B')
    if (groqClient) return callGroq(prompt, maxTokens)
    // Fallback Claude si Groq indisponible
    if (claudeClient) return callClaude(prompt, maxTokens)
    throw new Error('No LLM available for fast mode')
  }

  // Slow mode — Claude en priorité (StackBuilder)
  console.log('[LLM] Slow mode — Claude 3.5 Sonnet')
  if (claudeClient) {
    try {
      return await callClaude(prompt, maxTokens)
    } catch (err: any) {
      console.warn('[LLM] Claude failed, falling back to Groq Llama 70B:', err.message)
    }
  }

  if (groqClient) {
    console.log('[LLM] Slow mode fallback — Groq Llama 70B')
    return callGroq(prompt, maxTokens)
  }

  throw new Error('No LLM available for slow mode')
}
