// ─── Types partagés entre tous les agents ─────────────────────────────────────

export interface UserContext {
  objective: string
  sector: string
  team_size: 'solo' | 'small' | 'medium' | 'large'
  budget: 'zero' | 'low' | 'medium' | 'high'
  tech_level: 'beginner' | 'intermediate' | 'advanced'
  timeline: 'asap' | 'weeks' | 'months'
  current_tools: string[]
}

export interface AnalyzedQuery {
  original: string
  subtasks: string[]
  required_categories: string[]
  implicit_constraints: string[]
  sector_context: string
  success_metrics: string[]
  budget_max: number
}

// Agent enrichi avec le score de similarité vectorielle retourné par Supabase RPC
export interface VectorAgent {
  id: string
  name: string
  category: string
  description: string
  price_from: number
  score: number
  roi_score: number
  use_cases: string[]
  compatible_with: string[]
  best_for?: string[]        // cas d'usage prioritaires (colonne DB)
  integrations?: string[]    // intégrations natives (colonne DB)
  website_domain?: string
  setup_difficulty?: string
  time_to_value?: string
  embedding?: number[]       // vecteur pgvector (optionnel — non sélectionné par défaut)
  similarity: number         // score cosine [0, 1] retourné par smart_search_agents
}

export interface ScoredAgent {
  id: string
  name: string
  category: string
  description: string
  price_from: number
  score: number
  roi_score: number
  use_cases: string[]
  compatible_with: string[]
  best_for?: string[]
  integrations?: string[]
  website_domain?: string
  setup_difficulty?: string
  time_to_value?: string
  similarity: number         // conservé pour traçabilité
  relevance_score: number    // score hybride normalisé [0, 100]
  relevance_reason: string   // explication lisible du score
}

export interface SubTask {
  name: string
  without_ai: string
  with_ai: string
  tool_name: string
}

export interface ImplementationStep {
  step: number
  title: string
  action: string       // impératif court — "Créer un compte Make"
  details: string      // explication complète avec contexte
  tip?: string         // conseil pro ou avertissement
  source_url?: string  // lien vers la doc officielle (Tavily)
}

export interface StackAgent {
  id: string
  name: string
  category: string
  price_from: number
  score: number
  rank: number
  role: string
  reason: string
  concrete_result: string
  prompt_to_use: string
  website_domain?: string
  setup_difficulty?: string
  time_to_value?: string
  implementation_steps?: ImplementationStep[]  // peuplé par guideBuilder après affichage
}

export interface FinalStack {
  stack_name: string
  justification: string
  total_cost: number
  roi_estimate: number
  time_saved_per_week: number
  quick_wins: string[]
  warnings: string[]
  subtasks: SubTask[]
  agents: StackAgent[]
}
