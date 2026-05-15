import { getGroqClient, GROQ_MODEL, GROQ_MODEL_FALLBACK } from '@/lib/groq/client'
import { getGeminiModel, GEMMA_MODEL, GEMINI_MODEL } from '@/lib/gemini/client'
import { getCerebrasClient, CEREBRAS_MODEL, CEREBRAS_MODEL_FALLBACK } from '@/lib/cerebras/client'
import { llmLog, llmWarn } from '@/lib/llm/debug'
import { withProviderRetries } from '@/lib/llm/retry'

const CALL_TIMEOUT_MS = 15000 // prompts courts / chat
const CALL_TIMEOUT_MS_LONG = 45000 // sorties longues (guides, enrichissement)

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
    ),
  ])
}

// ─── Internal Callers ────────────────────────────────────────────────────────

async function callGroqDirect(prompt: string, maxTokens: number, modelId: string): Promise<string> {
  const client = getGroqClient()
  if (!client) throw new Error('Groq not configured')
  const timeoutMs = maxTokens > 1500 ? CALL_TIMEOUT_MS_LONG : CALL_TIMEOUT_MS
  const res = await withProviderRetries(
    `Groq ${modelId}`,
    () =>
      withTimeout(
        client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        timeoutMs,
        `Groq ${modelId}`
      )
  )
  const text = res.choices[0]?.message?.content?.trim() || ''
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '').trim()
}

async function callCerebrasDirect(prompt: string, maxTokens: number, modelId: string): Promise<string> {
  const client = getCerebrasClient()
  if (!client) throw new Error('Cerebras not configured')
  const timeoutMs = maxTokens > 1500 ? CALL_TIMEOUT_MS_LONG : CALL_TIMEOUT_MS
  const res = await withProviderRetries(
    `Cerebras ${modelId}`,
    () =>
      withTimeout(
        client.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
        timeoutMs,
        `Cerebras ${modelId}`
      )
  )
  const text = res.choices[0]?.message?.content?.trim() || ''
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '').trim()
}

async function callGeminiDirect(prompt: string, maxTokens: number, modelId: string): Promise<string> {
  const model = getGeminiModel(modelId)
  if (!model) throw new Error('Gemini not configured')
  const timeoutMs = maxTokens > 1500 ? CALL_TIMEOUT_MS_LONG : CALL_TIMEOUT_MS
  const res = await withProviderRetries(
    `Gemini ${modelId}`,
    () =>
      withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
        }),
        timeoutMs,
        `Gemini ${modelId}`
      )
  )
  return res.response.text().trim()
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main LLM router with optional model preference.
 * If preferredModel fails or is not provided, follows the default high-performance chain.
 */
export async function callLLM(prompt: string, maxTokens = 1024, preferredModel?: string): Promise<string> {
  llmLog(`callLLM - maxTokens: ${maxTokens}, preference: ${preferredModel || 'none'}`)

  // 1. Try preferred model if specified
  if (preferredModel) {
    try {
      if (preferredModel === 'qwen-235b') return await callCerebrasDirect(prompt, maxTokens, CEREBRAS_MODEL)
      if (preferredModel === 'gpt-120b') return await callCerebrasDirect(prompt, maxTokens, CEREBRAS_MODEL_FALLBACK)
      if (preferredModel === 'qwen-32b') return await callGroqDirect(prompt, maxTokens, GROQ_MODEL)
      if (preferredModel === 'llama-70b') return await callGroqDirect(prompt, maxTokens, GROQ_MODEL_FALLBACK)
      if (preferredModel === 'gemini-flash') return await callGeminiDirect(prompt, maxTokens, GEMINI_MODEL)
    } catch (err: any) {
      llmWarn(`Preferred model ${preferredModel} failed: ${err.message}. Falling back to default chain.`)
    }
  }

  const groqClient = getGroqClient()

  // 2. Sorties longues : Groq Qwen puis Llama
  if (maxTokens > 1200 && groqClient) {
    try {
      return await callGroqDirect(prompt, maxTokens, GROQ_MODEL)
    } catch (err: any) {
      llmWarn(`Slow-path Groq primary failed: ${err.message}`)
    }
    try {
      return await callGroqDirect(prompt, maxTokens, GROQ_MODEL_FALLBACK)
    } catch (err: any) {
      llmWarn(`Slow-path Groq fallback failed: ${err.message}`)
    }
  }

  // 3. Default chain: Cerebras → Groq → Gemini
  const cerebras = getCerebrasClient()
  if (cerebras) {
    try {
      return await callCerebrasDirect(prompt, maxTokens, CEREBRAS_MODEL)
    } catch (err: any) {
      llmWarn(`Cerebras primary failed, trying fallback: ${err.message}`)
      try {
        return await callCerebrasDirect(prompt, maxTokens, CEREBRAS_MODEL_FALLBACK)
      } catch { /* next provider */ }
    }
  }

  if (groqClient) {
    try {
      return await callGroqDirect(prompt, maxTokens, GROQ_MODEL)
    } catch (err: any) {
      llmWarn(`Groq primary failed, trying fallback: ${err.message}`)
      try {
        return await callGroqDirect(prompt, maxTokens, GROQ_MODEL_FALLBACK)
      } catch { /* next provider */ }
    }
  }

  return await callGeminiDirect(prompt, maxTokens, GEMINI_MODEL)
}

/**
 * Gemma 4 specific caller for conversational chat.
 */
export async function callGemma(prompt: string, maxTokens: number): Promise<string> {
  llmLog('Calling Gemma 4 for conversation...')
  try {
    return await callGeminiDirect(prompt, maxTokens, GEMMA_MODEL)
  } catch (err: any) {
    console.error(`[LLM] Gemma 4 failed: ${err.message}. Falling back to callLLM.`)
    return await callLLM(prompt, maxTokens)
  }
}

/**
 * Streaming version — kept for future use if needed.
 */
export function streamLLM(prompt: string, maxTokens = 600): ReadableStream<Uint8Array> {
  const groqClient = getGroqClient()
  if (!groqClient) throw new Error('Groq not configured for streaming')
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await groqClient.chat.completions.create({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: true,
        })

        let buffer = ''
        let inThinkTag = false

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? ''
          if (!token) continue
          buffer += token
          if (buffer.includes('<think>')) inThinkTag = true
          if (inThinkTag) {
            if (buffer.includes('</think>')) {
              buffer = buffer.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '')
              inThinkTag = false
            } else continue
          }
          if (buffer) {
            controller.enqueue(encoder.encode(buffer))
            buffer = ''
          }
        }
        if (buffer && !inThinkTag) controller.enqueue(encoder.encode(buffer))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
