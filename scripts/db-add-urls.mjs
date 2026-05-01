/**
 * Populate url and website_domain for agents that have a null or empty url.
 *
 * Usage:
 *   node scripts/db-add-urls.mjs          # dry-run (no writes)
 *   node scripts/db-add-urls.mjs --apply  # commit updates
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
 * Extract the domain from a URL, stripping www. prefix.
 * @param {string} urlStr
 * @returns {string}
 */
export function extractDomain(urlStr) {
  return new URL(urlStr).hostname.replace(/^www\./, '')
}

// ---------------------------------------------------------------------------
// URL map (exported for testing)
// Keyed by lowercased agent name → canonical HTTPS URL
// ---------------------------------------------------------------------------

export const URL_MAP = new Map([
  // AI Writing & Copywriting
  ['chatgpt', 'https://chat.openai.com'],
  ['claude', 'https://claude.ai'],
  ['claude sonnet', 'https://claude.ai'],
  ['claude opus', 'https://claude.ai'],
  ['claude haiku', 'https://claude.ai'],
  ['gemini', 'https://gemini.google.com'],
  ['jasper ai', 'https://jasper.ai'],
  ['jasper', 'https://jasper.ai'],
  ['copy.ai', 'https://copy.ai'],
  ['writesonic', 'https://writesonic.com'],
  ['rytr', 'https://rytr.me'],
  ['anyword', 'https://anyword.com'],

  // LinkedIn & Social Media
  ['taplio', 'https://taplio.com'],
  ['buffer', 'https://buffer.com'],
  ['buffer ai', 'https://buffer.com'],
  ['hootsuite', 'https://hootsuite.com'],
  ['publer', 'https://publer.io'],
  ['later', 'https://later.com'],
  ['sprout social', 'https://sproutsocial.com'],
  ['flick ai', 'https://flick.social'],
  ['flick', 'https://flick.social'],

  // Email Marketing
  ['mailchimp', 'https://mailchimp.com'],
  ['klaviyo', 'https://klaviyo.com'],
  ['brevo', 'https://brevo.com'],
  ['activecampaign', 'https://activecampaign.com'],
  ['lemlist', 'https://lemlist.com'],
  ['instantly ai', 'https://instantly.ai'],
  ['instantly', 'https://instantly.ai'],

  // Automation
  ['make.com', 'https://make.com'],
  ['make', 'https://make.com'],
  ['zapier', 'https://zapier.com'],
  ['n8n', 'https://n8n.io'],
  ['lindy', 'https://lindy.ai'],
  ['activepieces', 'https://activepieces.com'],

  // E-commerce
  ['shopify', 'https://shopify.com'],
  ['shopify sidekick', 'https://shopify.com/sidekick'],
  ['tidio ai', 'https://tidio.com'],
  ['tidio', 'https://tidio.com'],
  ['gorgias', 'https://gorgias.com'],
  ['richpanel', 'https://richpanel.com'],

  // Prospecting & Sales
  ['apollo.io', 'https://apollo.io'],
  ['apollo', 'https://apollo.io'],
  ['hunter.io', 'https://hunter.io'],
  ['hunter', 'https://hunter.io'],
  ['linkedin sales navigator', 'https://business.linkedin.com/sales-solutions/sales-navigator'],
  ['amplemarket', 'https://amplemarket.com'],
  ['seamless.ai', 'https://seamless.ai'],
  ['seamless', 'https://seamless.ai'],
  ['clay', 'https://clay.com'],

  // SEO
  ['ahrefs', 'https://ahrefs.com'],
  ['semrush', 'https://semrush.com'],
  ['surfer seo', 'https://surferseo.com'],
  ['surfer', 'https://surferseo.com'],
  ['neuronwriter', 'https://neuronwriter.com'],

  // Video & Image
  ['midjourney', 'https://midjourney.com'],
  ['dall-e', 'https://openai.com/dall-e-3'],
  ['dalle', 'https://openai.com/dall-e-3'],
  ['stable diffusion', 'https://stability.ai'],
  ['canva', 'https://canva.com'],
  ['elevenlabs', 'https://elevenlabs.io'],
  ['synthesia', 'https://synthesia.io'],

  // Analytics
  ['google analytics', 'https://analytics.google.com'],
  ['mixpanel', 'https://mixpanel.com'],
  ['hotjar', 'https://hotjar.com'],

  // Project Management
  ['notion', 'https://notion.so'],
  ['notion ai', 'https://notion.so'],
  ['clickup', 'https://clickup.com'],

  // Customer Support
  ['intercom', 'https://intercom.com'],
  ['zendesk', 'https://zendesk.com'],
  ['freshdesk', 'https://freshdesk.com'],

  // Coding
  ['github copilot', 'https://github.com/features/copilot'],
  ['cursor', 'https://cursor.sh'],
  ['windsurf', 'https://codeium.com/windsurf'],

  // Research
  ['perplexity ai', 'https://perplexity.ai'],
  ['perplexity', 'https://perplexity.ai'],
  ['perplexity pro', 'https://perplexity.ai'],
  ['tavily', 'https://tavily.com'],
])

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔗 Running URL enrichment in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: agents, error: fetchError } = await supabase
    .from('agents')
    .select('id, name, url')
    .or('url.is.null,url.eq.')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  let urlsAdded = 0
  let stillMissing = 0
  let hasErrors = false

  const BATCH_SIZE = 20
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE)

    for (const agent of batch) {
      const mappedUrl = URL_MAP.get(agent.name.toLowerCase())

      if (!mappedUrl) {
        stillMissing++
        continue
      }

      const websiteDomain = extractDomain(mappedUrl)

      console.log(
        `${PREFIX} UPDATE name="${agent.name}" url="${mappedUrl}" website_domain="${websiteDomain}"`
      )

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('agents')
          .update({ url: mappedUrl, website_domain: websiteDomain })
          .eq('id', agent.id)

        if (error) {
          console.error(`ERROR: Failed to update "${agent.name}": ${error.message}`)
          hasErrors = true
        } else {
          urlsAdded++
        }
      } else {
        urlsAdded++
      }
    }

    // Rate limit protection
    if (!DRY_RUN && i + BATCH_SIZE < agents.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(
    `\nURL enrichment complete: ${urlsAdded} URLs ${DRY_RUN ? 'would be added' : 'added'}, ${stillMissing} agents still missing URL`
  )

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
