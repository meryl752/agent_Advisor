import type { FinalStack } from '@/lib/agents/types'

export type Phase = 'chat' | 'reasoning' | 'results' | 'error'

export interface Message {
  role: 'user' | 'ai' | 'reasoning'
  text?: string
  stackId?: string  // present on "Stack prêt" messages
}

export interface ApiError {
  type: 'server'
  message: string
}

export interface ConversationItem {
  session_id: string
  title: string
  stack_generated: boolean
  stack_id?: string
  updated_at: string
}

export const REASONING_STEPS = [
  'Analyzing your goal...',
  'Scanning 200+ AI agents...',
  'Optimizing for your budget...',
  'Assembling the final stack...',
  'Searching for documentation...',
  'Generating implementation guides...',
]

export const SUGGESTIONS = [
  { label: 'Automate my Shopify customer service', prompt: "I want to automate customer service on my Shopify store" },
  { label: 'Scale my B2B prospecting', prompt: "I want to increase the speed at which I reach clients in my B2B business" },
  { label: 'Create Instagram content at scale', prompt: "I want to create high-quality Instagram content in large volumes with AI" },
  { label: 'Automate my inventory management', prompt: "Set up an intelligent system to automate my inventory management" },
  { label: 'Analyze my customer data', prompt: "I want to analyze my customer data to predict future trends" },
  { label: 'Optimize my sales process', prompt: "I want to optimize my sales process with AI to save time" },
]

export function extractContext(text: string) {
  const lower = text.toLowerCase()
  const sector =
    lower.includes('ecommerce') || lower.includes('shopify') || lower.includes('boutique') || lower.includes('vente en ligne') ? 'e-commerce'
    : lower.includes('saas') || lower.includes('logiciel') || lower.includes('application') ? 'saas'
    : lower.includes('agence') ? 'agence'
    : lower.includes('consultant') || lower.includes('freelance') || lower.includes('indépendant') ? 'consultant'
    : lower.includes('créateur') || lower.includes('youtube') || lower.includes('instagram') || lower.includes('contenu') || lower.includes('réseaux') ? 'createur'
    : lower.includes('b2b') || lower.includes('entreprise') || lower.includes('prospection') || lower.includes('client') ? 'b2b'
    : lower.includes('restaurant') || lower.includes('commerce') || lower.includes('magasin') ? 'commerce'
    : null

  const budget =
    lower.includes('gratuit') || lower.includes('0€') || lower.includes('sans budget') ? 'zero'
    : lower.includes('50') || lower.includes('petit budget') || lower.includes('peu') ? 'low'
    : lower.includes('200') || lower.includes('moyen') ? 'medium'
    : lower.includes('500') || lower.includes('1000') || lower.includes('grand budget') || lower.includes('illimité') ? 'high'
    : null

  const tech =
    lower.includes('débutant') || lower.includes('novice') || lower.includes('pas technique') || lower.includes('non technique') ? 'beginner'
    : lower.includes('avancé') || lower.includes('développeur') || lower.includes('dev ') || lower.includes('code') ? 'advanced'
    : lower.includes('intermédiaire') || lower.includes('no-code') || lower.includes('nocode') ? 'intermediate'
    : null

  const isDetailed = text.trim().length > 60

  return {
    sector: sector ?? (isDetailed ? 'general' : null),
    budget: budget ?? (isDetailed ? 'medium' : null),
    tech,
    isDetailed,
  }
}
