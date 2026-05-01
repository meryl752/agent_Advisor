/**
 * Insert 24 missing high-value tools into the agents table.
 *
 * Usage:
 *   node scripts/db-add-missing-tools.mjs          # dry-run (no writes)
 *   node scripts/db-add-missing-tools.mjs --apply  # commit inserts
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
// Static tool definitions (exported for testing)
// ---------------------------------------------------------------------------

export const TOOLS_TO_ADD = [
  {
    name: 'Gemini',
    category: 'copywriting',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://gemini.google.com',
    website_domain: 'gemini.google.com',
    description: 'Google\'s multimodal AI assistant for writing, analysis, and creative tasks with deep Google Workspace integration.',
    use_cases: ['copywriting', 'content_creation', 'research', 'summarization'],
    best_for: [
      'content creators needing Google ecosystem integration',
      'teams already using Google Workspace',
    ],
    not_for: ['advanced code generation', 'complex data pipelines'],
    score: 82,
    roi_score: 78,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['google_docs', 'gmail', 'google_sheets'],
    integrations: ['google_workspace', 'google_drive'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Taplio',
    category: 'automation',
    pricing_model: 'paid',
    price_from: 49,
    url: 'https://taplio.com',
    website_domain: 'taplio.com',
    description: 'AI-powered LinkedIn content creation and scheduling tool for building personal brand and generating inbound leads.',
    use_cases: ['social_media', 'content_creation', 'scheduling', 'personal_branding'],
    best_for: [
      'consultants and founders building LinkedIn personal brand',
      'B2B salespeople generating inbound leads via LinkedIn content',
    ],
    not_for: ['Instagram or TikTok content', 'email marketing'],
    score: 75,
    roi_score: 72,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['linkedin', 'twitter'],
    integrations: ['linkedin'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Mailchimp',
    category: 'automation',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://mailchimp.com',
    website_domain: 'mailchimp.com',
    description: 'Email marketing platform for creating, sending, and automating email campaigns with audience segmentation and analytics.',
    use_cases: ['email_marketing', 'automation', 'audience_segmentation', 'campaign_analytics'],
    best_for: [
      'small businesses starting with email marketing',
      'e-commerce stores sending promotional emails',
    ],
    not_for: ['complex B2B sales automation', 'large enterprise CRM needs'],
    score: 78,
    roi_score: 75,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['shopify', 'wordpress', 'zapier'],
    integrations: ['shopify', 'woocommerce', 'zapier'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Zapier',
    category: 'automation',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://zapier.com',
    website_domain: 'zapier.com',
    description: 'No-code automation platform that connects 5000+ apps to automate repetitive workflows without writing code.',
    use_cases: ['automation', 'workflow', 'integration', 'data_sync'],
    best_for: [
      'non-technical users automating repetitive tasks',
      'small teams connecting their tool stack without developers',
    ],
    not_for: ['complex data transformations', 'real-time high-volume processing'],
    score: 85,
    roi_score: 82,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['slack', 'gmail', 'salesforce', 'hubspot'],
    integrations: ['slack', 'gmail', 'google_sheets', 'salesforce'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Shopify',
    category: 'website',
    pricing_model: 'paid',
    price_from: 29,
    url: 'https://shopify.com',
    website_domain: 'shopify.com',
    description: 'All-in-one e-commerce platform for building and managing online stores with payment processing and inventory management.',
    use_cases: ['ecommerce', 'store_management', 'payment_processing', 'inventory'],
    best_for: [
      'entrepreneurs launching their first online store',
      'small to medium e-commerce businesses',
    ],
    not_for: ['B2B SaaS products', 'service-based businesses without physical products'],
    score: 88,
    roi_score: 85,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['mailchimp', 'klaviyo', 'gorgias', 'tidio'],
    integrations: ['mailchimp', 'klaviyo', 'stripe', 'paypal'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Tidio AI',
    category: 'customer_service',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://tidio.com',
    website_domain: 'tidio.com',
    description: 'AI-powered live chat and chatbot platform for automating customer support and increasing sales conversions on websites.',
    use_cases: ['customer_service', 'chatbot', 'live_chat', 'lead_generation'],
    best_for: [
      'e-commerce stores reducing support ticket volume',
      'small businesses providing 24/7 customer service',
    ],
    not_for: ['complex enterprise support workflows', 'B2B companies with long sales cycles'],
    score: 74,
    roi_score: 70,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['shopify', 'wordpress', 'woocommerce'],
    integrations: ['shopify', 'wordpress', 'mailchimp'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Semrush',
    category: 'seo',
    pricing_model: 'paid',
    price_from: 119,
    url: 'https://semrush.com',
    website_domain: 'semrush.com',
    description: 'Comprehensive SEO and digital marketing platform for keyword research, competitor analysis, and site auditing.',
    use_cases: ['seo', 'keyword_research', 'competitor_analysis', 'content_marketing'],
    best_for: [
      'SEO professionals managing multiple client websites',
      'marketing teams running competitive analysis',
    ],
    not_for: ['beginners with very limited budgets', 'non-digital businesses'],
    score: 90,
    roi_score: 85,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['google_analytics', 'google_search_console', 'wordpress'],
    integrations: ['google_analytics', 'google_search_console'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Notion',
    category: 'automation',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://notion.so',
    website_domain: 'notion.so',
    description: 'All-in-one workspace for notes, wikis, databases, and project management with AI-powered writing assistance.',
    use_cases: ['knowledge_management', 'project_management', 'documentation', 'collaboration'],
    best_for: [
      'teams centralizing their knowledge and workflows',
      'solopreneurs managing projects and notes in one place',
    ],
    not_for: ['real-time communication', 'complex CRM needs'],
    score: 83,
    roi_score: 80,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['slack', 'zapier', 'github'],
    integrations: ['slack', 'zapier', 'github', 'google_drive'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Zendesk',
    category: 'customer_service',
    pricing_model: 'paid',
    price_from: 55,
    url: 'https://zendesk.com',
    website_domain: 'zendesk.com',
    description: 'Enterprise customer service platform for managing support tickets across email, chat, and social with AI-powered automation.',
    use_cases: ['customer_service', 'ticket_management', 'help_desk', 'automation'],
    best_for: [
      'growing companies needing structured customer support',
      'teams handling high volumes of support requests',
    ],
    not_for: ['very small teams with low support volume', 'businesses needing simple live chat only'],
    score: 85,
    roi_score: 80,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['salesforce', 'slack', 'jira'],
    integrations: ['salesforce', 'slack', 'jira', 'shopify'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Perplexity AI',
    category: 'research',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://perplexity.ai',
    website_domain: 'perplexity.ai',
    description: 'AI-powered search engine that provides cited, real-time answers by searching the web and synthesizing information.',
    use_cases: ['research', 'web_search', 'fact_checking', 'summarization'],
    best_for: [
      'researchers and analysts needing cited information',
      'professionals replacing traditional search with AI answers',
    ],
    not_for: ['content creation at scale', 'code generation'],
    score: 80,
    roi_score: 78,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['notion', 'claude'],
    integrations: [],
    last_updated: '2025-01-01',
  },
  {
    name: 'Writesonic',
    category: 'copywriting',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://writesonic.com',
    website_domain: 'writesonic.com',
    description: 'AI writing platform for generating SEO-optimized blog posts, landing pages, and ad copy at scale.',
    use_cases: ['copywriting', 'seo', 'content_creation', 'ad_copy'],
    best_for: [
      'content marketers producing high-volume SEO content',
      'e-commerce teams writing product descriptions at scale',
    ],
    not_for: ['technical documentation', 'legal or medical writing'],
    score: 72,
    roi_score: 68,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['wordpress', 'shopify', 'semrush'],
    integrations: ['wordpress', 'shopify'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Later',
    category: 'automation',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://later.com',
    website_domain: 'later.com',
    description: 'Visual social media scheduling platform for planning and auto-publishing content on Instagram, TikTok, and Pinterest.',
    use_cases: ['social_media', 'scheduling', 'content_planning', 'instagram'],
    best_for: [
      'Instagram-focused brands and influencers',
      'social media managers handling visual content platforms',
    ],
    not_for: ['LinkedIn content', 'B2B social media strategy'],
    score: 70,
    roi_score: 65,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['canva', 'instagram', 'tiktok'],
    integrations: ['instagram', 'tiktok', 'pinterest'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Sprout Social',
    category: 'automation',
    pricing_model: 'paid',
    price_from: 249,
    url: 'https://sproutsocial.com',
    website_domain: 'sproutsocial.com',
    description: 'Enterprise social media management platform for scheduling, analytics, and team collaboration across all major networks.',
    use_cases: ['social_media', 'scheduling', 'analytics', 'team_collaboration'],
    best_for: [
      'enterprise marketing teams managing multiple brands',
      'agencies handling social media for multiple clients',
    ],
    not_for: ['individual creators on a budget', 'single-platform social media management'],
    score: 82,
    roi_score: 75,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['salesforce', 'hubspot', 'slack'],
    integrations: ['salesforce', 'hubspot', 'google_analytics'],
    last_updated: '2025-01-01',
  },
  {
    name: 'ActiveCampaign',
    category: 'automation',
    pricing_model: 'paid',
    price_from: 29,
    url: 'https://activecampaign.com',
    website_domain: 'activecampaign.com',
    description: 'Marketing automation and CRM platform for building behavioral email sequences and managing sales pipelines.',
    use_cases: ['email_marketing', 'automation', 'crm', 'lead_nurturing'],
    best_for: [
      'B2B companies nurturing leads with behavioral automation',
      'e-commerce stores with complex customer journeys',
    ],
    not_for: ['simple one-off email blasts', 'teams needing a free solution'],
    score: 83,
    roi_score: 80,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['shopify', 'wordpress', 'salesforce'],
    integrations: ['shopify', 'wordpress', 'zapier', 'salesforce'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Shopify Sidekick',
    category: 'automation',
    pricing_model: 'free',
    price_from: 0,
    url: 'https://shopify.com/sidekick',
    website_domain: 'shopify.com',
    description: 'AI assistant built into Shopify that helps merchants optimize their store, analyze performance, and automate tasks via conversation.',
    use_cases: ['ecommerce', 'store_management', 'ai_assistant', 'analytics'],
    best_for: [
      'Shopify merchants wanting AI assistance within their store',
      'e-commerce owners optimizing store performance',
    ],
    not_for: ['non-Shopify stores', 'complex custom development needs'],
    score: 72,
    roi_score: 70,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['shopify'],
    integrations: ['shopify'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Gorgias',
    category: 'customer_service',
    pricing_model: 'paid',
    price_from: 10,
    url: 'https://gorgias.com',
    website_domain: 'gorgias.com',
    description: 'E-commerce customer support helpdesk that centralizes email, chat, and social support with automated responses for order-related queries.',
    use_cases: ['customer_service', 'ecommerce', 'ticket_management', 'automation'],
    best_for: [
      'Shopify and WooCommerce stores reducing support workload',
      'e-commerce teams handling high order-related support volume',
    ],
    not_for: ['B2B SaaS companies', 'non-e-commerce businesses'],
    score: 78,
    roi_score: 75,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['shopify', 'woocommerce', 'klaviyo'],
    integrations: ['shopify', 'woocommerce', 'instagram', 'facebook'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Seamless.ai',
    category: 'prospecting',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://seamless.ai',
    website_domain: 'seamless.ai',
    description: 'Real-time B2B contact data platform for finding verified email addresses and phone numbers to build targeted prospect lists.',
    use_cases: ['prospecting', 'lead_generation', 'data_enrichment', 'outbound_sales'],
    best_for: [
      'B2B sales teams building outbound prospect lists',
      'SDRs needing verified contact data for cold outreach',
    ],
    not_for: ['B2C businesses', 'inbound-only marketing teams'],
    score: 72,
    roi_score: 70,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['salesforce', 'hubspot', 'outreach'],
    integrations: ['salesforce', 'hubspot', 'linkedin'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Surfer SEO',
    category: 'seo',
    pricing_model: 'paid',
    price_from: 89,
    url: 'https://surferseo.com',
    website_domain: 'surferseo.com',
    description: 'Content optimization platform that analyzes top-ranking pages to provide real-time SEO scoring and content recommendations.',
    use_cases: ['seo', 'content_optimization', 'keyword_research', 'content_creation'],
    best_for: [
      'content writers optimizing articles for search rankings',
      'SEO agencies delivering data-driven content optimization',
    ],
    not_for: ['technical SEO audits', 'link building campaigns'],
    score: 80,
    roi_score: 78,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['google_docs', 'wordpress', 'jasper'],
    integrations: ['google_docs', 'wordpress', 'semrush'],
    last_updated: '2025-01-01',
  },
  {
    name: 'DALL-E',
    category: 'image',
    pricing_model: 'usage',
    price_from: 0,
    url: 'https://openai.com/dall-e-3',
    website_domain: 'openai.com',
    description: 'OpenAI\'s image generation model that creates photorealistic images and illustrations from text descriptions.',
    use_cases: ['image_generation', 'content_creation', 'design', 'marketing'],
    best_for: [
      'marketers needing unique visual content quickly',
      'designers prototyping visual concepts with AI',
    ],
    not_for: ['high-volume image generation on a budget', 'users needing full model control'],
    score: 82,
    roi_score: 75,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['chatgpt', 'zapier', 'canva'],
    integrations: ['openai_api', 'chatgpt'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Stable Diffusion',
    category: 'image',
    pricing_model: 'free',
    price_from: 0,
    url: 'https://stability.ai',
    website_domain: 'stability.ai',
    description: 'Open-source AI image generation model that runs locally, offering full control over the generation process without API costs.',
    use_cases: ['image_generation', 'customisation', 'volume', 'open_source'],
    best_for: [
      'developers and technical users wanting full control over image generation',
      'creators needing unlimited image generation without API costs',
    ],
    not_for: ['non-technical users', 'teams needing quick cloud-based setup'],
    score: 79,
    roi_score: 74,
    setup_difficulty: 'hard',
    time_to_value: '1 week',
    compatible_with: ['comfyui', 'automatic1111'],
    integrations: [],
    last_updated: '2025-01-01',
  },
  {
    name: 'Synthesia',
    category: 'video',
    pricing_model: 'paid',
    price_from: 22,
    url: 'https://synthesia.io',
    website_domain: 'synthesia.io',
    description: 'AI video creation platform that generates professional avatar videos from text scripts in 120+ languages without filming.',
    use_cases: ['video_creation', 'training', 'explainer_videos', 'localization'],
    best_for: [
      'L&D teams creating training videos at scale',
      'companies producing multilingual video content without studios',
    ],
    not_for: ['creative storytelling videos', 'social media short-form content'],
    score: 80,
    roi_score: 78,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['powerpoint', 'lms_platforms'],
    integrations: [],
    last_updated: '2025-01-01',
  },
  {
    name: 'Google Analytics',
    category: 'analytics',
    pricing_model: 'free',
    price_from: 0,
    url: 'https://analytics.google.com',
    website_domain: 'analytics.google.com',
    description: 'Free web analytics platform by Google for tracking website traffic, user behavior, conversion funnels, and marketing campaign performance.',
    use_cases: ['analytics', 'web_tracking', 'conversion_optimization', 'reporting'],
    best_for: [
      'any website owner needing free web analytics',
      'marketing teams measuring campaign performance and ROI',
    ],
    not_for: ['product analytics for SaaS apps', 'real-time event streaming at scale'],
    score: 85,
    roi_score: 85,
    setup_difficulty: 'medium',
    time_to_value: '1 week',
    compatible_with: ['google_ads', 'google_search_console', 'looker_studio'],
    integrations: ['google_ads', 'google_search_console', 'bigquery'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Windsurf',
    category: 'coding',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://codeium.com/windsurf',
    website_domain: 'codeium.com',
    description: 'AI-powered IDE with agentic coding capabilities, offering code completions, refactoring, and multi-file editing assistance.',
    use_cases: ['coding', 'code_completion', 'refactoring', 'ai_assistant'],
    best_for: [
      'developers wanting a free GitHub Copilot alternative',
      'teams looking for AI coding assistance with generous free tier',
    ],
    not_for: ['non-developers', 'teams requiring enterprise security compliance'],
    score: 78,
    roi_score: 75,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['github', 'gitlab', 'vscode'],
    integrations: ['github', 'gitlab'],
    last_updated: '2025-01-01',
  },
  {
    name: 'Tavily',
    category: 'research',
    pricing_model: 'freemium',
    price_from: 0,
    url: 'https://tavily.com',
    website_domain: 'tavily.com',
    description: 'AI-optimized web search API designed for LLM agents and RAG pipelines, providing real-time web data with structured results.',
    use_cases: ['research', 'web_search', 'ai_agents', 'rag'],
    best_for: [
      'developers building AI agents that need web search',
      'teams integrating real-time web data into LLM applications',
    ],
    not_for: ['non-technical users', 'simple consumer web search'],
    score: 75,
    roi_score: 72,
    setup_difficulty: 'easy',
    time_to_value: '1 day',
    compatible_with: ['langchain', 'openai', 'claude'],
    integrations: ['langchain', 'llamaindex'],
    last_updated: '2025-01-01',
  },
]

// ---------------------------------------------------------------------------
// Logic (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Compute which tools to insert vs skip given a set of existing names.
 * @param {string[]} existingNames - lowercased names already in DB
 * @returns {{ toInsert: Array, toSkip: Array }}
 */
