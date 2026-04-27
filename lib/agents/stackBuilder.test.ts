import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { buildStack } from './stackBuilder'
import type { UserContext, AnalyzedQuery, ScoredAgent, FinalStack } from './types'

/**
 * Bug Condition Exploration Test for Redundant Recommendations
 * 
 * **Validates: Requirements 1.4, 1.5, 1.6**
 * 
 * CRITICAL: This test is written BEFORE implementing the fix
 * GOAL: Surface counterexamples that demonstrate the redundancy bug exists
 * 
 * Expected Behavior (Bug Condition):
 * - User objective "envoyer des séquences d'emails personnalisées automatiquement"
 * - Final stack contains BOTH Lavender AND Outreach (both do email sequences)
 * - This violates RÈGLE 8 (anti-redundancy rule)
 * 
 * EXPECTED OUTCOME: Test FAILS on unfixed code (this proves the bug exists)
 * 
 * When this test is re-run after the fix, it should PASS, confirming:
 * - At most ONE email sequence tool is recommended
 * - No functional overlap in the final stack
 */

describe('Bug 2: Redundant Recommendations - Bug Condition Exploration', () => {
  // Store original console methods
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error
  
  // Track console output for analysis
  let consoleOutput: string[] = []
  
  beforeEach(() => {
    consoleOutput = []
    
    // Capture console output
    console.log = (...args: any[]) => {
      consoleOutput.push(args.join(' '))
      originalConsoleLog(...args)
    }
    console.warn = (...args: any[]) => {
      consoleOutput.push('[WARN] ' + args.join(' '))
      originalConsoleWarn(...args)
    }
    console.error = (...args: any[]) => {
      consoleOutput.push('[ERROR] ' + args.join(' '))
      originalConsoleError(...args)
    }
  })
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog
    console.warn = originalConsoleWarn
    console.error = originalConsoleError
  })

  /**
   * Helper function to check if two agents have functional overlap
   * Based on the design document's examples of overlapping tools
   */
  function hasFunctionalOverlap(agent1Name: string, agent2Name: string): boolean {
    // Known overlapping pairs from design document
    const EMAIL_SEQUENCE_TOOLS = ['Lavender', 'Outreach', 'Lemlist', 'Instantly']
    const IDE_TOOLS = ['Cursor', 'GitHub Copilot', 'Codeium']
    const SEO_TOOLS = ['Ahrefs', 'Semrush', 'Moz']
    const PRODUCT_RESEARCH_TOOLS = ['Minea', 'Sell The Trend', 'Dropship.io']
    
    // Check if both agents are in the same functional category
    if (EMAIL_SEQUENCE_TOOLS.includes(agent1Name) && EMAIL_SEQUENCE_TOOLS.includes(agent2Name)) {
      return true
    }
    if (IDE_TOOLS.includes(agent1Name) && IDE_TOOLS.includes(agent2Name)) {
      return true
    }
    if (SEO_TOOLS.includes(agent1Name) && SEO_TOOLS.includes(agent2Name)) {
      return true
    }
    if (PRODUCT_RESEARCH_TOOLS.includes(agent1Name) && PRODUCT_RESEARCH_TOOLS.includes(agent2Name)) {
      return true
    }
    
    return false
  }

  /**
   * Property 1: Bug Condition - Multiple Tools with Same Primary Function Are Recommended
   * 
   * This property-based test verifies the bug condition:
   * - Scoped to user objectives that explicitly request a single function (e.g., "email sequences")
   * - Tests that the final stack contains multiple tools with the same primary function
   * - Verifies that both tools are in the same functional category
   */
  it('Property 1: Multiple email sequence tools are recommended together (Bug Condition)', async () => {
    // Skip if LLM API keys are not configured
    if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.log('[TEST] Skipping - No LLM API keys configured')
      return
    }

    // Property-based test: generate various email sequence objectives
    await fc.assert(
      fc.asyncProperty(
        // Generate variations of email sequence objectives
        fc.constantFrom(
          'envoyer des séquences d\'emails personnalisées automatiquement',
          'automatiser mes séquences d\'emails de prospection',
          'créer des campagnes d\'emails automatisées pour la prospection',
          'mettre en place des séquences d\'emails personnalisées',
          'automatiser l\'envoi d\'emails de prospection personnalisés'
        ),
        async (objective) => {
          console.log(`\n[TEST] Testing with objective: "${objective}"`)
          
          // Create user context
          const ctx: UserContext = {
            objective,
            sector: 'B2B SaaS',
            team_size: 'small',
            budget: 'medium',
            tech_level: 'intermediate',
            timeline: 'weeks',
            current_tools: []
          }
          
          // Create analyzed query (simulating queryAnalyzer output)
          const query: AnalyzedQuery = {
            original: objective,
            domains: [{
              name: 'Email Prospection',
              priority: 1,
              subtasks: [{
                id: 'd1_t1',
                action: 'Envoyer des séquences d\'emails personnalisées',
                required_category: 'prospecting',
                depends_on: [],
                can_be_automated: true
              }]
            }],
            implicit_constraints: [],
            sector_context: 'B2B SaaS nécessite des emails personnalisés et automatisés',
            budget_max: 500,
            subtasks: ['Envoyer des séquences d\'emails personnalisées'],
            required_categories: ['prospecting']
          }
          
          // Create candidate agents including BOTH Lavender and Outreach
          // These are the two tools that should NOT be recommended together
          const candidates: ScoredAgent[] = [
            {
              id: '082779df-d243-40a3-9182-69f862fa68bb',
              name: 'Lavender',
              category: 'prospecting',
              description: 'Coach IA pour améliorer tes emails de prospection en temps réel.',
              price_from: 29,
              score: 85,
              roi_score: 90,
              use_cases: ['email', 'prospecting', 'sequences'],
              compatible_with: ['gmail', 'outlook'],
              best_for: ['SDR', 'sales teams'],
              integrations: ['gmail', 'outlook', 'salesloft'],
              website_domain: 'lavender.ai',
              setup_difficulty: 'easy',
              time_to_value: 'quelques heures',
              similarity: 0.85,
              relevance_score: 90,
              relevance_reason: 'Optimisé pour les emails de prospection personnalisés'
            },
            {
              id: 'a3965326-bd66-47dd-8a0c-64cb131a0674',
              name: 'Outreach',
              category: 'prospecting',
              description: 'Plateforme d\'exécution des ventes avec IA pour gérer pipelines, séquences et coaching.',
              price_from: 100,
              score: 88,
              roi_score: 85,
              use_cases: ['email', 'prospecting', 'sequences', 'sales'],
              compatible_with: ['salesforce', 'hubspot'],
              best_for: ['équipes sales mid-market', 'enterprise'],
              integrations: ['salesforce', 'hubspot', 'linkedin'],
              website_domain: 'outreach.io',
              setup_difficulty: 'medium',
              time_to_value: 'quelques jours',
              similarity: 0.82,
              relevance_score: 88,
              relevance_reason: 'Plateforme complète pour séquences emails et sales engagement'
            },
            // Add some complementary tools (different functions)
            {
              id: 'complementary-1',
              name: 'Lusha',
              category: 'prospecting',
              description: 'Trouver des emails et numéros de téléphone B2B',
              price_from: 39,
              score: 80,
              roi_score: 85,
              use_cases: ['email finding', 'prospecting'],
              compatible_with: ['linkedin', 'salesforce'],
              best_for: ['SDR', 'sales teams'],
              integrations: ['linkedin', 'salesforce'],
              website_domain: 'lusha.com',
              setup_difficulty: 'easy',
              time_to_value: 'immédiat',
              similarity: 0.75,
              relevance_score: 80,
              relevance_reason: 'Extraction d\'emails pour alimenter les séquences'
            },
            {
              id: 'complementary-2',
              name: 'ZeroBounce',
              category: 'prospecting',
              description: 'Vérification et validation d\'emails',
              price_from: 16,
              score: 75,
              roi_score: 80,
              use_cases: ['email verification', 'data quality'],
              compatible_with: [],
              best_for: ['sales teams', 'marketing'],
              integrations: [],
              website_domain: 'zerobounce.net',
              setup_difficulty: 'easy',
              time_to_value: 'immédiat',
              similarity: 0.70,
              relevance_score: 75,
              relevance_reason: 'Vérification d\'emails avant envoi'
            }
          ]
          
          console.log(`[TEST] Candidates include: ${candidates.map(c => c.name).join(', ')}`)
          console.log(`[TEST] Email sequence tools: Lavender, Outreach`)
          
          // Clear console output for this iteration
          consoleOutput = []
          
          try {
            // Call buildStack
            const result = await buildStack(ctx, query, candidates)
            
            if (!result) {
              console.log('[TEST] buildStack returned null - skipping this iteration')
              return true
            }
            
            console.log(`[TEST] Stack generated: "${result.stack_name}"`)
            console.log(`[TEST] Agents in stack: ${result.agents.map(a => a.name).join(', ')}`)
            
            // Check for redundancy: are both Lavender AND Outreach in the stack?
            const agentNames = result.agents.map(a => a.name)
            const hasLavender = agentNames.includes('Lavender')
            const hasOutreach = agentNames.includes('Outreach')
            
            console.log(`[TEST] Has Lavender: ${hasLavender}`)
            console.log(`[TEST] Has Outreach: ${hasOutreach}`)
            
            // BUG CONDITION CHECK:
            // If this is the unfixed code, we expect BOTH tools to be present
            if (hasLavender && hasOutreach) {
              console.log(`[COUNTEREXAMPLE FOUND] Both Lavender and Outreach are in the stack!`)
              console.log(`[COUNTEREXAMPLE] This confirms the bug: redundant email sequence tools`)
              
              // Document the counterexample
              const counterexample = {
                objective,
                stackName: result.stack_name,
                agents: result.agents.map(a => ({ name: a.name, category: a.category, role: a.role })),
                redundantTools: ['Lavender', 'Outreach'],
                totalCost: result.total_cost
              }
              
              console.log('[COUNTEREXAMPLE]', JSON.stringify(counterexample, null, 2))
              
              // EXPECTED BEHAVIOR (after fix):
              // - At most ONE email sequence tool should be present
              // - Either Lavender OR Outreach, but NOT both
              
              // ACTUAL BEHAVIOR (unfixed code):
              // - BOTH Lavender AND Outreach are present (bug confirmed)
              
              // This assertion will FAIL on unfixed code (expected)
              // It will PASS after the fix is implemented
              expect(hasLavender && hasOutreach).toBe(false)
            }
            
            // Additional check: verify no other functional overlaps exist
            const overlappingPairs: Array<[string, string]> = []
            for (let i = 0; i < result.agents.length; i++) {
              for (let j = i + 1; j < result.agents.length; j++) {
                const agent1 = result.agents[i]
                const agent2 = result.agents[j]
                if (hasFunctionalOverlap(agent1.name, agent2.name)) {
                  overlappingPairs.push([agent1.name, agent2.name])
                }
              }
            }
            
            if (overlappingPairs.length > 0) {
              console.log(`[COUNTEREXAMPLE FOUND] Functional overlaps detected:`)
              overlappingPairs.forEach(([name1, name2]) => {
                console.log(`[COUNTEREXAMPLE]   - ${name1} overlaps with ${name2}`)
              })
              
              // This assertion will FAIL on unfixed code (expected)
              expect(overlappingPairs.length).toBe(0)
            } else {
              console.log(`[TEST] No functional overlaps detected - bug may already be fixed`)
            }
            
            return true
          } catch (error: any) {
            console.error(`[TEST] buildStack failed:`, error.message)
            
            // If the call completely fails, this might indicate a different issue
            console.log(`[TEST] Call failed - this might indicate a different issue`)
            
            // Re-throw to fail the test
            throw error
          }
        }
      ),
      {
        numRuns: 3, // Run 3 test cases to increase chance of surfacing the bug
        verbose: true,
      }
    )
  }, 60000) // 60 second timeout for LLM calls

  /**
   * Additional test: Direct verification of anti-redundancy rule
   * 
   * This test directly checks if RÈGLE 8 is present in the prompt
   * and if it's being enforced.
   */
  it('Verify anti-redundancy rule exists in prompt', () => {
    // This is a documentation test - it verifies that the anti-redundancy
    // rule is defined in the stackBuilder prompt
    
    // Read the stackBuilder source to check for RÈGLE 8
    const fs = require('fs')
    const path = require('path')
    const stackBuilderPath = path.join(__dirname, 'stackBuilder.ts')
    const stackBuilderSource = fs.readFileSync(stackBuilderPath, 'utf-8')
    
    // Check if RÈGLE 8 exists
    const hasRegle8 = stackBuilderSource.includes('RÈGLE 8')
    console.log(`[TEST] RÈGLE 8 exists in stackBuilder: ${hasRegle8}`)
    
    // Check if anti-redundancy is mentioned
    const hasAntiRedundancy = stackBuilderSource.toLowerCase().includes('redondance') ||
                              stackBuilderSource.toLowerCase().includes('redundan')
    console.log(`[TEST] Anti-redundancy mentioned: ${hasAntiRedundancy}`)
    
    expect(hasRegle8).toBe(true)
    expect(hasAntiRedundancy).toBe(true)
    
    // Document the current rule
    if (hasRegle8) {
      const regle8Match = stackBuilderSource.match(/RÈGLE 8[^]*?(?=RÈGLE 9|<\/critical_rules>)/s)
      if (regle8Match) {
        console.log('[TEST] Current RÈGLE 8:')
        console.log(regle8Match[0].substring(0, 500) + '...')
      }
    }
  })

  /**
   * Edge case test: Complementary tools should NOT be flagged as redundant
   * 
   * This test verifies that tools with DIFFERENT primary functions
   * are correctly identified as complementary, not redundant.
   */
  it('Edge case: Complementary tools (different functions) should all be recommended', async () => {
    // Skip if LLM API keys are not configured
    if (!process.env.GROQ_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.log('[TEST] Skipping - No LLM API keys configured')
      return
    }

    console.log(`\n[TEST] Testing complementary tools (should NOT be flagged as redundant)`)
    
    // Create user context for a workflow with complementary needs
    const ctx: UserContext = {
      objective: 'extraire des emails + vérifier leur validité + envoyer des séquences personnalisées',
      sector: 'B2B SaaS',
      team_size: 'small',
      budget: 'medium',
      tech_level: 'intermediate',
      timeline: 'weeks',
      current_tools: []
    }
    
    // Create analyzed query with multiple complementary subtasks
    const query: AnalyzedQuery = {
      original: ctx.objective,
      domains: [{
        name: 'Email Workflow',
        priority: 1,
        subtasks: [
          {
            id: 'd1_t1',
            action: 'Extraire des emails de prospects',
            required_category: 'prospecting',
            depends_on: [],
            can_be_automated: true
          },
          {
            id: 'd1_t2',
            action: 'Vérifier la validité des emails',
            required_category: 'prospecting',
            depends_on: ['d1_t1'],
            can_be_automated: true
          },
          {
            id: 'd1_t3',
            action: 'Envoyer des séquences d\'emails personnalisées',
            required_category: 'prospecting',
            depends_on: ['d1_t2'],
            can_be_automated: true
          }
        ]
      }],
      implicit_constraints: [],
      sector_context: 'B2B SaaS nécessite un workflow complet d\'email prospection',
      budget_max: 500,
      subtasks: [
        'Extraire des emails de prospects',
        'Vérifier la validité des emails',
        'Envoyer des séquences d\'emails personnalisées'
      ],
      required_categories: ['prospecting']
    }
    
    // Create candidate agents with COMPLEMENTARY functions
    const candidates: ScoredAgent[] = [
      {
        id: 'complementary-1',
        name: 'Lusha',
        category: 'prospecting',
        description: 'Trouver des emails et numéros de téléphone B2B',
        price_from: 39,
        score: 85,
        roi_score: 90,
        use_cases: ['email finding', 'prospecting'],
        compatible_with: ['linkedin', 'salesforce'],
        best_for: ['SDR', 'sales teams'],
        integrations: ['linkedin', 'salesforce'],
        website_domain: 'lusha.com',
        setup_difficulty: 'easy',
        time_to_value: 'immédiat',
        similarity: 0.85,
        relevance_score: 90,
        relevance_reason: 'Extraction d\'emails pour alimenter les séquences'
      },
      {
        id: 'complementary-2',
        name: 'ZeroBounce',
        category: 'prospecting',
        description: 'Vérification et validation d\'emails',
        price_from: 16,
        score: 80,
        roi_score: 85,
        use_cases: ['email verification', 'data quality'],
        compatible_with: [],
        best_for: ['sales teams', 'marketing'],
        integrations: [],
        website_domain: 'zerobounce.net',
        setup_difficulty: 'easy',
        time_to_value: 'immédiat',
        similarity: 0.80,
        relevance_score: 85,
        relevance_reason: 'Vérification d\'emails avant envoi'
      },
      {
        id: 'a3965326-bd66-47dd-8a0c-64cb131a0674',
        name: 'Outreach',
        category: 'prospecting',
        description: 'Plateforme d\'exécution des ventes avec IA pour gérer pipelines, séquences et coaching.',
        price_from: 100,
        score: 88,
        roi_score: 85,
        use_cases: ['email', 'prospecting', 'sequences', 'sales'],
        compatible_with: ['salesforce', 'hubspot'],
        best_for: ['équipes sales mid-market', 'enterprise'],
        integrations: ['salesforce', 'hubspot', 'linkedin'],
        website_domain: 'outreach.io',
        setup_difficulty: 'medium',
        time_to_value: 'quelques jours',
        similarity: 0.82,
        relevance_score: 88,
        relevance_reason: 'Plateforme complète pour séquences emails et sales engagement'
      }
    ]
    
    console.log(`[TEST] Candidates: ${candidates.map(c => c.name).join(', ')}`)
    console.log(`[TEST] These tools have DIFFERENT primary functions:`)
    console.log(`[TEST]   - Lusha: email extraction`)
    console.log(`[TEST]   - ZeroBounce: email verification`)
    console.log(`[TEST]   - Outreach: email sequences`)
    
    try {
      const result = await buildStack(ctx, query, candidates)
      
      if (!result) {
        console.log('[TEST] buildStack returned null - test inconclusive')
        return
      }
      
      console.log(`[TEST] Stack generated: "${result.stack_name}"`)
      console.log(`[TEST] Agents in stack: ${result.agents.map(a => a.name).join(', ')}`)
      
      const agentNames = result.agents.map(a => a.name)
      const hasLusha = agentNames.includes('Lusha')
      const hasZeroBounce = agentNames.includes('ZeroBounce')
      const hasOutreach = agentNames.includes('Outreach')
      
      console.log(`[TEST] Has Lusha (extraction): ${hasLusha}`)
      console.log(`[TEST] Has ZeroBounce (verification): ${hasZeroBounce}`)
      console.log(`[TEST] Has Outreach (sequences): ${hasOutreach}`)
      
      // EXPECTED BEHAVIOR:
      // All three tools should be present because they have DIFFERENT functions
      // This is NOT redundancy - it's a complementary workflow
      
      // Count how many of the complementary tools are present
      const complementaryCount = [hasLusha, hasZeroBounce, hasOutreach].filter(Boolean).length
      
      console.log(`[TEST] Complementary tools present: ${complementaryCount}/3`)
      
      // We expect at least 2 of the 3 complementary tools to be present
      // (budget constraints might prevent all 3)
      if (complementaryCount >= 2) {
        console.log(`[TEST] ✅ Complementary tools are correctly recommended together`)
      } else {
        console.log(`[TEST] ⚠️ Only ${complementaryCount} complementary tools recommended`)
        console.log(`[TEST] This might indicate over-aggressive redundancy filtering`)
      }
      
      // This test should PASS on both unfixed and fixed code
      // because complementary tools should never be filtered as redundant
      expect(complementaryCount).toBeGreaterThanOrEqual(2)
      
    } catch (error: any) {
      console.error(`[TEST] buildStack failed:`, error.message)
      throw error
    }
  }, 60000) // 60 second timeout for LLM calls
})
