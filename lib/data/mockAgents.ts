// ─── Mock Agent Data ──────────────────────────────────────────────────────────
// TODO: Replace with Supabase query: supabase.from('agents').select('*')

import type { Agent } from '@/types'

export const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Claude Sonnet',
    category: 'copywriting',
    description: "Meilleur modèle LLM pour la rédaction, l'analyse et le code.",
    pricing_model: 'usage',
    price_from: 0,
    score: 92,
    roi_score: 95,
    use_cases: ['copywriting', 'coding', 'analysis', 'customer_service'],
    compatible_with: ['make.com', 'zapier', 'n8n'],
    last_updated: '2025-01-01',
    url: 'https://claude.ai',
  },
  {
    id: '2',
    name: 'Make.com',
    category: 'automation',
    description: "Plateforme d'automatisation no-code la plus puissante du marché.",
    pricing_model: 'freemium',
    price_from: 9,
    score: 85,
    roi_score: 90,
    use_cases: ['automation', 'integration', 'workflow'],
    compatible_with: ['claude', 'google-calendar', 'telegram', 'shopify'],
    last_updated: '2025-01-01',
    url: 'https://make.com',
  },
  {
    id: '3',
    name: 'Perplexity Pro',
    category: 'research',
    description: 'Moteur de recherche IA pour la veille et la recherche en temps réel.',
    pricing_model: 'paid',
    price_from: 20,
    score: 78,
    roi_score: 80,
    use_cases: ['research', 'seo', 'content'],
    compatible_with: ['claude', 'notion'],
    last_updated: '2025-01-01',
    url: 'https://perplexity.ai',
  },
  {
    id: '4',
    name: 'Midjourney',
    category: 'image',
    description: "Génération d'images IA de qualité professionnelle.",
    pricing_model: 'paid',
    price_from: 10,
    score: 88,
    roi_score: 75,
    use_cases: ['image', 'branding', 'marketing'],
    compatible_with: ['canva', 'figma'],
    last_updated: '2025-01-01',
    url: 'https://midjourney.com',
  },
  {
    id: '5',
    name: 'Polar Analytics',
    category: 'analytics',
    description: "Analytics e-commerce unifié pour Shopify et WooCommerce.",
    pricing_model: 'paid',
    price_from: 300,
    score: 80,
    roi_score: 88,
    use_cases: ['analytics', 'ecommerce', 'reporting'],
    compatible_with: ['shopify', 'woocommerce', 'google-ads'],
    last_updated: '2025-01-01',
    url: 'https://polaranalytics.com',
  },
]

// ─── Use Case Stacks ──────────────────────────────────────────────────────────
// Pre-defined stacks for common use cases (used by rule-based layer)

export const USE_CASE_STACKS: Record<string, string[]> = {
  ecommerce: ['claude-sonnet', 'midjourney', 'tidio-ai', 'make.com', 'polar-analytics'],
  content: ['perplexity', 'claude-sonnet', 'canva-ai', 'buffer-ai'],
  booking: ['make.com', 'telegram-bot', 'google-calendar', 'claude-api'],
  prospecting: ['apollo.io', 'clay', 'claude', 'instantly-ai'],
}
