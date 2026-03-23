// ─── Agent Entity ─────────────────────────────────────────────────────────────
// TODO: Replace mock data with Supabase queries when DB layer is added

export interface Agent {
  id: string
  name: string
  category: AgentCategory
  description: string
  pricing_model: 'free' | 'freemium' | 'paid' | 'usage'
  price_from: number
  score: number
  roi_score: number
  use_cases: string[]
  compatible_with: string[]
  last_updated: string
  url: string
}

export type AgentCategory =
  | 'copywriting'
  | 'image'
  | 'automation'
  | 'analytics'
  | 'customer_service'
  | 'seo'
  | 'prospecting'
  | 'coding'
  | 'research'
  | 'video'

export interface StackRecommendation {
  agents: RecommendedAgent[]
  total_cost: number
  roi_estimate: number
  justification: string
  use_case: string
}

export interface RecommendedAgent extends Agent {
  rank: number
  reason: string
  role_in_stack: string
}

export interface PricingTier {
  name: string
  price: number
  description: string
  features: string[]
  featured?: boolean
  cta: string
}

export interface AlertItem {
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  time: string
}

export interface StackItem {
  name: string
  score: number
}

export interface DashboardMetric {
  label: string
  value: string
  sub: string
  variant?: 'green' | 'orange' | 'default'
}
