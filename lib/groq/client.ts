import Groq from 'groq-sdk'

// Lazy initialization - create client only when needed
let groqInstance: Groq | null = null

export function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null
  }
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqInstance
}

// Qwen 3 32B — priorité « familles chinoises » (Alibaba) : JSON / instructions ; Groq l’héberge
export const GROQ_MODEL = 'qwen/qwen3-32b'

// Llama 3.3 70B — secours stable si quotas / timeouts Qwen (TPM Groq, etc.)
export const GROQ_MODEL_FALLBACK = 'llama-3.3-70b-versatile'