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

// Nouvelle structure avec domaines et sous-tâches atomiques
export interface AtomicSubtask {
  id: string                    // ex: "d1_t1"
  action: string                // description précise de la sous-tâche atomique
  required_category: string     // catégorie d'outil requise
  depends_on: string[]          // IDs des sous-tâches dépendantes
  can_be_automated: boolean     // si automatisable ou action humaine requise
}

export interface FunctionalDomain {
  name: string                  // nom du domaine fonctionnel
  priority: number              // ordre de priorité
  subtasks: AtomicSubtask[]     // sous-tâches atomiques du domaine
}

export interface AnalyzedQuery {
  original: string              // reformulation claire de l'objectif
  domains: FunctionalDomain[]   // domaines fonctionnels avec sous-tâches
  implicit_constraints: string[] // contraintes implicites détectées
  sector_context: string        // spécificités sectorielles
  budget_max: number            // budget maximum en euros
  
  // Champs dérivés pour compatibilité avec le reste du système
  subtasks: string[]            // liste plate des actions (généré depuis domains)
  required_categories: string[] // liste unique des catégories (généré depuis domains)
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
  not_for?: string[]         // cas d'usage à éviter (colonne DB)
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
