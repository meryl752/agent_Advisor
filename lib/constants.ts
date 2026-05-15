// ─── Budget & Context Maps ────────────────────────────────────────────────────
// Single source of truth — used by queryAnalyzer, matcher, orchestrator, stackBuilder

export const BUDGET_MAP: Record<string, number> = {
  zero: 0,
  low: 50,
  medium: 200,
  high: 1000,
}

export const DIFFICULTY_ALLOWED: Record<string, string[]> = {
  beginner:     ['easy'],
  intermediate: ['easy', 'medium'],
  advanced:     ['easy', 'medium', 'hard'],
}

export const VALID_CATEGORIES = [
  'copywriting', 'image', 'automation', 'analytics',
  'customer_service', 'seo', 'prospecting', 'coding',
  'research', 'video', 'website',
] as const

export type AgentCategory = typeof VALID_CATEGORIES[number]



export const COLORS = {
  bg: '#080808',
  bg2: '#0d0d0d',
  bg3: '#111111',
  accent: '#C8F135',
  accent2: '#ff6b2b',
  accent3: '#38bdf8',
  white: '#f0ede6',
  muted: '#444444',
  muted2: '#666666',
  border: '#1a1a1a',
  border2: '#222222',
} as const

export const ANIMATION = {
  fadeUpDelay: [0.1, 0.2, 0.3, 0.4, 0.5],
  revealDuration: 0.7,
  staggerDelay: 0.08,
  barChartDelay: 800,
} as const

// ─── Pricing Data ─────────────────────────────────────────────────────────────

export const PRICING_TIERS = [
  {
    name: 'Free',
    price: 0,
    description: "To discover Raspquery and validate the value before committing.",
    features: [
      '1 stack recommendation / month',
      'Access to 50 indexed agents',
      'Basic Stack Score',
      'Read-only dashboard',
    ],
    cta: 'Start for free',
    featured: false,
  },
  {
    name: 'Pro',
    price: 19,
    description: "For freelancers and entrepreneurs who want to maximize their AI ROI.",
    features: [
      'Unlimited stacks',
      '200+ indexed agents',
      'Real-time ROI Tracker',
      'Instant Stack Alerts',
      'Full Stack Score',
      'Workflow Visualizer',
    ],
    cta: '14-day free trial →',
    featured: true,
  },
  {
    name: 'Agency',
    price: 79,
    description: "For agencies managing their clients' AI stacks.",
    features: [
      'Everything in Pro',
      'Multi-client management',
      'White-label PDF exports',
      'Unlimited Stack vs Stack',
      'API access',
      'Priority support',
    ],
    cta: "Contact us",
    featured: false,
  },
] as const

// ─── Marquee Items ─────────────────────────────────────────────────────────────

export const MARQUEE_ITEMS = [
  '200+ agents indexed',
  'Real-time ROI tracker',
  'Instant stack alerts',
  'Workflow visualizer',
  'Gamified Stack Score',
  'Free early bird access',
]

// ─── Nav Links ────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'À propos', href: '#about' },
]

// ─── Reasoning Models ──────────────────────────────────────────────────────────
// Shared between backend router and frontend selector

export const SUPPORTED_REASONING_MODELS = [
  { id: 'qwen-235b', name: 'Qwen 3 235B', provider: 'Cerebras', speed: 'Ultra-fast', domain: 'alibaba.com' },
  { id: 'gpt-120b', name: 'GPT-OSS 120B', provider: 'Cerebras', speed: 'Stable', domain: 'openai.com' },
  { id: 'qwen-32b', name: 'Qwen 3 32B', provider: 'Groq', speed: 'Accurate', domain: 'alibaba.com' },
  { id: 'llama-70b', name: 'Llama 3.3 70B', provider: 'Groq', speed: 'Versatile', domain: 'meta.com' },
  { id: 'gemini-flash', name: 'Gemini 2.5 Flash', provider: 'Google', speed: 'Reliable', domain: 'google.com' },
] as const

export type ReasoningModelId = typeof SUPPORTED_REASONING_MODELS[number]['id']
