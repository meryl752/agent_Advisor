/**
 * Remove agents that are too niche to be useful in recommendations.
 *
 * Removal criteria:
 *   - url IS NULL or empty (no known URL)
 *   - score < 60 OR score IS NULL
 *   - name matches generic/placeholder patterns (e.g. "AI Meal Planner")
 *
 * Usage:
 *   node scripts/db-remove-niche-tools.mjs          # dry-run (no deletes)
 *   node scripts/db-remove-niche-tools.mjs --apply  # commit deletes
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
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[DELETED]'

// ---------------------------------------------------------------------------
// Generic / niche name patterns
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate a generic or placeholder tool name.
 * These are matched case-insensitively against the agent name.
 */
const GENERIC_NAME_PATTERNS = [
  // "AI <Generic Task>" pattern
  /^AI\s+(Meal\s+Planner|Trip\s+Planner|Travel\s+Planner|Credit\s+Repair|Resume\s+Builder|Cover\s+Letter|Job\s+Search|Dating\s+Coach|Fitness\s+Coach|Diet\s+Coach|Life\s+Coach|Relationship\s+Coach|Homework\s+Helper|Essay\s+Writer|Story\s+Generator|Poem\s+Generator|Joke\s+Generator|Name\s+Generator|Slogan\s+Generator|Logo\s+Maker|Flyer\s+Maker|Poster\s+Maker|Meme\s+Generator|Caption\s+Generator|Hashtag\s+Generator|Bio\s+Generator|Pitch\s+Generator|Proposal\s+Generator|Contract\s+Generator|Invoice\s+Generator|Receipt\s+Generator|Budget\s+Planner|Finance\s+Tracker|Expense\s+Tracker|Tax\s+Helper|Legal\s+Helper|Medical\s+Helper|Health\s+Coach|Mental\s+Health|Therapy\s+Bot|Meditation\s+Guide|Workout\s+Planner|Recipe\s+Generator|Grocery\s+List|Shopping\s+List|Gift\s+Finder|Event\s+Planner|Wedding\s+Planner|Party\s+Planner|Baby\s+Name|Pet\s+Name|Business\s+Name|Domain\s+Name|Password\s+Generator|QR\s+Code|Barcode\s+Generator|Translator|Summarizer|Paraphraser|Grammar\s+Checker|Spell\s+Checker|Plagiarism\s+Checker|Detector|Classifier|Extractor|Scraper|Crawler|Parser|Converter|Compressor|Optimizer|Analyzer|Checker|Validator|Tester|Monitor|Tracker|Logger|Reporter|Scheduler|Reminder|Notifier|Alerter|Sender|Receiver|Processor|Handler|Manager|Controller|Coordinator|Orchestrator|Dispatcher|Router|Balancer|Proxy|Gateway|Bridge|Connector|Adapter|Wrapper|Helper|Utility|Tool|Bot|Agent|Assistant|Chatbot|Widget|Plugin|Extension|Add-on|Module|Component|Service|API|SDK|Library|Framework|Engine|Platform|System|App|Application)\b/i,

  // Clearly placeholder / test entries
  /^(test|demo|sample|example|placeholder|dummy|fake|mock|temp|temporary|draft|wip|todo|fixme|xxx|yyy|zzz)\b/i,

  // Generic "AI for X" with very generic X
  /^AI\s+for\s+(everything|anything|all|general|generic|misc|miscellaneous|various|other|others)\b/i,

  // Single-word generic names that are clearly not real products
  /^(untitled|unnamed|unknown|n\/a|none|null|undefined|empty|blank|new\s+agent|new\s+tool)\b/i,
]

/**
 * Returns true if the agent name matches a generic/niche pattern.
 */
function isGenericName(name) {
  if (!name || typeof name !== 'string') return false
  return GENERIC_NAME_PATTERNS.some(re => re.test(name.trim()))
}

/**
 * Returns true if the agent should be removed based on all criteria:
 *   1. No URL (null or empty)
 *   2. Low or null score (< 60)
 *   3. Generic/placeholder name
 */
function shouldRemove(agent) {
  const hasNoUrl = !agent.url || agent.url.trim() === ''
  const hasLowScore = agent.score === null || agent.score === undefined || agent.score < 60
  const hasGenericName = isGenericName(agent.name)
  return hasNoUrl && hasLowScore && hasGenericName
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🗑️  Running niche-tool removal in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  // Fetch all agents with no URL and low/null score
  const { data: candidates, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, url, score, category, description')
    .or('url.is.null,url.eq.')
    .or('score.is.null,score.lt.60')
    .order('score', { ascending: true, nullsFirst: true })

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  console.log(`Found ${candidates.length} candidates (no URL + score < 60).\n`)

  const toRemove = candidates.filter(shouldRemove)
  const toKeep = candidates.filter(a => !shouldRemove(a))

  console.log(`Agents to REMOVE (${toRemove.length}):`)
  console.log('─'.repeat(80))
  for (const agent of toRemove) {
    const score = agent.score !== null && agent.score !== undefined ? agent.score : 'NULL'
    console.log(`${PREFIX} id=${agent.id} name="${agent.name}" score=${score} url="${agent.url ?? 'NULL'}"`)
    if (agent.description) {
      console.log(`         description: "${agent.description.slice(0, 80)}${agent.description.length > 80 ? '...' : ''}"`)
    }
  }

  if (toKeep.length > 0) {
    console.log(`\nAgents with no URL + low score but KEPT (name doesn't match generic patterns) (${toKeep.length}):`)
    console.log('─'.repeat(80))
    for (const agent of toKeep) {
      const score = agent.score !== null && agent.score !== undefined ? agent.score : 'NULL'
      console.log(`  KEPT  id=${agent.id} name="${agent.name}" score=${score}`)
    }
  }

  if (toRemove.length === 0) {
    console.log('\n✅ No niche tools to remove.')
    process.exit(0)
  }

  if (DRY_RUN) {
    console.log(`\n⚠️  DRY RUN: ${toRemove.length} agents would be deleted. Run with --apply to commit.`)
    process.exit(0)
  }

  // Apply deletions in batches
  let deleted = 0
  let hasErrors = false
  const BATCH_SIZE = 20

  for (let i = 0; i < toRemove.length; i += BATCH_SIZE) {
    const batch = toRemove.slice(i, i + BATCH_SIZE)
    const ids = batch.map(a => a.id)

    const { error } = await supabase
      .from('agents')
      .delete()
      .in('id', ids)

    if (error) {
      console.error(`ERROR: Failed to delete batch: ${error.message}`)
      hasErrors = true
    } else {
      deleted += batch.length
      for (const agent of batch) {
        console.log(`[DELETED] id=${agent.id} name="${agent.name}"`)
      }
    }

    // Rate limit protection
    if (i + BATCH_SIZE < toRemove.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`\n✅ Removal complete: ${deleted} agents deleted.`)
  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
