/**
 * Generate embeddings for agents missing them
 * Uses Jina AI v3 (1024 dimensions) — same as the app
 * Run: node generate_embeddings.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ojrarkplhybsgohjgeip.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qcmFya3BsaHlic2dvaGpnZWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MDU1OCwiZXhwIjoyMDg5ODM2NTU4fQ.Lg0-DeKmDcHHXuWRCp_F1TYCwEIuZzujl8NqEuvC9Bs'
const JINA_KEY     = 'jina_85c16bc30cd9491cbfcabc3d9655582fs0Vy00HC-LgITVA_zQWaQQH8IJyG'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Build a rich text for embedding — combines all semantic fields
function buildEmbeddingText(agent) {
  const parts = [
    agent.name,
    agent.category,
    agent.description || '',
    ...(agent.use_cases || []),
    ...(agent.best_for || []),
    ...(agent.integrations || []),
  ].filter(Boolean)
  return parts.join('. ').slice(0, 2000) // Jina has token limits
}

async function generateEmbedding(text) {
  const res = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JINA_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: text,
      encoding_type: 'float',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Jina error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding
}

async function main() {
  console.log('🚀 Generating embeddings for agents without them...\n')

  // Fetch all agents without embeddings
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, category, description, use_cases, best_for, integrations')
    .is('embedding', null)
    .order('id')

  if (error) { console.error('Failed to fetch agents:', error.message); process.exit(1) }
  console.log(`📊 Agents without embeddings: ${agents.length}\n`)

  let success = 0, failed = 0
  const BATCH = 1 // One at a time to respect 100 req/min rate limit

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]
    try {
      const text = buildEmbeddingText(agent)
      const embedding = await generateEmbedding(text)

      const { error: updateErr } = await supabase
        .from('agents')
        .update({ embedding })
        .eq('id', agent.id)

      if (updateErr) throw new Error(updateErr.message)
      success++
    } catch (err) {
      if (err.message.includes('429') || err.message.includes('RATE')) {
        // Back off 60s on rate limit
        console.warn(`\n  ⏳ Rate limit hit, waiting 60s...`)
        await sleep(60000)
        i-- // retry same agent
        continue
      }
      console.error(`\n  ❌ "${agent.name}": ${err.message}`)
      failed++
    }

    const pct = Math.round(((i + 1) / agents.length) * 100)
    process.stdout.write(`\r  Progress: ${i + 1}/${agents.length} (${pct}%) — ✅ ${success} | ❌ ${failed}`)

    // 700ms between requests = ~85 req/min (under 100 limit)
    await sleep(700)
  }

  console.log(`\n\n🎉 Done!`)
  console.log(`   ✅ Success: ${success}`)
  console.log(`   ❌ Failed:  ${failed}`)

  // Final check
  const { count: withEmb } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null)
  const { count: total } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
  console.log(`\n📊 Final: ${withEmb}/${total} agents have embeddings`)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
