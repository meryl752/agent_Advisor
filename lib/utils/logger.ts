// Utility functions for secure logging with PII anonymization

/**
 * Anonymize email addresses for logging
 * Example: john.doe@example.com → joh***@example.com
 */
export function anonymizeEmail(email: string | undefined | null): string {
  if (!email) return '[no-email]'
  
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  
  const visibleChars = Math.min(3, local.length)
  return `${local.substring(0, visibleChars)}***@${domain}`
}

/**
 * Anonymize user IDs (Clerk IDs, UUIDs) for logging
 * Example: user_2abc123def456 → user_2ab***
 * Example: 550e8400-e29b-41d4-a716-446655440000 → 550e840***
 */
export function anonymizeId(id: string | undefined | null): string {
  if (!id) return '[no-id]'
  
  // For Clerk IDs (format: user_xxxxx)
  if (id.startsWith('user_')) {
    return `${id.substring(0, 8)}***`
  }
  
  // For UUIDs or other IDs
  const visibleChars = Math.min(8, id.length)
  return `${id.substring(0, visibleChars)}***`
}

/**
 * Anonymize any sensitive string for logging
 * Shows first 3 characters only
 */
export function anonymizeString(str: string | undefined | null): string {
  if (!str) return '[empty]'
  if (str.length <= 3) return '***'
  return `${str.substring(0, 3)}***`
}

/**
 * Safe logger that automatically anonymizes common PII patterns
 */
export const secureLog = {
  info: (message: string, data?: Record<string, any>) => {
    console.log(message, data ? sanitizeLogData(data) : '')
  },
  warn: (message: string, data?: Record<string, any>) => {
    console.warn(message, data ? sanitizeLogData(data) : '')
  },
  error: (message: string, data?: Record<string, any>) => {
    console.error(message, data ? sanitizeLogData(data) : '')
  }
}

function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    
    if (lowerKey.includes('email')) {
      sanitized[key] = anonymizeEmail(value as string)
    } else if (lowerKey.includes('id') || lowerKey.includes('uuid')) {
      sanitized[key] = anonymizeId(value as string)
    } else if (lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('password')) {
      sanitized[key] = '***REDACTED***'
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
