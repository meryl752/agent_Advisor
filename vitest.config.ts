import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    testTimeout: 30000, // 30s timeout for PBT tests
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
