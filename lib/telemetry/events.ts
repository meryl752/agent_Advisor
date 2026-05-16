/** Stable product event names — do not rename once in production. */
export const PRODUCT_EVENTS = {
  SESSION_STARTED: 'session.started',
  CHAT_MESSAGE_SENT: 'chat.message_sent',
  STACK_GENERATION_STARTED: 'stack.generation_started',
  STACK_GENERATION_COMPLETED: 'stack.generation_completed',
  STACK_GENERATION_FAILED: 'stack.generation_failed',
  RECOMMENDATION_RATED: 'recommendation.rated',
  STACK_DIGEST_TOGGLED: 'stack.digest_toggled',
  STACK_SCORE_COMPUTED: 'stack.score_computed',
} as const

export type ProductEventName = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS]

export type ProductEventSource = 'web' | 'api' | 'cron'
