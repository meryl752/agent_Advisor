import type { FinalStack } from '@/lib/agents/types'

export type Phase = 'chat' | 'reasoning' | 'results' | 'error'

export interface Message {
  role: 'user' | 'ai' | 'reasoning'
  text?: string
}

export interface ApiError {
  type: 'rate-limit' | 'server'
  message: string
  plan?: string
  resetAt?: string
}

export interface ConversationItem {
  session_id: string
  title: string
  stack_generated: boolean
  updated_at: string
}

export const REASONING_STEPS = [
  'Analyse de ton objectif...',
  'Scan de 200+ agents IA...',
  'Optimisation du budget...',
  'Assemblage du stack final...',
  'Recherche de documentation...',
  "Génération des guides d'implémentation...",
]

export const SUGGESTIONS = [
  { label: 'Automatiser mon service client Shopify', prompt: "J'aimerais automatiser le service client au niveau de ma plateforme Shopify" },
  { label: 'Augmenter ma prospection B2B', prompt: "J'aimerais augmenter la rapidité à laquelle j'atteins mes clients dans mon business B2B" },
  { label: 'Créer du contenu Instagram en masse', prompt: "Je veux créer du contenu Instagram de qualité en grande quantité avec l'IA" },
  { label: "Automatiser ma gestion d'inventaire", prompt: "Mettre en place un système intelligent pour automatiser ma gestion d'inventaire" },
  { label: 'Analyser mes données clients', prompt: "J'aimerais analyser mes données clients pour prédire les futures tendantes" },
  { label: 'Optimiser mes processus de vente', prompt: "Je souhaite optimiser mes processus de vente avec l'IA pour gagner du temps" },
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
    sector: sector ?? (isDetailed ? 'général' : null),
    budget: budget ?? (isDetailed ? 'medium' : null),
    tech,
    isDetailed,
  }
}
