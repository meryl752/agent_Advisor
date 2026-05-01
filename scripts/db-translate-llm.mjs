/**
 * Use Groq LLM to translate remaining French text in agent fields to English.
 * Handles cases not covered by the static translation map.
 *
 * Usage:
 *   node scripts/db-translate-llm.mjs          # dry-run
 *   node scripts/db-translate-llm.mjs --apply  # commit updates
 *   node scripts/db-translate-llm.mjs --apply --limit=100
 */

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, GROQ_API_KEY } = process.env
if (!url || !key || !GROQ_API_KEY) {
  console.error('ERROR: Required env vars missing in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const groq = new Groq({ apiKey: GROQ_API_KEY })
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

const limitArg = process.argv.find(a => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : 100

const FRENCH_INDICATORS = [
  /\b(avec|pour|les|des|une|est|dans|sur|par|qui|que|pas|plus|très|aussi|mais|donc|car|ou|et|du|au|aux|ce|se|sa|son|ses|leur|leurs|nous|vous|ils|elles|je|tu|il|elle|on|mon|ton|ma|ta|mes|tes|nos|vos|un|la|le|en|de|à|y|ne|ni)\b/i,
  /[àâäéèêëîïôùûüçœæ]/,
]

function isFrench(text) {
  if (!text || typeof text !== 'string') return false
  return FRENCH_INDICATORS.some(re => re.test(text))
}

async function translateWithLLM(agent) {
  const fieldsToTranslate = {}

  if (isFrench(agent.description)) fieldsToTranslate.description = agent.description
  if (Array.isArray(agent.use_cases) && agent.use_cases.some(isFrench)) fieldsToTranslate.use_cases = agent.use_cases
  if (Array.isArray(agent.best_for) && agent.best_for.some(isFrench)) fieldsToTranslate.best_for = agent.best_for
  if (Array.isArray(agent.not_for) && agent.not_for.some(isFrench)) fieldsToTranslate.not_for = agent.not_for

  if (Object.keys(fieldsToTranslate).length === 0) return null

  const prompt = `Translate the following JSON fields from French to English for the AI tool "${agent.name}".
Keep the same JSON structure. For arrays, keep the same number of elements.
Return ONLY valid JSON, no markdown, no explanation.

${JSON.stringify(fieldsToTranslate, null, 2)}`

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.1,
    })

    const text = res.choices[0]?.message?.content?.trim() || ''
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (err) {
    console.error(`  ERROR: LLM translation failed for "${agent.name}": ${err.message}`)
    return null
  }
}

async function main() {
  console.log(`🌐 Running LLM translation in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode (limit: ${LIMIT})...\n`)

  // Fetch all agents and filter for French text in memory
  const { data: allAgents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, description, use_cases, best_for, not_for')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  const frenchAgents = allAgents.filter(a =>
    isFrench(a.description) ||
    (Array.isArray(a.use_cases) && a.use_cases.some(isFrench)) ||
    (Array.isArray(a.best_for) && a.best_for.some(isFrench)) ||
    (Array.isArray(a.not_for) && a.not_for.some(isFrench))
  ).slice(0, LIMIT)

  console.log(`Found ${frenchAgents.length} agents with French text (processing up to ${LIMIT})\n`)

  let translated = 0
  let failed = 0
  let hasErrors = false

  for (let i = 0; i < frenchAgents.length; i++) {
    const agent = frenchAgents[i]

    if (i % 10 === 0 && i > 0) {
      console.log(`  Progress: ${i}/${frenchAgents.length}...`)
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const updates = await translateWithLLM(agent)

    if (!updates) {
      failed++
      continue
    }

    const updatedFields = Object.keys(updates)
    console.log(`${PREFIX} UPDATE name="${agent.name}" fields=[${updatedFields.join(', ')}]`)

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agent.id)

      if (error) {
        console.error(`  ERROR: Failed to update "${agent.name}": ${error.message}`)
        hasErrors = true
      } else {
        translated++
      }
    } else {
      translated++
    }

    // Small delay between individual calls
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\nLLM translation complete: ${translated} agents ${DRY_RUN ? 'would be translated' : 'translated'}, ${failed} failed`)
  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
