// Types partagés entre tous les agents

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
    website_domain?: string
    setup_difficulty?: string
    time_to_value?: string
    relevance_score: number
    relevance_reason: string
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
    action: string        // short imperative — "Créer un compte Make"
    details: string       // full explanation with context
    tip?: string          // optional pro tip or warning
    source_url?: string   // link to official doc found by Tavily
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
    implementation_steps?: ImplementationStep[]  // populated by guideBuilder after stack is built
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