import { getGeminiClient } from './client'
import type { Agent } from '@/lib/supabase/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserContext {
  objective: string
  sector: string
  team_size: 'solo' | 'small' | 'medium' | 'large'
  budget: 'zero' | 'low' | 'medium' | 'high'
  tech_level: 'beginner' | 'intermediate' | 'advanced'
  timeline: 'asap' | 'weeks' | 'months'
  current_tools: string[]
}

export interface SubTask {
  name: string
  without_ai: string
  with_ai: string
  tool_name: string
}

export interface StackResult {
  agents: Array<{
    id: string
    name: string
    category: string
    price_from: number
    score: number
    role: string
    reason: string
    rank: number
    website_domain?: string
    setup_difficulty?: string
    time_to_value?: string
    concrete_result?: string
    subtasks?: SubTask[]
    time_saved_per_week?: number
  }>
  total_cost: number
  roi_estimate: number
  justification: string
  stack_name: string
  quick_wins: string[]
  warnings: string[]
  subtasks?: SubTask[]
  time_saved_per_week?: number
}

// ─── Couche 1 : Rule-based matcher ───────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  copywriting:      ['texte', 'rédaction', 'contenu', 'blog', 'copy', 'écrire', 'article', 'email', 'newsletter', 'post', 'caption', 'description', 'fiche produit'],
  image:            ['image', 'visuel', 'photo', 'design', 'graphique', 'logo', 'bannière', 'illustration', 'créatif', 'branding'],
  automation:       ['automatiser', 'workflow', 'intégration', 'automatisation', 'make', 'zapier', 'répétitif', 'notification', 'synchroniser'],
  analytics:        ['analytics', 'données', 'statistiques', 'reporting', 'dashboard', 'kpi', 'mesurer', 'performance', 'trafic'],
  customer_service: ['client', 'support', 'chatbot', 'service client', 'sav', 'répondre', 'question', 'ticket', 'help'],
  seo:              ['seo', 'référencement', 'google', 'trafic', 'mots-clés', 'organique', 'classement', 'backlink', 'optimiser'],
  prospecting:      ['prospect', 'vente', 'leads', 'outreach', 'email froid', 'b2b', 'commercial', 'crm', 'pipeline', 'acquérir'],
  ecommerce:        ['shopify', 'boutique', 'vendre', 'produit', 'e-commerce', 'commande', 'woocommerce', 'store'],
  research:         ['recherche', 'veille', 'analyser', 'information', 'étude', 'synthèse', 'rapport', 'documentation'],
  video:            ['vidéo', 'youtube', 'court métrage', 'reels', 'tiktok', 'clip', 'podcast', 'montage', 'créateur'],
  coding:           ['code', 'développer', 'application', 'site', 'api', 'programmer', 'déployer', 'technique', 'dev'],
  social:           ['réseaux sociaux', 'instagram', 'linkedin', 'twitter', 'tiktok', 'social media', 'communauté', 'audience'],
}

const SECTOR_BONUS: Record<string, string[]> = {
  ecommerce:    ['shopify', 'tidio', 'canva', 'klaviyo', 'polar analytics'],
  saas:         ['intercom', 'mixpanel', 'github copilot', 'cursor', 'hubspot'],
  agence:       ['semrush', 'ahrefs', 'notion ai', 'gamma', 'taplio'],
  consultant:   ['otter.ai', 'gamma', 'notion ai', 'linkedin sales navigator', 'lavender'],
  créateur:     ['opus clip', 'descript', 'heygen', 'canva ai', 'buffer ai', 'tweet hunter'],
  'b2b':        ['apollo.io', 'clay', 'instantly ai', 'lemlist', 'hubspot', 'lavender'],
}

const BUDGET_LIMITS: Record<UserContext['budget'], number> = {
  zero: 0,
  low: 50,
  medium: 200,
  high: 1000,
}

const DIFFICULTY_MAP: Record<UserContext['tech_level'], string[]> = {
  beginner:     ['easy'],
  intermediate: ['easy', 'medium'],
  advanced:     ['easy', 'medium', 'hard'],
}

function scoreAgent(agent: Agent, ctx: UserContext, detectedCategories: string[]): number {
  let score = agent.roi_score * 0.35 + agent.score * 0.25

  // Bonus catégorie matchée
  if (detectedCategories.includes(agent.category)) score += 18

  // Bonus use_cases
  const lower = ctx.objective.toLowerCase()
  const useCaseMatches = agent.use_cases.filter(uc => lower.includes(uc)).length
  score += useCaseMatches * 7

  // Bonus secteur
  const sectorAgents = SECTOR_BONUS[ctx.sector.toLowerCase()] ?? []
  if (sectorAgents.some(s => agent.name.toLowerCase().includes(s))) score += 12

  // Filtre budget
  const maxBudget = BUDGET_LIMITS[ctx.budget]
  if (ctx.budget !== 'high' && agent.price_from > maxBudget) score -= 30

  // Filtre difficulté technique
  const allowedDifficulties = DIFFICULTY_MAP[ctx.tech_level]
  const agentDiff = (agent as Agent & { setup_difficulty?: string }).setup_difficulty ?? 'easy'
  if (!allowedDifficulties.includes(agentDiff)) score -= 20

  // Bonus outils actuels compatibles
  if (ctx.current_tools.some(t => agent.compatible_with?.includes(t.toLowerCase()))) score += 8

  // Bonus timeline urgente → favoriser time_to_value rapide
  if (ctx.timeline === 'asap') {
    const ttv = (agent as Agent & { time_to_value?: string }).time_to_value ?? ''
    if (ttv.includes('heure')) score += 10
    else if (ttv.includes('semaine')) score -= 5
  }

  return Math.min(Math.max(score, 0), 100)
}

