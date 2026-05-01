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

// Llama 4 Scout 17B — 30 000 TPM sur le plan gratuit (vs 12 000 pour Llama 3.3 70B)
// Meilleur pour les gros prompts comme le buildStack
export const GROQ_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
// Llama 3.3 70B — fallback, excellent pour les petits prompts
export const GROQ_MODEL_FALLBACK = 'llama-3.3-70b-versatile'