# StackAI — SaaS Frontend

Landing page Next.js 14 pour StackAI, la plateforme qui recommande les stacks IA optimaux.

## Stack technique

| Couche | Tech |
|--------|------|
| Framework | Next.js 14 (App Router) |
| Styles | Tailwind CSS + CSS Variables |
| Animations | Framer Motion |
| Types | TypeScript |
| Fonts | Syne · DM Mono · DM Sans (next/font) |

## Démarrage rapide

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Structure du projet

```
stackai/
├── app/
│   ├── components/
│   │   ├── layout/       # Navigation, Marquee, Footer
│   │   ├── sections/     # Hero, Features, Pricing, CTA
│   │   ├── mockups/      # Dashboard, Charts, Alerts...
│   │   └── ui/           # RevealWrapper, WaitlistForm
│   ├── api/waitlist/     # POST endpoint waitlist
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── constants.ts      # Design tokens, data statique
│   ├── utils.ts          # cn(), validateEmail()
│   └── data/
│       └── mockAgents.ts # TODO: remplacer par Supabase
├── types/
│   └── index.ts          # Agent, StackRecommendation, etc.
└── tailwind.config.ts
```

## Prochaines étapes

1. **Supabase** — connecter `lib/data/mockAgents.ts` à une vraie DB
2. **Auth** — ajouter Clerk pour l'authentification
3. **Algorithm** — implémenter le moteur hybride rule-based + Claude API
4. **Stripe** — intégrer les paiements pour les plans Pro et Agency
5. **Dashboard** — pages protégées post-login

## Variables d'environnement

```env
# À créer dans .env.local

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM Providers
GEMINI_API_KEY=
GROQ_API_KEY=

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_ENABLED=true

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Rate Limiting

L'API `/api/recommend` est protégée par un système de rate limiting basé sur Upstash Redis.

### Limites par tier

| Plan | Limite | Période |
|------|--------|---------|
| Free | 1 requête | 30 jours |
| Pro | 10 requêtes | 1 heure |
| Agency | 50 requêtes | 1 heure |

### Headers de réponse

Toutes les réponses incluent les headers suivants :

- `X-RateLimit-Limit`: Nombre maximum de requêtes autorisées
- `X-RateLimit-Remaining`: Nombre de requêtes restantes
- `X-RateLimit-Reset`: Timestamp Unix de réinitialisation du compteur

### Erreur 429 (Rate Limit Exceeded)

Quand la limite est atteinte, l'API retourne :

```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded for free tier: 1 request per 30 days",
  "limit": 1,
  "remaining": 0,
  "reset": "2024-01-31T12:00:00.000Z",
  "retryAfter": 2592000
}
```

Header additionnel : `Retry-After` (secondes avant de pouvoir réessayer)

### Configuration

Pour désactiver le rate limiting (développement uniquement) :

```env
RATE_LIMIT_ENABLED=false
```

### Health Check

Vérifier l'état du rate limiting :

```bash
GET /api/health/rate-limit
```

Réponse :
```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```
