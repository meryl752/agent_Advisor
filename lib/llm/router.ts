import { groq, GROQ_MODEL } from '@/lib/groq/client'
import { geminiFlash } from '@/lib/gemini/client'

const LLM_TIMEOUT_MS = 30000 // 30 seconds max
const MAX_RETRIES = 2

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout')), timeoutMs)
    ),
  ])
}

export async function callLLM(prompt: string, maxTokens = 1024): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Try Groq first (faster)
      if (process.env.GROQ_API_KEY) {
        const response = await withTimeout(
          groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.7,
          }),
          LLM_TIMEOUT_MS
        )
        
        const text = response.choices[0]?.message?.content?.trim()
        if (text) return text
      }

      // Fallback to Gemini
      if (process.env.GEMINI_API_KEY) {
        const result = await withTimeout(
          geminiFlash.generateContent(prompt),
          LLM_TIMEOUT_MS
        )
        
        const text = result.response.text().trim()
        if (text) return text
      }

      throw new Error('No LLM API keys configured')
    } catch (err) {
      lastError = err as Error
      if (attempt < MAX_RETRIES - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('LLM call failed')
}
