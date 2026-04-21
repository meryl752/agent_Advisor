/**
 * lib/db/agents.ts
 *
 * ⚠️  DEPRECATED — do not use this file.
 *
 * All agent queries now go through lib/supabase/queries.ts which connects
 * directly to the real Supabase database.
 *
 * Functions available in lib/supabase/queries.ts:
 *   - getAllAgents()
 *   - getAgentsByCategories(categories)
 *   - getTopAgents(limit)
 *   - searchAgents(query)
 *   - getVectorMatchedAgents(embedding, budget, category)
 */

export {}
