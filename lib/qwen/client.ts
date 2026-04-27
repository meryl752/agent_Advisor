import OpenAI from 'openai'

// Qwen 2.5 72B via OpenRouter (gratuit)
// Excellent pour le raisonnement structuré et le JSON

let qwenInstance: OpenAI | null = null

export function getQwenClient(): OpenAI | null {
  if (!process.env.OPENROUTER_API_KEY) {
    return null
  }
  if (!qwenInstance) {
    qwenInstance = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })
  }
  return qwenInstance
}

export const QWEN_MODEL = 'qwen/qwen-2.5-72b-instruct'
