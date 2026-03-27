import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Client non-authentifié (lecture publique : agents, waitlist)
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client avec Service Role (à utiliser pour les webhooks et opérations critiques sans JWT user)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseService = (supabaseServiceKey && supabaseUrl !== 'https://placeholder.supabase.co')
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : supabaseServer // Fallback sur anon-key

// Client authentifié avec le JWT Clerk — pour les opérations sur les données user
export function createSupabaseClient(clerkToken: string) {
  if (supabaseUrl === 'https://placeholder.supabase.co') {
    console.error('CRITICAL: Supabase URL is missing in environment variables.')
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  })
}
