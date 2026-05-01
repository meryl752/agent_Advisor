import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Lazy initialization - create client only when needed
let geminiInstance: GenerativeModel | null = null

export function getGeminiClient(): GenerativeModel | null {
  if (!process.env.GEMINI_API_KEY) {
    return null
  }
  if (!geminiInstance) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Gemini 2.5 Flash-Lite — 250k TPM, 1000 RPD, excellent instruction following
    geminiInstance = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
  }
  return geminiInstance
}