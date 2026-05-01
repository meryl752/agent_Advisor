/**
 * Detect and remove duplicate agent rows (same name, case-insensitive).
 * Retains the most complete record per group.
 *
 * Usage:
 *   node scripts/db-deduplicate.mjs          # dry-run (no writes)
 *   node scripts/db-deduplicate.mjs --apply  # commit deletions
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Compute a completeness score for an agent row.
 * Higher = more complete.
 */
export function completenessScore(agent) {
  return (
    (agent.url ? 3 : 0) +
    (agent.description?.length ?? 0) / 100 +
    (agent.score ?? 0) / 100
  )
}

/**
 * Group agents by lowercased name and return only groups with size > 1.
 * @param {Array} agents
 * @returns {Array<Array>} array of duplicate groups
 */
export function detectDuplicates(agents) {
  const groups = new Map()
  for (const agent of agents) {
    const key = agent.name.toLowerCase()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(agent)
  }
  return [...groups.values()].filter(g => g.length > 1)
}

/**
 * Select the keeper from a duplicate group.
 * Highest completeness score wins; tie-break by earliest created_at.
 * @param {Array} group
 * @returns the agent to keep
 */
export function selectKeeper(group) {
  return group.reduce((best, current) => {
    const bestScore = completenessScore(best)
    const currentScore = completenessScore(current)
    if (currentScore > bestScore) return current
    if (currentScore === bestScore) {
      // Earlier created_at wins
      return new Date(current.created_at) < new Date(best.created_at) ? current : best
    }
    return best
  })
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔍 Running deduplication in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, url, description, score, created_at')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  const duplicateGroups = detectDuplicates(agents)

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicates found.')
    console.log('\nDeduplication complete: 0 duplicates found, 0 rows deleted')
    process.exit(0)
  }

  let totalDeleted = 0
  let hasErrors = false

  for (const group of duplicateGroups) {
    const keeper = selectKeeper(group)
    const losers = group.filter(a => a.id !== keeper.id)

    for (const loser of losers) {
      console.log(
        `${PREFIX} DELETE id=${loser.id} name="${loser.name}" reason="duplicate of id=${keeper.id} (higher completeness)"`
      )

      if (!DRY_RUN) {
        const { error } = await supabase.from('agents').delete().eq('id', loser.id)
        if (error) {
          console.error(`ERROR: Failed to delete "${loser.name}" (${loser.id}): ${error.message}`)
          hasErrors = true
        } else {
          totalDeleted++
        }
      } else {
        totalDeleted++
      }
    }
  }

  const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0)
  console.log(
    `\nDeduplication complete: ${totalDuplicates} duplicates found, ${totalDeleted} rows ${DRY_RUN ? 'would be deleted' : 'deleted'}`
  )

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
