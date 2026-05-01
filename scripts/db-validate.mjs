/**
 * Query the agents table and produce a structured quality validation report.
 * Writes JSON to scripts/agents-db-validation-report.json and prints a summary.
 *
 * Usage:
 *   node scripts/db-validate.mjs
 *
 * Note: This script is read-only — no --apply flag needed.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

// ---------------------------------------------------------------------------
// French detection (same as db-translate-to-english.mjs)
// ---------------------------------------------------------------------------

const FRENCH_INDICATORS = [
  /\b(avec|pour|les|des|une|est|dans|sur|par|qui|que|pas|plus|très|aussi|mais|donc|car|ou|et|du|au|aux|ce|se|sa|son|ses|leur|leurs|nous|vous|ils|elles|je|tu|il|elle|on|mon|ton|ma|ta|mes|tes|nos|vos|un|la|le|en|de|à|y|ne|ni)\b/i,
  /[àâäéèêëîïôùûüçœæ]/,
]

function isFrench(text) {
  if (!text || typeof text !== 'string') return false
  return FRENCH_INDICATORS.some(re => re.test(text))
}

// ---------------------------------------------------------------------------
// Pure metric functions (exported for testing)
// ---------------------------------------------------------------------------

export function countMissingUrl(agents) {
  return agents.filter(a => !a.url || a.url === '').length
}

export function countMissingDescription(agents) {
  return agents.filter(a => !a.description || a.description === '').length
}

export function countMissingUseCases(agents) {
  return agents.filter(a => !a.use_cases || a.use_cases.length === 0).length
}

export function countDuplicates(agents) {
  const nameCounts = new Map()
  for (const agent of agents) {
    const key = agent.name.toLowerCase()
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1)
  }
  // Count total extra rows (total - unique groups with duplicates)
  let duplicateCount = 0
  for (const count of nameCounts.values()) {
    if (count > 1) duplicateCount += count - 1
  }
  return duplicateCount
}

export function getDuplicateGroups(agents) {
  const nameCounts = new Map()
  for (const agent of agents) {
    const key = agent.name.toLowerCase()
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1)
  }
  const groups = []
  for (const [name, count] of nameCounts.entries()) {
    if (count > 1) groups.push({ name, count })
  }
  return groups.sort((a, b) => b.count - a.count)
}

export function countFrenchText(agents) {
  return agents.filter(agent => {
    return (
      isFrench(agent.description) ||
      (Array.isArray(agent.use_cases) && agent.use_cases.some(v => isFrench(v))) ||
      (Array.isArray(agent.best_for) && agent.best_for.some(v => isFrench(v))) ||
      (Array.isArray(agent.not_for) && agent.not_for.some(v => isFrench(v)))
    )
  }).length
}

export function buildCategoryDistribution(agents) {
  const dist = {}
  for (const agent of agents) {
    const cat = agent.category || 'unknown'
    dist[cat] = (dist[cat] || 0) + 1
  }
  return dist
}

export function buildValidationReport(agents) {
  return {
    generated_at: new Date().toISOString(),
    total_agents: agents.length,
    missing_url: countMissingUrl(agents),
    missing_description: countMissingDescription(agents),
    missing_use_cases: countMissingUseCases(agents),
    duplicate_names: countDuplicates(agents),
    french_text_remaining: countFrenchText(agents),
    category_distribution: buildCategoryDistribution(agents),
    agents_missing_url: agents
      .filter(a => !a.url || a.url === '')
      .map(a => a.name)
      .sort(),
    duplicate_groups: getDuplicateGroups(agents),
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('📊 Running validation report...\n')

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, category, url, description, use_cases, best_for, not_for')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  const report = buildValidationReport(agents)

  // Write JSON report
  const reportPath = join(__dirname, 'agents-db-validation-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`✅ JSON report written to: ${reportPath}\n`)

  // Print human-readable summary
  console.log('=== VALIDATION REPORT SUMMARY ===')
  console.log(`Generated at:          ${report.generated_at}`)
  console.log(`Total agents:          ${report.total_agents}`)
  console.log(`Missing URL:           ${report.missing_url} (${pct(report.missing_url, report.total_agents)}%)`)
  console.log(`Missing description:   ${report.missing_description} (${pct(report.missing_description, report.total_agents)}%)`)
  console.log(`Missing use_cases:     ${report.missing_use_cases} (${pct(report.missing_use_cases, report.total_agents)}%)`)
  console.log(`Duplicate names:       ${report.duplicate_names} extra rows`)
  console.log(`French text remaining: ${report.french_text_remaining} agents`)

  console.log('\n=== CATEGORY DISTRIBUTION ===')
  const sortedCategories = Object.entries(report.category_distribution)
    .sort((a, b) => b[1] - a[1])
  for (const [cat, count] of sortedCategories) {
    console.log(`  ${cat.padEnd(20)} ${count}`)
  }

  if (report.duplicate_groups.length > 0) {
    console.log('\n=== DUPLICATE GROUPS ===')
    for (const group of report.duplicate_groups) {
      console.log(`  "${group.name}" — ${group.count} rows`)
    }
  }

  if (report.agents_missing_url.length > 0) {
    const preview = report.agents_missing_url.slice(0, 10)
    console.log(`\n=== AGENTS MISSING URL (first 10 of ${report.agents_missing_url.length}) ===`)
    for (const name of preview) {
      console.log(`  - ${name}`)
    }
    if (report.agents_missing_url.length > 10) {
      console.log(`  ... and ${report.agents_missing_url.length - 10} more (see JSON report)`)
    }
  }

  process.exit(0)
}

function pct(count, total) {
  if (total === 0) return '0'
  return ((count / total) * 100).toFixed(1)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
