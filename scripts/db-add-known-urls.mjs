/**
 * Add URLs for known agents using built-in knowledge.
 * No LLM calls — pure static mapping from known tools.
 *
 * Usage:
 *   node scripts/db-add-known-urls.mjs          # dry-run
 *   node scripts/db-add-known-urls.mjs --apply  # commit
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
if (!url || !key) { console.error('ERROR: Missing env vars'); process.exit(1) }

const supabase = createClient(url, key)
const DRY_RUN = !process.argv.includes('--apply')
const PREFIX = DRY_RUN ? '[DRY RUN]' : '[APPLIED]'

function extractDomain(urlStr) {
  try { return new URL(urlStr).hostname.replace(/^www\./, '') } catch { return null }
}

// Comprehensive URL map from built-in knowledge
const KNOWN_URLS = new Map([
  // Adobe
  ['adobe photoshop', 'https://adobe.com/products/photoshop'],
  ['adobe premiere pro', 'https://adobe.com/products/premiere'],
  ['adobe firefly', 'https://firefly.adobe.com'],
  ['adobe express', 'https://express.adobe.com'],

  // AI Coding
  ['agentgpt', 'https://agentgpt.reworkd.ai'],
  ['ai/ml api', 'https://aimlapi.com'],
  ['ai2sql', 'https://ai2sql.io'],
  ['amazon q developer', 'https://aws.amazon.com/q/developer'],
  ['amazon sagemaker', 'https://aws.amazon.com/sagemaker'],
  ['amazon sage maker', 'https://aws.amazon.com/sagemaker'],
  ['amazon translate', 'https://aws.amazon.com/translate'],
  ['anakin.ai', 'https://anakin.ai'],
  ['appypie', 'https://appypie.com'],
  ['arcwise', 'https://arcwise.app'],
  ['assemblyai', 'https://assemblyai.com'],
  ['assembly', 'https://assemblyai.com'],

  // AI Image
  ['airbrush', 'https://airbrush.ai'],
  ['aragon ai', 'https://aragon.ai'],
  ['artbreeder', 'https://artbreeder.com'],
  ['ai home design', 'https://aihomedesign.com'],

  // AI Video
  ['ai studios', 'https://aistudios.com'],
  ['animoto', 'https://animoto.com'],
  ['argil', 'https://argil.ai'],
  ['artlist', 'https://artlist.io'],

  // AI Writing & Copywriting
  ['aiapply', 'https://aiapply.co'],
  ['aithor', 'https://aithor.com'],
  ['aftership', 'https://aftership.com'],

  // Customer Service & Support
  ['ada', 'https://ada.cx'],
  ['amelia', 'https://amelia.ai'],
  ['andi', 'https://andisearch.com'],
  ['arini', 'https://arini.ai'],

  // Analytics & Data
  ['akkio', 'https://akkio.com'],
  ['algolia', 'https://algolia.com'],
  ['alphastream', 'https://alphastream.io'],
  ['altindex', 'https://altindex.com'],
  ['anaplan', 'https://anaplan.com'],

  // Automation & Productivity
  ['10web', 'https://10web.io'],
  ['11x', 'https://11x.ai'],
  ['abridge', 'https://abridge.com'],
  ['accio', 'https://accio.com'],
  ['adaptive insights', 'https://workday.com/en-us/products/adaptive-planning'],
  ['adept', 'https://adept.ai'],
  ['air', 'https://air.inc'],
  ['airops', 'https://airops.com'],
  ['aimy ads', 'https://aimyads.com'],
  ['align ai', 'https://align.ai'],
  ['aleph alpha', 'https://aleph-alpha.com'],
  ['ascend.io', 'https://ascend.io'],

  // B Tools
  ['bardeen', 'https://bardeen.ai'],
  ['beautiful.ai', 'https://beautiful.ai'],
  ['beehiiv', 'https://beehiiv.com'],
  ['bigml', 'https://bigml.com'],
  ['bing ai', 'https://bing.com/chat'],
  ['blackbox ai', 'https://blackbox.ai'],
  ['bloom', 'https://huggingface.co/bigscience/bloom'],
  ['bolt.new', 'https://bolt.new'],
  ['botpress', 'https://botpress.com'],
  ['brandwatch', 'https://brandwatch.com'],
  ['browse ai', 'https://browse.ai'],
  ['builderall', 'https://builderall.com'],

  // C Tools
  ['captions', 'https://captions.ai'],
  ['castmagic', 'https://castmagic.io'],
  ['chatbase', 'https://chatbase.co'],
  ['chatfuel', 'https://chatfuel.com'],
  ['chatpdf', 'https://chatpdf.com'],
  ['chatsonic', 'https://writesonic.com/chat'],
  ['civitai', 'https://civitai.com'],
  ['clearscope', 'https://clearscope.io'],
  ['clickup ai', 'https://clickup.com'],
  ['codeium', 'https://codeium.com'],
  ['cohere', 'https://cohere.com'],
  ['compose ai', 'https://compose.ai'],
  ['content at scale', 'https://contentatscale.ai'],
  ['contentful', 'https://contentful.com'],
  ['copy.ai', 'https://copy.ai'],
  ['copymatic', 'https://copymatic.ai'],
  ['coze', 'https://coze.com'],
  ['creatify', 'https://creatify.ai'],
  ['creatoriq', 'https://creatoriq.com'],
  ['crisp', 'https://crisp.chat'],
  ['custom gpt', 'https://customgpt.ai'],

  // D Tools
  ['d-id', 'https://d-id.com'],
  ['dataiku', 'https://dataiku.com'],
  ['datarails', 'https://datarails.com'],
  ['deepl', 'https://deepl.com'],
  ['deepseek', 'https://deepseek.com'],
  ['descript', 'https://descript.com'],
  ['designify', 'https://designify.com'],
  ['dify', 'https://dify.ai'],
  ['donotpay', 'https://donotpay.com'],
  ['durable', 'https://durable.co'],
  ['durable ai', 'https://durable.co'],

  // E Tools
  ['elai', 'https://elai.io'],
  ['eleven labs', 'https://elevenlabs.io'],
  ['emailtree', 'https://emailtree.ai'],
  ['endel', 'https://endel.io'],
  ['enterprise bot', 'https://enterprisebot.ai'],

  // F Tools
  ['fathom', 'https://fathom.video'],
  ['figma ai', 'https://figma.com'],
  ['fireflies', 'https://fireflies.ai'],
  ['fireflies.ai', 'https://fireflies.ai'],
  ['fliki', 'https://fliki.ai'],
  ['flowgpt', 'https://flowgpt.com'],
  ['forethought', 'https://forethought.ai'],
  ['framer ai', 'https://framer.com'],
  ['freshchat', 'https://freshworks.com/freshchat'],
  ['freshworks', 'https://freshworks.com'],
  ['frase', 'https://frase.io'],
  ['frase.io', 'https://frase.io'],
  ['futurepedia', 'https://futurepedia.io'],

  // G Tools
  ['gamma', 'https://gamma.app'],
  ['getimg.ai', 'https://getimg.ai'],
  ['ghostwriter', 'https://ghostwriter.ai'],
  ['glean', 'https://glean.com'],
  ['gpt-4', 'https://openai.com/gpt-4'],
  ['gpt4all', 'https://gpt4all.io'],
  ['grammarly', 'https://grammarly.com'],
  ['grammarly go', 'https://grammarly.com'],
  ['grain', 'https://grain.com'],
  ['grok', 'https://grok.x.ai'],
  ['groq', 'https://groq.com'],
  ['guidde', 'https://guidde.com'],

  // H Tools
  ['harvey', 'https://harvey.ai'],
  ['heygen', 'https://heygen.com'],
  ['heygen ai', 'https://heygen.com'],
  ['heymarket', 'https://heymarket.com'],
  ['highspot', 'https://highspot.com'],
  ['hugging face', 'https://huggingface.co'],
  ['huggingface', 'https://huggingface.co'],
  ['humata', 'https://humata.ai'],
  ['hyperwrite', 'https://hyperwriteai.com'],

  // I Tools
  ['ideogram', 'https://ideogram.ai'],
  ['illusion diffusion', 'https://huggingface.co/spaces/AP123/IllusionDiffusion'],
  ['imagen', 'https://imagen.research.google'],
  ['inflection ai', 'https://inflection.ai'],
  ['invideo', 'https://invideo.io'],
  ['invideo ai', 'https://invideo.io'],

  // J Tools
  ['jasper', 'https://jasper.ai'],
  ['jasper ai', 'https://jasper.ai'],
  ['jenni ai', 'https://jenni.ai'],
  ['jina ai', 'https://jina.ai'],
  ['julius', 'https://julius.ai'],

  // K Tools
  ['kaiber', 'https://kaiber.ai'],
  ['kapwing', 'https://kapwing.com'],
  ['kittl', 'https://kittl.com'],
  ['krea', 'https://krea.ai'],
  ['krisp', 'https://krisp.ai'],

  // L Tools
  ['langchain', 'https://langchain.com'],
  ['lasso', 'https://lasso.ai'],
  ['lavender', 'https://lavender.ai'],
  ['leonardo ai', 'https://leonardo.ai'],
  ['letsenhance', 'https://letsenhance.io'],
  ['levity', 'https://levity.ai'],
  ['lilt', 'https://lilt.com'],
  ['llama', 'https://llama.meta.com'],
  ['llama 2', 'https://llama.meta.com'],
  ['llama 3', 'https://llama.meta.com'],
  ['looka', 'https://looka.com'],
  ['loom ai', 'https://loom.com'],
  ['lovable', 'https://lovable.dev'],
  ['lumen5', 'https://lumen5.com'],
  ['lusha', 'https://lusha.com'],

  // M Tools
  ['magic eraser', 'https://magiceraser.io'],
  ['magicslides', 'https://magicslides.app'],
  ['manychat', 'https://manychat.com'],
  ['marky', 'https://marky.ai'],
  ['mem', 'https://mem.ai'],
  ['mem.ai', 'https://mem.ai'],
  ['merlin', 'https://merlin.foyer.work'],
  ['meta ai', 'https://ai.meta.com'],
  ['microsoft copilot', 'https://copilot.microsoft.com'],
  ['midjourney', 'https://midjourney.com'],
  ['miro ai', 'https://miro.com'],
  ['mistral', 'https://mistral.ai'],
  ['mistral ai', 'https://mistral.ai'],
  ['monday.com ai', 'https://monday.com'],
  ['moonbeam', 'https://gomoonbeam.com'],
  ['motion', 'https://usemotion.com'],
  ['motion app', 'https://usemotion.com'],
  ['murf', 'https://murf.ai'],
  ['murf ai', 'https://murf.ai'],

  // N Tools
  ['namelix', 'https://namelix.com'],
  ['natural reader', 'https://naturalreaders.com'],
  ['navan', 'https://navan.com'],
  ['neural love', 'https://neural.love'],
  ['neuraltext', 'https://neuraltext.com'],
  ['nightcafe', 'https://nightcafe.studio'],
  ['notion ai', 'https://notion.so'],
  ['notta', 'https://notta.ai'],
  ['novu', 'https://novu.co'],

  // O Tools
  ['odesk', 'https://upwork.com'],
  ['ollama', 'https://ollama.ai'],
  ['openai', 'https://openai.com'],
  ['openai api', 'https://openai.com/api'],
  ['opus clip', 'https://opus.pro'],
  ['opus.pro', 'https://opus.pro'],
  ['otter.ai', 'https://otter.ai'],
  ['outreach', 'https://outreach.io'],
  ['outread', 'https://outread.com'],

  // P Tools
  ['paperpal', 'https://paperpal.com'],
  ['paraphraser', 'https://paraphraser.io'],
  ['patterned ai', 'https://patterned.ai'],
  ['pdf.ai', 'https://pdf.ai'],
  ['pencil', 'https://trypencil.com'],
  ['peppertype', 'https://peppertype.ai'],
  ['phantombuster', 'https://phantombuster.com'],
  ['photoleap', 'https://photoleapapp.com'],
  ['photoroom', 'https://photoroom.com'],
  ['pictory', 'https://pictory.ai'],
  ['piggy', 'https://piggy.ai'],
  ['pinecone', 'https://pinecone.io'],
  ['pipedream', 'https://pipedream.com'],
  ['pitch', 'https://pitch.com'],
  ['pixelcut', 'https://pixelcut.ai'],
  ['pixlr', 'https://pixlr.com'],
  ['play.ht', 'https://play.ht'],
  ['playht', 'https://play.ht'],
  ['poe', 'https://poe.com'],
  ['poised', 'https://poised.com'],
  ['popai', 'https://popai.pro'],
  ['predis.ai', 'https://predis.ai'],
  ['prezent', 'https://prezent.ai'],
  ['printful', 'https://printful.com'],
  ['printify', 'https://printify.com'],
  ['prowritingaid', 'https://prowritingaid.com'],

  // Q Tools
  ['quillbot', 'https://quillbot.com'],
  ['qwen', 'https://qwenlm.github.io'],

  // R Tools
  ['reachout.ai', 'https://reachout.ai'],
  ['reclaim.ai', 'https://reclaim.ai'],
  ['replit', 'https://replit.com'],
  ['replit ai', 'https://replit.com'],
  ['resemble ai', 'https://resemble.ai'],
  ['respell', 'https://respell.ai'],
  ['reword', 'https://reword.com'],
  ['riku.ai', 'https://riku.ai'],
  ['riverside', 'https://riverside.fm'],
  ['roam research', 'https://roamresearch.com'],
  ['runway', 'https://runwayml.com'],
  ['runway ml', 'https://runwayml.com'],

  // S Tools
  ['salesforce einstein', 'https://salesforce.com/products/einstein'],
  ['saleshandy', 'https://saleshandy.com'],
  ['scale ai', 'https://scale.com'],
  ['scalenut', 'https://scalenut.com'],
  ['scribe', 'https://scribehow.com'],
  ['scribehow', 'https://scribehow.com'],
  ['sembly', 'https://sembly.ai'],
  ['semrush one', 'https://semrush.com'],
  ['sendbird', 'https://sendbird.com'],
  ['seo.ai', 'https://seo.ai'],
  ['seomator', 'https://seomator.com'],
  ['servicebell', 'https://servicebell.com'],
  ['shortwave', 'https://shortwave.com'],
  ['simplified', 'https://simplified.com'],
  ['sketch2code', 'https://sketch2code.azurewebsites.net'],
  ['sketchbook', 'https://sketchbook.com'],
  ['slack gpt', 'https://slack.com'],
  ['slazzer', 'https://slazzer.com'],
  ['smartwriter', 'https://smartwriter.ai'],
  ['smodin', 'https://smodin.io'],
  ['snazzy ai', 'https://snazzy.ai'],
  ['sora', 'https://openai.com/sora'],
  ['soundraw', 'https://soundraw.io'],
  ['spoke.ai', 'https://spoke.ai'],
  ['stable diffusion xl', 'https://stability.ai'],
  ['stablecog', 'https://stablecog.com'],
  ['storychief', 'https://storychief.io'],
  ['streamlit', 'https://streamlit.io'],
  ['sudowrite', 'https://sudowrite.com'],
  ['supernormal', 'https://supernormal.com'],
  ['surfer', 'https://surferseo.com'],

  // T Tools
  ['taskade', 'https://taskade.com'],
  ['text blaze', 'https://blaze.today'],
  ['textcortex', 'https://textcortex.com'],
  ['textio', 'https://textio.com'],
  ['tldv', 'https://tldv.io'],
  ['tome', 'https://tome.app'],
  ['topaz labs', 'https://topazlabs.com'],
  ['trello ai', 'https://trello.com'],
  ['tripadvisor ai', 'https://tripadvisor.com'],
  ['tubebuddy', 'https://tubebuddy.com'],
  ['typeface', 'https://typeface.ai'],
  ['typeform ai', 'https://typeform.com'],
  ['typefully', 'https://typefully.com'],

  // U Tools
  ['undetectable ai', 'https://undetectable.ai'],
  ['unscreen', 'https://unscreen.com'],
  ['upscayl', 'https://upscayl.org'],

  // V Tools
  ['v0', 'https://v0.dev'],
  ['v0.dev', 'https://v0.dev'],
  ['veed', 'https://veed.io'],
  ['veed.io', 'https://veed.io'],
  ['verbatik', 'https://verbatik.com'],
  ['vidiq', 'https://vidiq.com'],
  ['vidyo.ai', 'https://vidyo.ai'],
  ['visme', 'https://visme.co'],
  ['voiceflow', 'https://voiceflow.com'],
  ['voiceover', 'https://voiceover.ai'],

  // W Tools
  ['wand ai', 'https://wand.ai'],
  ['watermark remover', 'https://watermarkremover.io'],
  ['webflow ai', 'https://webflow.com'],
  ['whisper', 'https://openai.com/research/whisper'],
  ['wix ai', 'https://wix.com'],
  ['wordtune', 'https://wordtune.com'],
  ['writecream', 'https://writecream.com'],
  ['writer', 'https://writer.com'],
  ['writer.com', 'https://writer.com'],

  // X Tools
  ['xata', 'https://xata.io'],

  // Y Tools
  ['you.com', 'https://you.com'],
  ['yoodli', 'https://yoodli.ai'],

  // Z Tools
  ['zeta alpha', 'https://zeta-alpha.com'],
  ['zight', 'https://zight.com'],
  ['zoom ai', 'https://zoom.us'],
  ['zoominfo', 'https://zoominfo.com'],
  ['zyte', 'https://zyte.com'],
])

async function main() {
  console.log(`🔗 Adding known URLs in ${DRY_RUN ? 'DRY RUN' : 'APPLY'} mode...\n`)

  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, url')
    .or('url.is.null,url.eq.')

  if (error) { console.error('ERROR:', error.message); process.exit(1) }

  let added = 0, skipped = 0, hasErrors = false

  for (const agent of agents) {
    const mappedUrl = KNOWN_URLS.get(agent.name.toLowerCase())
    if (!mappedUrl) { skipped++; continue }

    const domain = extractDomain(mappedUrl)
    if (!domain) { skipped++; continue }

    console.log(`${PREFIX} UPDATE name="${agent.name}" url="${mappedUrl}"`)

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ url: mappedUrl, website_domain: domain })
        .eq('id', agent.id)

      if (updateError) {
        console.error(`  ERROR: ${updateError.message}`)
        hasErrors = true
      } else {
        added++
      }
    } else {
      added++
    }
  }

  console.log(`\nDone: ${added} URLs ${DRY_RUN ? 'would be added' : 'added'}, ${skipped} not in map`)
  process.exit(hasErrors ? 1 : 0)
}

main().catch(err => { console.error(err); process.exit(1) })
