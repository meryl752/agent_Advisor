import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export type LLMProvider = 'gemini' | 'groq'

// État du switcher — persiste en mémoire serveur
let currentProvider: LLMProvider = 'gemini'
let geminiFailedAt: number | null = null
const GEMINI_RETRY_AFTER_MS = 60 * 60 * 1000 // 1 heure avant de retenter Gemini

function shouldRetryGemini(): boolean {
    if (!geminiFailedAt) return false
    return Date.now() - geminiFailedAt > GEMINI_RETRY_AFTER_MS
}

export async function callLLM(prompt: string, maxTokens = 2048): Promise<string> {
    // Retenter Gemini si le cooldown est passé
    if (currentProvider === 'groq' && shouldRetryGemini()) {
        console.log('🔄 [LLM Router] Retrying Gemini after cooldown...')
        currentProvider = 'gemini'
        geminiFailedAt = null
    }

    // Tenter avec le provider actuel
    if (currentProvider === 'gemini') {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()
            console.log('✅ [LLM Router] Gemini responded')
            return cleanJSON(text)
        } catch (err: unknown) {
            const error = err as { status?: number; message?: string }
            const isQuotaError = error?.status === 429 || error?.message?.includes('quota')

            if (isQuotaError) {
                console.warn('⚠️ [LLM Router] Gemini quota exceeded — switching to Groq')
                currentProvider = 'groq'
                geminiFailedAt = Date.now()
            } else {
                console.error('❌ [LLM Router] Gemini error:', error?.message)
                // Fallback Groq même pour erreurs non-quota
                currentProvider = 'groq'
                geminiFailedAt = Date.now()
            }
        }
    }

    // Fallback Groq
    try {
        console.log('🟣 [LLM Router] Using Groq (llama-3.3-70b-versatile)')
        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: maxTokens,
        })
        const text = completion.choices[0]?.message?.content?.trim() ?? ''
        console.log('✅ [LLM Router] Groq responded')
        return cleanJSON(text)
    } catch (err) {
        console.error('❌ [LLM Router] Groq error:', err)
        throw new Error('All LLM providers failed')
    }
}

export function getCurrentProvider(): LLMProvider {
    return currentProvider
}

function cleanJSON(text: string): string {
    return text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim()
}