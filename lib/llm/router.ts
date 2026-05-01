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
  
  // Toujours utiliser Llama (GROQ_MODEL) en premier
  // Qwen (GROQ_MODEL_FALLBACK) uniquement en retry sur petits prompts
  const promptTokensEstimate = Math.ceil(prompt.length / 4)
  const totalTokensEstimate = promptTokensEstimate + maxTokens
  const isLargePrompt = totalTokensEstimate > 4000

  // Gros prompt → toujours Llama (Qwen ne peut pas gérer >6000 tokens)
  // Petit prompt → Llama en premier, Qwen en fallback
  const model = isLargePrompt ? GROQ_MODEL : (retryCount === 0 ? GROQ_MODEL : GROQ_MODEL_FALLBACK)
  console.log(`[LLM] Calling Groq ${model} with ${maxTokens} max tokens... (retry: ${retryCount}${isLargePrompt ? ', large prompt→Llama' : ''})`)
  
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
    // Strip thinking tags — handles both closed (<think>...</think>) and unclosed (<think>...)
    const cleaned = text
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/<think>[\s\S]*/g, '')
      .trim()
    console.log(`[LLM] Groq ${model} success - ${cleaned.length} chars`)
    return cleaned
  } catch (err: any) {
    // 413 — prompt trop grand pour ce modèle → switcher immédiatement à Llama
    if ((err.status === 413 || err.message?.includes('Request too large')) && retryCount === 0 && model === GROQ_MODEL) {
      console.warn(`[LLM] Prompt too large for ${model} (413), switching to Llama...`)
      return callGroq(prompt, maxTokens, 1)
    }

    // Rate limit - retry after delay
    if (err.message?.includes('rate_limit_exceeded') && retryCount < 2) {
      const waitTime = 5000
      console.warn(`[LLM] Groq rate limit, retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return callGroq(prompt, maxTokens, retryCount + 1)
    }
    
    // Autre erreur Qwen → fallback Llama
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
 * Principal : Groq (Llama 4 Scout pour gros prompts, Llama 3.3 70B pour petits)
 * Fallback : Gemini Flash-Lite (250k TPM, excellent instruction following)
 */
export async function callLLM(prompt: string, maxTokens = 1024): Promise<string> {
  const groqClient = getGroqClient()
  const geminiClient = getGeminiClient()

  console.log(`[LLM] callLLM invoked - maxTokens: ${maxTokens}, groq: ${!!groqClient}, gemini: ${!!geminiClient}`)

  if (!groqClient && !geminiClient) {
    throw new Error('No LLM configured — check GROQ_API_KEY or GEMINI_API_KEY')
  }

  if (maxTokens <= 1200) {
    console.log('[LLM] Fast mode — Groq')
  } else {
    console.log('[LLM] Slow mode — Groq (fallback Gemini si rate limit)')
  }

  // Essayer Groq en premier
  if (groqClient) {
    try {
      return await callGroq(prompt, maxTokens)
    } catch (err: any) {
      // Si Groq rate-limite, essayer Gemini
      if (err.message?.includes('rate_limit') || err.status === 429) {
        console.warn('[LLM] Groq rate limited, falling back to Gemini Flash-Lite...')
        if (geminiClient) {
          return await callGeminiFlash(prompt, maxTokens)
        }
      }
      throw err
    }
  }

  // Si Groq indisponible, utiliser Gemini directement
  if (geminiClient) {
    return await callGeminiFlash(prompt, maxTokens)
  }

  throw new Error('No LLM available')
}
