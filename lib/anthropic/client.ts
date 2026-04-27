import Anthropic from '@anthropic-ai/sdk'

let instance: Anthropic | null = null

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!instance) {
    instance = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return instance
}

// Claude Haiku 3.5 — rapide, économique, suffisant pour le ranking/composition
// ~$0.80/M tokens input, ~$4/M tokens output → ~$0.008 par requête
// Passer à claude-3-5-sonnet-20241022 si la qualité de raisonnement est insuffisante
export const CLAUDE_MODEL = 'claude-haiku-3-5-20241022'
