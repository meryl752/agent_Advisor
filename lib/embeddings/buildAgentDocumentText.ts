/**
 * Texte « document » pour Jina : aligné avec la requête orchestrateur
 * (objectif + secteur + catégories + sous-tâches) en incluant catégorie outil,
 * cas d'usage, cibles et contre-indications.
 */
export type AgentEmbedSource = {
  name: string
  category?: string | null
  description?: string | null
  use_cases?: string[] | null
  best_for?: string[] | null
  not_for?: string[] | null
}

/** Limite conservative pour l'API embeddings (tokens ≈ caractères / 4). */
const MAX_CHARS = 14_000

export function buildAgentDocumentText(agent: AgentEmbedSource): string {
  const parts: string[] = [agent.name.trim()]

  const cat = (agent.category ?? '').trim()
  if (cat) parts.push(`Catégorie produit: ${cat}`)

  const desc = (agent.description ?? '').trim()
  if (desc) parts.push(desc)

  const uc = (agent.use_cases ?? []).map(s => String(s).trim()).filter(Boolean).slice(0, 10)
  if (uc.length) parts.push(`Cas d'usage: ${uc.join('. ')}`)

  const bf = (agent.best_for ?? []).map(s => String(s).trim()).filter(Boolean).slice(0, 6)
  if (bf.length) parts.push(`Idéal pour: ${bf.join('. ')}`)

  const nf = (agent.not_for ?? []).map(s => String(s).trim()).filter(Boolean).slice(0, 6)
  if (nf.length) parts.push(`À éviter si: ${nf.join('. ')}`)

  let text = parts.join('. ')
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS).trim()
  return text
}