export function partitionTools(existingNames) {
  const existingSet = new Set(existingNames.map(n => n.toLowerCase()))
  const toInsert = []
  const toSkip = []
  for (const tool of TOOLS_TO_ADD) {
    if (existingSet.has(tool.name.toLowerCase())) {
      toSkip.push(tool)
    } else {
      toInsert.push(tool)
    }
  }
  return { toInsert, toSkip }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔧 Running tool import in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: existing, error: fetchError } = await supabase
    .from('agents')
    .select('name')

  if (fetchError) {
    console.error(`ERROR: Failed to fetch agents: ${fetchError.message}`)
    process.exit(1)
  }

  const existingNames = (existing || []).map(a => a.name)
  const { toInsert, toSkip } = partitionTools(existingNames)

  // Log skipped tools
  for (const tool of toSkip) {
    console.log(`[SKIP] name="${tool.name}" — already exists in database`)
  }

  let inserted = 0
  let hasErrors = false

  // Process inserts in batches of 10
  const BATCH_SIZE = 10
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)

    for (const tool of batch) {
      console.log(`${PREFIX} INSERT name="${tool.name}" category="${tool.category}" url="${tool.url}"`)

      if (!DRY_RUN) {
        const { error } = await supabase.from('agents').insert(tool)
        if (error) {
          console.error(`ERROR: Failed to insert "${tool.name}": ${error.message}`)
          hasErrors = true
        } else {
          inserted++
        }
      } else {
        inserted++
      }
    }

    // Rate limit protection
    if (!DRY_RUN && i + BATCH_SIZE < toInsert.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(
    `\nImport complete: ${inserted} tools ${DRY_RUN ? 'would be inserted' : 'inserted'}, ${toSkip.length} skipped (already exist)`
  )

  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
