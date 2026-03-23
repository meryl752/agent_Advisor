// ─── Design Tokens ────────────────────────────────────────────────────────────

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
    description: "Pour découvrir StackAI et valider la valeur avant de t'engager.",
    features: [
      '1 recommandation de stack / mois',
      'Accès à 50 agents indexés',
      'Stack Score basique',
      'Dashboard lecture seule',
    ],
    cta: 'Commencer gratuitement',
    featured: false,
  },
  {
    name: 'Pro',
    price: 19,
    description: "Pour les freelances et entrepreneurs qui veulent maximiser leur ROI IA.",
    features: [
      'Stacks illimités',
      '200+ agents indexés',
      'ROI Tracker temps réel',
      'Stack Alerts instantanées',
      'Stack Score complet',
      'Workflow Visualizer',
    ],
    cta: 'Essai 14 jours gratuit →',
    featured: true,
  },
  {
    name: 'Agency',
    price: 79,
    description: "Pour les agences qui gèrent les stacks IA de leurs clients.",
    features: [
      'Tout le plan Pro',
      'Gestion multi-clients',
      'Exports PDF marque blanche',
      'Stack vs Stack illimité',
      'API access',
      'Support prioritaire',
    ],
    cta: "Contacter l'équipe",
    featured: false,
  },
] as const

// ─── Marquee Items ─────────────────────────────────────────────────────────────

export const MARQUEE_ITEMS = [
  '200+ agents indexés',
  'ROI tracker temps réel',
  'Stack alerts instantanées',
  'Workflow visualizer',
  'Stack Score gamifié',
  'Accès early bird gratuit',
]

// ─── Nav Links ────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'À propos', href: '#about' },
]
