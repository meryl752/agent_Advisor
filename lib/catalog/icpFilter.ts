import { existsSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

export type CatalogFilterFile = {
  excluded_agent_ids?: string[]
  excluded_names_exact?: string[]
  excluded_name_contains?: string[]
  notes?: Record<string, string>
}

export type CatalogFilter = {
  excludedIds: Set<string>
  excludedNamesLower: Set<string>
  nameContainsLower: string[]
}

const EMPTY: CatalogFilter = {
  excludedIds: new Set(),
  excludedNamesLower: new Set(),
  nameContainsLower: [],
}

let cache: { mtimeMs: number; filter: CatalogFilter } | null = null

function normalizeId(id: string): string {
  return String(id).trim().toLowerCase()
}

function normalizeName(name: string): string {
  return String(name).trim().toLowerCase()
}

/** Parse le JSON catalogue (tests + chargement fichier). */
export function buildCatalogFilterFromJson(raw: unknown): CatalogFilter {
  if (!raw || typeof raw !== 'object') {
    return {
      excludedIds: new Set(),
      excludedNamesLower: new Set(),
      nameContainsLower: [],
    }
  }

  const o = raw as CatalogFilterFile
  const excludedIds = new Set(
    (o.excluded_agent_ids ?? []).map(normalizeId).filter(Boolean)
  )
  const excludedNamesLower = new Set(
    (o.excluded_names_exact ?? []).map(normalizeName).filter(Boolean)
  )
  const nameContainsLower = (o.excluded_name_contains ?? [])
    .map(s => String(s).trim().toLowerCase())
    .filter(Boolean)

  return { excludedIds, excludedNamesLower, nameContainsLower }
}

function filterPath(): string {
  return join(process.cwd(), 'data', 'catalog-filter.json')
}

/**
 * Charge `data/catalog-filter.json` (cache invalidé si le fichier change).
 * Fichier absent ou JSON invalide → aucun filtrage.
 */
export function getCatalogFilter(): CatalogFilter {
  const path = filterPath()
  if (!existsSync(path)) {
    cache = null
    return {
      excludedIds: new Set(),
      excludedNamesLower: new Set(),
      nameContainsLower: [],
    }
  }

  try {
    const mtimeMs = statSync(path).mtimeMs
    if (cache && cache.mtimeMs === mtimeMs) return cache.filter

    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown
    const filter = buildCatalogFilterFromJson(raw)
    cache = { mtimeMs, filter }
    return filter
  } catch (e) {
    console.warn('[catalog-filter] Lecture impossible, filtre désactivé:', e instanceof Error ? e.message : e)
    return {
      excludedIds: new Set(),
      excludedNamesLower: new Set(),
      nameContainsLower: [],
    }
  }
}

export function isAgentExcludedByCatalogFilter(agent: { id: string; name: string }): boolean {
  const f = getCatalogFilter()
  const id = normalizeId(agent.id)
  const name = String(agent.name ?? '')
  const nl = name.trim().toLowerCase()

  if (f.excludedIds.has(id)) return true
  if (f.excludedNamesLower.has(nl)) return true
  for (const frag of f.nameContainsLower) {
    if (frag && nl.includes(frag)) return true
  }
  return false
}

/** Retire les agents exclus par le fichier catalogue (relu à la main). */
export function filterCatalogAgents<T extends { id: string; name: string }>(agents: T[]): T[] {
  if (!agents.length) return agents
  const f = getCatalogFilter()
  const total =
    f.excludedIds.size + f.excludedNamesLower.size + f.nameContainsLower.length
  if (total === 0) return agents

  const kept = agents.filter(a => !isAgentExcludedByCatalogFilter(a))
  const removed = agents.length - kept.length
  if (removed > 0) {
    console.log(
      `[catalog-filter] ${removed} agent(s) retiré(s) du pool reco (${agents.length} → ${kept.length})`
    )
  }
  return kept
}
