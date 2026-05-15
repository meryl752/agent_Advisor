// ─── Supabase Database Types ──────────────────────────────────────────────────
// Généré manuellement — remplacer par `supabase gen types typescript` plus tard

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          pricing_model: 'free' | 'freemium' | 'paid' | 'usage'
          price_from: number
          score: number
          roi_score: number
          use_cases: string[]
          compatible_with: string[]
          url: string
          last_updated: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['agents']['Insert']>
      }
      stacks: {
        Row: {
          id: string
          user_id: string
          name: string
          objective: string
          agent_ids: string[]
          total_cost: number
          roi_estimate: number
          score: number
          created_at: string
          updated_at: string
          digest_enabled: boolean
          digest_enabled_at: string | null
        }
        Insert: Omit<
          Database['public']['Tables']['stacks']['Row'],
          'id' | 'created_at' | 'updated_at' | 'digest_enabled' | 'digest_enabled_at'
        > & {
          digest_enabled?: boolean
          digest_enabled_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['stacks']['Insert']>
      }
      waitlist: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: { email: string }
        Update: never
      }
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          plan: 'free' | 'pro' | 'agency'
          stacks_count: number
          created_at: string
          role: string | null
          sector: string | null
          team_size: string | null
          budget: string | null
          main_goal: string | null
          referral_source: string | null
          onboarding_completed: boolean
          onboarding_step: number | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'stacks_count'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      stack_update_events: {
        Row: {
          id: string
          stack_id: string
          type: string
          title: string
          body: string
          meta: Json
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stack_update_events']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stack_update_events']['Insert']>
      }
    }
  }
}

// Helpers
export type Agent = Database['public']['Tables']['agents']['Row']
export type Stack = Database['public']['Tables']['stacks']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type StackUpdateEvent = Database['public']['Tables']['stack_update_events']['Row']
