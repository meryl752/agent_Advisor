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

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_MODEL_FAST = 'llama-3.1-8b-instant' // fast fallback