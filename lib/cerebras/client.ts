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

// Qwen 3 235B (MoE — 22B active params) — meilleur raisonnement structuré
// Excellent pour les prompts complexes (enrichissement narratif, analyse)
// ⚠️ Preview — déprécié le 27 mai 2026, basculer sur GPT-OSS 120B après
export const CEREBRAS_MODEL = 'qwen-3-235b-a22b-instruct-2507'

// GPT-OSS 120B — production stable, fallback fiable
export const CEREBRAS_MODEL_FALLBACK = 'gpt-oss-120b'
