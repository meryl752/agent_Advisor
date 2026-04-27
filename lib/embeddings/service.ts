/**
 * Embedding Service - Jina AI v4 avec retry et meilleure gestion d'erreurs
 * 
 * Ce service génère des embeddings vectoriels (1024 dimensions) via l'API Jina AI v4.
 * Il inclut un mécanisme de retry automatique et un logging détaillé pour le monitoring.
 * 
 * Jina AI v4 offre :
 * - 1024 dimensions (vs 384 pour HuggingFace)
 * - Meilleure qualité d'embeddings
 * - 1 million de tokens gratuits par mois
 * - Pas de cold start
 */

const JINA_MODEL = 'jina-embeddings-v3'
const JINA_DIMENSIONS = 1024
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export interface EmbeddingResult {
  vector: number[]
  provider: 'jina'
  dimensions: number
  latency_ms: number
  retries: number
}

class EmbeddingService {
  private requestCount = 0
  private errorCount = 0
  private totalLatency = 0

  /**
   * Génère un embedding vectoriel à partir d'un texte
   * Retry automatique en cas d'erreur (max 3 tentatives)
   */
  async generate(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now()
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const vector = await this.callJinaAI(text)
        const latency = Date.now() - startTime
        
        this.requestCount++
        this.totalLatency += latency
        
        console.log(`[Embedding] ✅ Jina AI v4 - ${vector.length} dimensions - ${latency}ms${attempt > 0 ? ` (retry ${attempt})` : ''}`)
        
        return {
          vector,
          provider: 'jina',
          dimensions: JINA_DIMENSIONS,
          latency_ms: latency,
          retries: attempt,
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        this.errorCount++
        
        console.warn(`[Embedding] ⚠️ Tentative ${attempt + 1}/${MAX_RETRIES} échouée:`, lastError.message)
        
        // Retry avec délai exponentiel
        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
          console.log(`[Embedding] ⏳ Retry dans ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    // Toutes les tentatives ont échoué
    throw new Error(`[Embedding] Échec après ${MAX_RETRIES} tentatives: ${lastError?.message}`)
  }

  /**
   * Appel direct à l'API Jina AI v4
   */
  private async callJinaAI(text: string): Promise<number[]> {
    const apiKey = process.env.JINA_API_KEY
    if (!apiKey) {
      throw new Error('[Embedding] JINA_API_KEY manquant dans .env.local')
    }

    const url = 'https://api.jina.ai/v1/embeddings'
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        input: text,
        encoding_type: 'float',
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Jina AI API error ${res.status}: ${errorText}`)
    }

    const data = await res.json()
    
    // Format de réponse Jina AI : { data: [{ embedding: [...] }] }
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error('Format de réponse Jina AI invalide')
    }

    const embedding = data.data[0].embedding
    if (!Array.isArray(embedding)) {
      throw new Error('Embedding Jina AI invalide')
    }

    return embedding
  }

  /**
   * Retourne les statistiques du service
   */
  getStats() {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      avgLatency: this.requestCount > 0 ? Math.round(this.totalLatency / this.requestCount) : 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
    }
  }

  /**
   * Reset les statistiques
   */
  resetStats() {
    this.requestCount = 0
    this.errorCount = 0
    this.totalLatency = 0
  }
}

// Export singleton
export const embeddingService = new EmbeddingService()
