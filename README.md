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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
```
