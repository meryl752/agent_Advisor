/**
 * Apply targeted use_cases corrections from a configuration object.
 *
 * Usage:
 *   node scripts/db-fix-use-cases.mjs          # dry-run (no writes)
 *   node scripts/db-fix-use-cases.mjs --apply  # commit updates
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
// Configuration (exported for testing)
// ---------------------------------------------------------------------------

export const USE_CASE_FIXES = [
  {
    name: 'Lindy',
    remove_tags: ['reporting'],
    add_tags: ['email_automation', 'workflow_automation'],
  },
  // Add more fixes here without code changes:
  // { name: 'Publer', remove_tags: ['email'], add_tags: ['social_media_scheduling'] },
  // { name: 'Anyword', remove_tags: ['reporting'], add_tags: ['ad_copy_optimization'] },
]

// ---------------------------------------------------------------------------
// Pure logic (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Apply a single fix to a use_cases array.
 * Removes remove_tags, adds add_tags (deduped), ensures length >= 2.
 * @param {string[]} useCases - current use_cases array
 * @param {{ remove_tags: string[], add_tags: string[] }} fix
 * @returns {string[]} updated use_cases
 */
export function applyFix(useCases, fix) {
  const removeSet = new Set(fix.remove_tags)
  // Remove specified tags
  let result = (useCases || []).filter(tag => !removeSet.has(tag))
  // Add new tags (deduped)
  for (const tag of fix.add_tags) {
    if (!result.includes(tag)) {
      result.push(tag)
    }
  }
  // Ensure at least 2 elements (add_tags should cover this, but guard anyway)
  return result
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔧 Running use-case fixes in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const fixNames = USE_CASE_FIXES.map(f => f.name)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, use_cases')
    .in('name', fixNames)

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  let hasErrors = false
  let totalFixed = 0

  for (const fix of USE_CASE_FIXES) {
    const agent = agents?.find(a => a.name.toLowerCase() === fix.name.toLowerCase())

    if (!agent) {
      console.log(`[SKIP] name="${fix.name}" — not found in database`)
      continue
    }

    const originalUseCases = agent.use_cases || []
    const updatedUseCases = applyFix(originalUseCases, fix)

    // Determine what actually changed
    const removed = fix.remove_tags.filter(t => originalUseCases.includes(t))
    const added = fix.add_tags.filter(t => !originalUseCases.includes(t))

    if (removed.length === 0 && added.length === 0) {
      console.log(`[SKIP] name="${fix.name}" — no changes needed`)
      continue
    }

    console.log(
      `${PREFIX} UPDATE name="${agent.name}" removed=${JSON.stringify(removed)} added=${JSON.stringify(added)} result=${JSON.stringify(updatedUseCases)}`
    )

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('agents')
        .update({ use_cases: updatedUseCases })
        .eq('id', agent.id)

      if (error) {
        console.error(`ERROR: Failed to update "${agent.name}": ${error.message}`)
        hasErrors = true
      } else {
        totalFixed++
      }
    } else {
      totalFixed++
    }
  }

  console.log(
    `\nUse-case fix complete: ${totalFixed} agents ${DRY_RUN ? 'would be updated' : 'updated'}`
  )

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
