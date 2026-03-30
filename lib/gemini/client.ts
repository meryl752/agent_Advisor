import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Lazy initialization - create client only when needed
let geminiInstance: GenerativeModel | null = null

export function getGeminiClient(): GenerativeModel | null {
  if (!process.env.GEMINI_API_KEY) {
    return null
  }
  if (!geminiInstance) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    geminiInstance = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }
  return geminiInstance
}