import { describe, it, expect } from 'vitest'
import { buildAgentDocumentText } from './buildAgentDocumentText'

describe('buildAgentDocumentText', () => {
  it('inclut catégorie, cas d’usage, idéal pour, à éviter', () => {
    const t = buildAgentDocumentText({
      name: 'TestTool',
      category: 'automation',
      description: 'Automatise les tâches.',
      use_cases: ['Sync CRM', 'Alertes Slack'],
      best_for: ['PME', 'équipes marketing'],
      not_for: ['besoin air-gap'],
    })
    expect(t).toContain('TestTool')
    expect(t).toContain('Catégorie produit: automation')
    expect(t).toContain('Sync CRM')
    expect(t).toContain('Idéal pour:')
    expect(t).toContain('À éviter si:')
  })
})
