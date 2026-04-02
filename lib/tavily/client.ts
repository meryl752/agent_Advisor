/**
 * Tavily search client — targeted doc search only.
 * 1 credit per search. We cache results in Supabase to avoid repeat calls.
 */

export interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilySearchResponse {
  results: TavilyResult[]
  query: string
}

const TAVILY_API_URL = 'https://api.tavily.com/search'

/**
 * Build a surgical search query for a specific tool + task.
 * Targets official docs and setup guides only — avoids generic blog spam.
 */
export function buildSearchQuery(toolName: string, toolDomain: string, taskDescription: string): string {
  const domain = toolDomain.replace('www.', '').split('.')[0]
  // Target: official docs, help centers, setup guides — not marketing pages
  return `${toolName} ${taskDescription} setup configuration step by step site:${toolDomain} OR site:help.${domain}.com OR site:docs.${domain}.com OR site:support.${domain}.com`
}

/**
 * Search Tavily for setup documentation.
 * Returns top 3 results max to keep content focused.
 */
export async function searchTavily(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.API_TAVILY
  if (!apiKey) {
    console.warn('[Tavily] API_TAVILY not configured — skipping search')
    return []
  }

  try {
    const res = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',      // basic = 1 credit, advanced = 2 credits
        max_results: 3,              // 3 results max — enough context, not too much noise
        include_answer: false,       // we want raw content, not a pre-summarized answer
        include_raw_content: false,  // snippet only — saves tokens for LLM
        include_domains: [],
        exclude_domains: ['reddit.com', 'youtube.com', 'twitter.com', 'medium.com'],
      }),
    })

    if (!res.ok) {
      console.error('[Tavily] Search failed:', res.status, await res.text())
      return []
    }

    const data: TavilySearchResponse = await res.json()
    return data.results ?? []
  } catch (err) {
    console.error('[Tavily] Network error:', err)
    return []
  }
}
