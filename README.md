# Raspquery — AI Stack Recommender

Plateforme SaaS qui recommande les stacks d'agents IA optimaux selon le contexte métier de l'utilisateur (objectif, secteur, budget, niveau technique).

## Stack technique

| Couche | Tech |
|--------|------|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript strict |
| Styles | Tailwind CSS + Framer Motion |
| Auth | Clerk |
| Base de données | Supabase (PostgreSQL + pgvector) |
| Cache / Rate-limit | Upstash Redis |
| LLM principal | Groq (Llama 4 Scout / Llama 3.3 70B) |
| LLM fallback | Gemini Flash-Lite |
| Embeddings | Jina AI v3 (1024 dimensions) |
| Paiements | Stripe |
| Monitoring | Sentry |
| Tests | Vitest |

## Démarrage rapide

```bash
npm install
cp .env.example .env.local
# Remplir les variables dans .env.local
npm run dev
# → http://localhost:3000
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` et remplir toutes les valeurs.

Variables **requises** pour le fonctionnement de base :

```env
# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM — au moins un des deux requis
GROQ_API_KEY=
GEMINI_API_KEY=

# Embeddings — requis pour la recherche vectorielle
JINA_API_KEY=
```

Variables **optionnelles** :

```env
ANTHROPIC_API_KEY=          # Claude (si activé dans llm/router)
UPSTASH_REDIS_REST_URL=     # Rate limiting
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=          # Paiements
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SENTRY_DSN=     # Monitoring
```

## Architecture

```
app/
├── api/                    # 17 groupes de routes API
│   ├── recommend/          # Pipeline principal de recommandation
│   ├── chat/               # Chat streaming (Groq)
│   ├── stacks/[id]/        # CRUD stacks
│   ├── conversations/      # Historique sessions
│   ├── stripe/             # Checkout, portal, webhook
│   ├── auth/webhook/       # Sync Clerk → Supabase
│   └── ...
├── dashboard/              # Pages protégées (post-login)
├── onboarding/             # Flow d'onboarding
└── (landing)/              # Page publique

lib/
├── agents/                 # Moteur de recommandation
│   ├── orchestrator.ts     # Pipeline 5 étapes
│   ├── matcher.ts          # Scoring hybride RRF
│   ├── queryAnalyzer.ts    # Analyse LLM (2 passes)
│   └── stackBuilder.ts     # Construction stack via LLM
├── llm/router.ts           # Routing multi-provider (Groq → Gemini)
├── embeddings/service.ts   # Jina AI avec retry exponentiel
├── supabase/               # Clients, queries, mémoire utilisateur
├── rate-limit/             # Redis + Upstash
└── validators/api.ts       # Schémas Zod pour toutes les routes

supabase/
├── migrations/             # Migrations SQL versionnées
└── scripts/                # Scripts ad-hoc (non-versionnés)

scripts/                    # Scripts Node.js (enrichissement DB, embeddings)
docs/                       # Documentation technique interne
```

## Pipeline de recommandation

1. **Analyse** — 2 passes LLM : décomposition en sous-tâches + regroupement en domaines fonctionnels
2. **Embedding** — Jina AI v3 (1024 dims) sur le texte enrichi (objectif + secteur + catégories)
3. **Recherche vectorielle** — RPC Supabase `smart_search_agents_v2` (HNSW index, 40 agents)
4. **Scoring hybride RRF** — Reciprocal Rank Fusion : classement vectoriel × score métier (catégorie, use_cases, best_for, intégrations, budget)
5. **Construction du stack** — LLM (4000 tokens) avec validation anti-redondance

## Rate Limiting

| Plan | Limite | Période |
|------|--------|---------|
| Free | 10 requêtes | 30 jours |
| Pro | 50 requêtes | 1 heure |
| Agency | 200 requêtes | 1 heure |

Pour désactiver en développement : `RATE_LIMIT_ENABLED=false`

Health check Redis : `GET /api/health/rate-limit`

## Tests

```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

## Scripts utilitaires

```bash
# Générer les embeddings pour les agents sans vecteur
JINA_API_KEY=... node -r dotenv/config scripts/generate_embeddings.mjs

# Valider la qualité des agents en DB
node scripts/analyze-db-quality.mjs
```