export function ruleBasedFilter(agents: Agent[], ctx: UserContext): Agent[] {
  const lower = ctx.objective.toLowerCase()
  const detectedCategories = Object.entries(CATEGORY_KEYWORDS)
    .map(([cat, kws]) => ({ cat, matches: kws.filter(kw => lower.includes(kw)).length }))
    .filter(x => x.matches > 0)
    .sort((a, b) => b.matches - a.matches)
    .map(x => x.cat)
    .slice(0, 4)

  return agents
    .map(agent => ({ agent, score: scoreAgent(agent, ctx, detectedCategories) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.agent)
}

// ─── Couche 2 : LLM refinement (Gemini) ──────────────────────────────────────

export async function refineWithGemini(
  ctx: UserContext,
  candidates: Agent[]
): Promise<StackResult | null> {
  const candidateList = candidates.map((a, i) => {
    const agent = a as Agent & { setup_difficulty?: string; time_to_value?: string; website_domain?: string }
    return `${i + 1}. ${a.name} (${a.category}) — ${a.description} — ${a.price_from}€/mois — difficulté: ${agent.setup_difficulty ?? 'easy'} — délai valeur: ${agent.time_to_value ?? '?'} — score: ${a.score}`
  }).join('\n')

  const prompt = `Tu es un expert stratégiste en outils IA et productivité. Voici le profil exact de l'utilisateur :

OBJECTIF: "${ctx.objective}"
SECTEUR: ${ctx.sector}
TAILLE ÉQUIPE: ${ctx.team_size}
BUDGET MENSUEL MAX: ${BUDGET_LIMITS[ctx.budget]}€
NIVEAU TECHNIQUE: ${ctx.tech_level}
URGENCE: ${ctx.timeline}
OUTILS ACTUELS: ${ctx.current_tools.join(', ') || 'aucun'}

Voici les 12 meilleurs candidats pré-sélectionnés :

${candidateList}

Ta mission :
1. Sélectionner les 4 à 6 outils les plus adaptés à ce profil précis
2. Les classer dans l'ordre logique d'implémentation
3. Respecter ABSOLUMENT le budget de ${BUDGET_LIMITS[ctx.budget]}€/mois
4. Adapter les recommandations au niveau technique (${ctx.tech_level})
5. Identifier 3 quick wins immédiats et 2 points de vigilance
6. Décomposer l'objectif en 3-5 sous-tâches concrètes montrant le workflow sans IA vs avec IA
7. Pour chaque agent, donner un résultat concret mesurable qu'il va produire

Réponds UNIQUEMENT avec un JSON valide sans markdown :
{
  "stack_name": "Nom court accrocheur",
  "justification": "Explication stratégique 2-3 phrases adaptée au profil",
  "total_cost": 0,
  "roi_estimate": 0,
  "time_saved_per_week": 0,
  "quick_wins": ["Action immédiate 1", "Action immédiate 2", "Action immédiate 3"],
  "warnings": ["Point vigilance 1", "Point vigilance 2"],
  "subtasks": [
    {
      "name": "Nom de la sous-tâche",
      "without_ai": "Comment faire sans IA (temps, effort)",
      "with_ai": "Comment faire avec IA (gain concret)",
      "tool_name": "Nom de l'outil IA utilisé"
    }
  ],
  "agents": [
    {
      "id": "uuid de l'agent depuis la liste",
      "name": "nom exact",
      "category": "catégorie",
      "price_from": 0,
      "score": 0,
      "rank": 1,
      "role": "Rôle précis dans ce stack spécifique",
      "reason": "Pourquoi cet outil pour ce profil et cet objectif précis",
      "concrete_result": "Résultat mesurable concret (ex: '50 posts Instagram/mois', '200 leads qualifiés/semaine')"
    }
  ]
}`

  try {
    const geminiClient = getGeminiClient()
    if (!geminiClient) {
      console.error('Gemini client not available - API key missing')
      return null
    }

    // Timeout protection
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 30000)
    )
    
    const result = await Promise.race([
      geminiClient.generateContent(prompt),
      timeoutPromise
    ])
    
    let text = result.response.text().trim()
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const parsed: StackResult = JSON.parse(text)
    
    // Clear large objects from memory
    text = ''
    
    return parsed
  } catch (err) {
    console.error('Gemini refinement error:', err instanceof Error ? err.message : 'Unknown error')
    return null
  }
}

// ─── Algo hybride complet ─────────────────────────────────────────────────────

export async function getStackRecommendation(
  ctx: UserContext,
  allAgents: Agent[]
): Promise<StackResult | null> {
  const candidates = ruleBasedFilter(allAgents, ctx)
  if (candidates.length === 0) return null
  return await refineWithGemini(ctx, candidates)
}
