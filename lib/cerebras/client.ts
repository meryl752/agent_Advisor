import OpenAI from 'openai'

// Cerebras uses an OpenAI-compatible API
// Lazy initialization - create client only when needed
let cerebrasInstance: OpenAI | null = null

export function getCerebrasClient(): OpenAI | null {
  if (!process.env.CEREBRAS_API_KEY) {
    return null
  }
  if (!cerebrasInstance) {
    cerebrasInstance = new OpenAI({
      apiKey: process.env.CEREBRAS_API_KEY,
      baseURL: 'https://api.cerebras.ai/v1',
    })
  }
  return cerebrasInstance
}

// Llama 3.1 70B — ~2000 tokens/sec, excellent for structured JSON output
export const CEREBRAS_MODEL = 'llama3.1-70b'
// Llama 3.1 8B — faster, for small prompts
export const CEREBRAS_MODEL_FAST = 'llama3.1-8b'
