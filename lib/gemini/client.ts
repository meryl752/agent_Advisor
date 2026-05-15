import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

// Gemini 2.5 Flash-Lite — 250k TPM, 1000 RPD, excellent instruction following
export const GEMINI_MODEL = 'gemini-2.5-flash-lite-preview-06-17'

// Gemma 4 27B — best open-source for conversation, human-like tone, great in French
export const GEMMA_MODEL = 'gemma-4-27b-it'

export function getGeminiModel(modelName: string = GEMINI_MODEL): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  
  const genAI = new GoogleGenerativeAI(apiKey)
  return genAI.getGenerativeModel({ model: modelName })
}

export function getGeminiClient(): GenerativeModel | null {
  return getGeminiModel(GEMINI_MODEL)
}