/**
 * Logs LLM verbeux : actifs en dev, désactivés en prod sauf DEBUG_LLM=1.
 * DEBUG_LLM=0 force le silence même en dev.
 */
function debugLlmEnabled(): boolean {
  if (process.env.DEBUG_LLM === '0') return false
  if (process.env.DEBUG_LLM === '1') return true
  return process.env.NODE_ENV !== 'production'
}

export function llmLog(...args: unknown[]): void {
  if (debugLlmEnabled()) console.log('[LLM]', ...args)
}

export function llmWarn(...args: unknown[]): void {
  if (debugLlmEnabled()) console.warn('[LLM]', ...args)
}
