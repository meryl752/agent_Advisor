import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Client côté serveur — utilise la même anon key pour l'instant
// TODO: Utiliser service_role key pour les opérations admin
export const supabaseServer = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
