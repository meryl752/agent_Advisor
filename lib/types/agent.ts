// lib/types/agent.ts
// TODO: These types will be used when Supabase integration is added

export type AgentCategory =
  | 'copywriting'
  | 'image'
  | 'automation'
  | 'analytics'
  | 'customer_service'
  | 'seo'
  | 'code'
  | 'research'
  | 'video'
  | 'audio'

export type PricingModel = 'free' | 'freemium' | 'paid' | 'usage_based' | 'enterprise'

export interface Agent {
  id: string
  name: string
  category: AgentCategory
  description: string
  pricing_model: PricingModel
  price_per_month: number | null       // null = usage-based
  score: number                         // 0-100 relevance score
  roi_score: number                     // 0-100 ROI potential
  compatible_with: string[]             // IDs of compatible agents
  use_cases: string[]                   // e.g. ['ecommerce', 'content', 'automation']
  website_url: string
  logo_url?: string
  last_updated: string                  // ISO date string
  features: string[]
}

export interface StackRecommendation {
  objective: string
  agents: Agent[]
  estimated_monthly_cost: number
  estimated_roi_percent: number
  workflow_description: string
  justification: string
}

// Future Supabase query shape
// TODO: Replace with actual Supabase client calls in lib/db/agents.ts
export interface AgentQuery {
  category?: AgentCategory
  use_case?: string
  max_price?: number
  min_score?: number
  limit?: number
}
