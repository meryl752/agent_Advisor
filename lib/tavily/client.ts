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
const TAVILY_TIMEOUT_MS = 8000 // 8s — Tavily should respond fast, fail quickly if not

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
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS)

    const res = await fetch(TAVILY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: false,
        include_raw_content: false,
        include_domains: [],
        exclude_domains: ['reddit.com', 'youtube.com', 'twitter.com', 'medium.com'],
      }),
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.error('[Tavily] Search failed:', res.status, await res.text())
      return []
    }

    const data: TavilySearchResponse = await res.json()
    return data.results ?? []
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[Tavily] Timeout après ${TAVILY_TIMEOUT_MS}ms — skipping`)
    } else {
      console.error('[Tavily] Network error:', err)
    }
    return []
  }
}
