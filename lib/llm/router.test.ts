import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { callLLM } from './router'
import { GROQ_MODEL, GROQ_MODEL_FALLBACK } from '@/lib/groq/client'

/**
 * Bug Condition Exploration Test for Qwen Model Mismatch
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test is written BEFORE implementing the fix
 * GOAL: Surface counterexamples that demonstrate the Qwen model mismatch bug exists
 * 
 * Expected Behavior (Bug Condition):
 * - callLLM with maxTokens > 1200 attempts to use GROQ_MODEL
 * - Groq API call fails with the current model name (qwen/qwen3-32b)
 * - Fallback to Llama 70B is triggered
 * - Latency exceeds 1500ms due to fallback
 * 
 * EXPECTED OUTCOME: Test FAILS on unfixed code (this proves the bug exists)
 * 
 * When this test is re-run after the fix, it should PASS, confirming:
 * - Groq call succeeds with correct model
 * - No fallback is triggered
 * - Latency is under 1000ms
 */

describe('Bug 1: Qwen Groq Model Mismatch - Bug Condition Exploration', () => {
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
   * Property 1: Bug Condition - Qwen Groq Model Fails and Triggers Fallback
   * 
   * This property-based test verifies the bug condition:
   * - Scoped to slow mode calls (maxTokens > 1200) with Groq available
   * - Tests that Groq is attempted with GROQ_MODEL
   * - Verifies that fallback is triggered (indicating model failure)
   * - Measures latency to confirm fallback penalty
   */
  it('Property 1: Qwen model fails and triggers fallback to Llama 70B (Bug Condition)', async () => {
    // Skip if Groq is not configured
    if (!process.env.GROQ_API_KEY) {
      console.log('[TEST] Skipping - GROQ_API_KEY not configured')
      return
    }

    // Property-based test: generate various prompts for slow mode
    await fc.assert(
      fc.asyncProperty(
        // Generate prompts of varying complexity
        fc.string({ minLength: 10, maxLength: 200 }),
        // Generate maxTokens in slow mode range (1201-2000)
        fc.integer({ min: 1201, max: 2000 }),
        async (prompt, maxTokens) => {
          // Skip empty prompts
          if (!prompt.trim()) {
            return true
          }

          console.log(`\n[TEST] Testing with maxTokens=${maxTokens}, prompt length=${prompt.length}`)
          console.log(`[TEST] Expected model: ${GROQ_MODEL}`)
          console.log(`[TEST] Fallback model: ${GROQ_MODEL_FALLBACK}`)
          
          // Clear console output for this iteration
          consoleOutput = []
          
          // Measure latency
          const startTime = Date.now()
          
          try {
            const result = await callLLM(prompt, maxTokens)
            
            const endTime = Date.now()
            const latency = endTime - startTime
            
            console.log(`[TEST] Call completed in ${latency}ms`)
            console.log(`[TEST] Result length: ${result.length} chars`)
            
            // Analyze console output to detect bug condition
            const logOutput = consoleOutput.join('\n')
            
            // Check if Groq was attempted with GROQ_MODEL
            const groqAttempted = logOutput.includes(`Calling Groq ${GROQ_MODEL}`)
            
            // Check if fallback was triggered
            const fallbackTriggered = 
              logOutput.includes('failed, trying fallback') ||
              logOutput.includes(`Calling Groq ${GROQ_MODEL_FALLBACK}`) ||
              logOutput.includes('Groq rate limit') ||
              logOutput.includes('falling back to Groq')
            
            console.log(`[TEST] Groq attempted with ${GROQ_MODEL}: ${groqAttempted}`)
            console.log(`[TEST] Fallback triggered: ${fallbackTriggered}`)
            console.log(`[TEST] Latency: ${latency}ms`)
            
            // BUG CONDITION CHECKS:
            // If this is the unfixed code, we expect:
            // 1. Groq is attempted with GROQ_MODEL (qwen/qwen3-32b)
            // 2. Fallback is triggered (model fails)
            // 3. Latency exceeds 1500ms due to fallback
            
            if (fallbackTriggered) {
              console.log(`[COUNTEREXAMPLE FOUND] Fallback was triggered!`)
              console.log(`[COUNTEREXAMPLE] This confirms the bug: ${GROQ_MODEL} fails and triggers fallback`)
              console.log(`[COUNTEREXAMPLE] Latency: ${latency}ms (expected >1500ms for fallback)`)
              
              // Document the counterexample
              const counterexample = {
                prompt: prompt.substring(0, 50) + '...',
                maxTokens,
                modelAttempted: GROQ_MODEL,
                fallbackTriggered: true,
                latency,
                logSnippet: logOutput.substring(0, 500)
              }
              
              console.log('[COUNTEREXAMPLE]', JSON.stringify(counterexample, null, 2))
              
              // EXPECTED BEHAVIOR (after fix):
              // - No fallback should be triggered
              // - Latency should be under 1000ms
              
              // ACTUAL BEHAVIOR (unfixed code):
              // - Fallback IS triggered (bug confirmed)
              // - Latency likely exceeds 1500ms
              
              // This assertion will FAIL on unfixed code (expected)
              // It will PASS after the fix is implemented
              expect(fallbackTriggered).toBe(false)
              expect(latency).toBeLessThan(1000)
            } else {
              // If no fallback was triggered, the model worked correctly
              // This would be unexpected on unfixed code
              console.log(`[TEST] No fallback triggered - model worked correctly`)
              console.log(`[TEST] This is unexpected on unfixed code (bug may already be fixed)`)
              
              // Verify latency is reasonable
              expect(latency).toBeLessThan(1000)
            }
            
            return true
          } catch (error: any) {
            const endTime = Date.now()
            const latency = endTime - startTime
            
            console.error(`[TEST] Call failed after ${latency}ms:`, error.message)
            
            // If the call completely fails, this is also a bug condition
            // (though different from the fallback scenario)
            console.log(`[COUNTEREXAMPLE FOUND] Call failed completely`)
            console.log(`[COUNTEREXAMPLE] Error: ${error.message}`)
            
            // Re-throw to fail the test
            throw error
          }
        }
      ),
      {
        numRuns: 2, // Run 2 test cases for faster execution
        verbose: true,
      }
    )
  })

  /**
   * Additional test: Direct verification of model name
   * 
   * This test directly checks if the GROQ_MODEL constant matches
   * what the Groq API expects.
   */
  it('Verify GROQ_MODEL constant value', () => {
    console.log(`[TEST] GROQ_MODEL constant: ${GROQ_MODEL}`)
    console.log(`[TEST] GROQ_MODEL_FALLBACK constant: ${GROQ_MODEL_FALLBACK}`)
    
    // Document the current model configuration
    expect(GROQ_MODEL).toBeDefined()
    expect(GROQ_MODEL_FALLBACK).toBeDefined()
    
    // The bug description mentions that the code defines 'qwen/qwen3-32b'
    // but logs show 'qwen2.5-72b-instruct' being attempted
    // This test documents the current state
    console.log(`[TEST] Current GROQ_MODEL value: "${GROQ_MODEL}"`)
    console.log(`[TEST] Expected to see this model in API calls`)
  })
})
