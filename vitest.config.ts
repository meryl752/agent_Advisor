import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

/** Appels réseau LLM / orchestrateur — à lancer avec RUN_LIVE_LLM_TESTS=1 (ex. avant release) */
const liveLlmTestGlobs =
  process.env.RUN_LIVE_LLM_TESTS === '1'
    ? []
    : [
        'lib/agents/__tests__/orchestrator.integration.test.ts',
        'lib/agents/__tests__/relevance.eval.test.ts',
        'lib/agents/__tests__/single-eval.test.ts',
        'lib/llm/router.test.ts',
        'lib/agents/stackBuilder.test.ts',
      ]

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    testTimeout: 30000, // 30s timeout for PBT tests
    exclude: ['**/node_modules/**', '**/dist/**', ...liveLlmTestGlobs],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
