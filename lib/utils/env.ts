/**
 * Assert that required environment variables are present.
 * Fails fast at startup instead of failing later with cryptic errors.
 */
export function assertEnv(keys: string[]): void {
  const missing = keys.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Check your .env.local or Vercel environment settings.`
    )
  }
}

/**
 * Get a required env var, throwing if missing.
 */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}
