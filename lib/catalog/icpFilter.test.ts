import { describe, it, expect } from 'vitest'
import { buildCatalogFilterFromJson } from './icpFilter'

describe('buildCatalogFilterFromJson', () => {
  it('vide / invalide', () => {
    const a = buildCatalogFilterFromJson(null)
    expect(a.excludedIds.size).toBe(0)
    const b = buildCatalogFilterFromJson({})
    expect(b.excludedNamesLower.size).toBe(0)
  })

  it('parse ids, noms exacts, sous-chaînes', () => {
    const f = buildCatalogFilterFromJson({
      excluded_agent_ids: ['  AAA  '],
      excluded_names_exact: ['Foo Bar'],
      excluded_name_contains: ['Therapist'],
    })
    expect(f.excludedIds.has('aaa')).toBe(true)
    expect(f.excludedNamesLower.has('foo bar')).toBe(true)
    expect(f.nameContainsLower).toContain('therapist')
  })
})

describe('règles exclusion (même logique que isAgentExcludedByCatalogFilter)', () => {
  function excluded(
    agent: { id: string; name: string },
    f: ReturnType<typeof buildCatalogFilterFromJson>
  ): boolean {
    const id = agent.id.trim().toLowerCase()
    const nl = agent.name.trim().toLowerCase()
    if (f.excludedIds.has(id)) return true
    if (f.excludedNamesLower.has(nl)) return true
    for (const frag of f.nameContainsLower) {
      if (frag && nl.includes(frag)) return true
    }
    return false
  }

  it('id, nom, contains', () => {
    const f = buildCatalogFilterFromJson({
      excluded_agent_ids: ['x-1'],
      excluded_names_exact: ['Alpha'],
      excluded_name_contains: ['spam'],
    })
    expect(excluded({ id: 'X-1', name: 'Z' }, f)).toBe(true)
    expect(excluded({ id: 'y', name: 'Alpha' }, f)).toBe(true)
    expect(excluded({ id: 'y', name: 'Buy spam now' }, f)).toBe(true)
    expect(excluded({ id: 'y', name: 'Clean' }, f)).toBe(false)
  })
})
