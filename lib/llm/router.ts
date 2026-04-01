import { getGroqClient, GROQ_MODEL, GROQ_MODEL_FAST } from '@/lib/groq/client'
import { getGeminiClient } from '@/lib/gemini/client'

const CALL_TIMEOUT_MS = 22000 // 22s hard limit per individual call

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms)
    ),
  ])
}

async function callGroq(prompt: string, maxTokens: number, fast = false): Promise<string> {
  const client = getGroqClient()
  if (!client) throw new Error('Groq not configured')
  const model = fast ? GROQ_MODEL_FAST : GROQ_MODEL
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
  return text
}

async function callGemini(prompt: string): Promise<string> {
  const client = getGeminiClient()
  if (!client) throw new Error('Gemini not configured')
  const res = await withTimeout(
    client.generateContent(prompt),
    CALL_TIMEOUT_MS,
    'Gemini'
  )
  const text = res.response.text().trim()
  if (!text) throw new Error('Gemini empty response')
  return text
}

/**
 * Race Groq (fast 8b) vs Gemini in parallel — first to respond wins.
 * Falls back to Groq 70b if both fast options fail.
 */
export async function callLLM(prompt: string, maxTokens = 1024): Promise<string> {
  const attempts: Promise<string>[] = []

  const groqClient = getGroqClient()
  const geminiClient = getGeminiClient()

  if (groqClient) attempts.push(callGroq(prompt, maxTokens, true))  // fast 8b
  if (geminiClient) attempts.push(callGemini(prompt))

  if (attempts.length === 0) throw new Error('No LLM configured')

  try {
    // Race: first successful response wins
    return await Promise.any(attempts)
  } catch {
    // All fast attempts failed — try Groq 70b as last resort
    if (groqClient) {
      console.warn('[LLM] Fast models failed, trying Groq 70b...')
      return callGroq(prompt, maxTokens, false)
    }
    throw new Error('All LLM calls failed')
  }
}
