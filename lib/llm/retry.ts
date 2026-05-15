import { llmWarn } from './debug'

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

/** Erreurs réseau / surcharge / quota typiques des providers LLM (OpenAI-compatible + Gemini). */
export function isTransientProviderError(err: unknown): boolean {
  const msg = errorMessage(err)
  if (/429|503|502|408|500|rate.?limit|overloaded|timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch failed|network|socket|temporarily|try again/i.test(msg)) {
    return true
  }
  const any = err as { status?: number; code?: number; cause?: { code?: string } }
  const status = any?.status ?? any?.code
  if (status === 429 || status === 503 || status === 502 || status === 408) return true
  if (any?.cause?.code === 'ECONNRESET' || any?.cause?.code === 'ETIMEDOUT') return true
  return false
}

/**
 * Délai avant retry : respecte "try again in Xms" (Groq) et backoff exponentiel + jitter.
 */
export function computeProviderBackoffMs(err: unknown, attemptIndex: number): number {
  const msg = errorMessage(err)
  const msMatch = msg.match(/try again in (\d+)\s*ms/i)
  if (msMatch) {
    const n = parseInt(msMatch[1], 10)
    if (!Number.isNaN(n) && n >= 0) return Math.min(20_000, Math.max(80, n + 80))
  }
  const secMatch = msg.match(/try again in (\d+(?:\.\d+)?)\s*s(?:ec)?/i)
  if (secMatch) {
    const s = parseFloat(secMatch[1])
    if (!Number.isNaN(s) && s >= 0) return Math.min(20_000, Math.max(200, Math.round(s * 1000) + 100))
  }
  const base = 350 * 2 ** attemptIndex
  const jitter = Math.floor(Math.random() * 200)
  return Math.min(14_000, base + jitter)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withProviderRetries<T>(
  label: string,
  fn: () => Promise<T>,
  options?: { maxAttempts?: number }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const last = attempt === maxAttempts - 1
      if (last || !isTransientProviderError(err)) throw err
      const delay = computeProviderBackoffMs(err, attempt)
      llmWarn(`${label}: échec transitoire (${errorMessage(err).slice(0, 120)}), nouvel essai dans ${delay}ms (${attempt + 1}/${maxAttempts})`)
      await sleep(delay)
    }
  }
  throw lastErr
}
