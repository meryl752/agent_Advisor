/**
 * Use Groq LLM to find URLs for agents that are missing them.
 * Processes in batches of 10 to respect rate limits.
 *
 * Usage:
 *   node scripts/db-enrich-urls-llm.mjs          # dry-run
 *   node scripts/db-enrich-urls-llm.mjs --apply  # commit updates
 *   node scripts/db-enrich-urls-llm.mjs --apply --limit=50  # process only 50 agents
 */

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, GROQ_API_KEY } = process.env
if (!url || !key) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}
if (!GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const groq = new Groq({ apiKey: GROQ_API_KEY })
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

// Parse --limit flag
const limitArg = process.argv.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 200

function extractDomain(urlStr) {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

async function findUrlsForBatch(agents) {
  const agentList = agents.map((a, i) =>
    `${i + 1}. "${a.name}" (category: ${a.category})`
  ).join('\n')

  const prompt = `For each AI tool listed below, provide its official website URL. 
Return ONLY a JSON array with objects containing "name" and "url" fields.
If you don't know the URL for a tool, set url to null.
Do not include any markdown or explanation.

Tools:
${agentList}

JSON array:`

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.1,
    })

    const text = res.choices[0]?.message?.content?.trim() || ''
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error(`ERROR: LLM call failed: ${err.message}`)
    return []
  }
}

async function main() {
  console.log(`🔗 Running LLM URL enrichment in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode (limit: ${LIMIT})...\n`)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, category, url')
    .or('url.is.null,url.eq.')
    .limit(LIMIT)

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  console.log(`Found ${agents.length} agents without URLs\n`)

  let urlsAdded = 0
  let notFound = 0
  let hasErrors = false

  const BATCH_SIZE = 10
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(agents.length / BATCH_SIZE)}...`)

    const results = await findUrlsForBatch(batch)

    for (const result of results) {
      if (!result.url) {
        notFound++
        continue
      }

      const agent = batch.find(a => a.name.toLowerCase() === result.name.toLowerCase())
      if (!agent) continue

      // Validate URL format
      const domain = extractDomain(result.url)
      if (!domain) {
        console.warn(`  ⚠️  Invalid URL for "${result.name}": ${result.url}`)
        notFound++
        continue
      }

      console.log(`${PREFIX} UPDATE name="${agent.name}" url="${result.url}" domain="${domain}"`)

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('agents')
          .update({ url: result.url, website_domain: domain })
          .eq('id', agent.id)

        if (error) {
          console.error(`  ERROR: Failed to update "${agent.name}": ${error.message}`)
          hasErrors = true
        } else {
          urlsAdded++
        }
      } else {
        urlsAdded++
      }
    }

    // Rate limit protection — wait between batches
    if (i + BATCH_SIZE < agents.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`\nLLM URL enrichment complete: ${urlsAdded} URLs ${DRY_RUN ? 'would be added' : 'added'}, ${notFound} not found`)
  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
