# Résumé des corrections appliquées

## 1. Configuration Next.js - Images externes
**Fichier**: `next.config.js`
- Ajout de `remotePatterns` pour autoriser les images de `img.logo.dev`, `img.clerk.com`, et `*.supabase.co`

## 2. Externalisation du token Logo.dev
**Fichiers**: `lib/utils/logo.ts`, `.env.example`, 6 composants
- Création d'un helper `getLogoUrl()` pour centraliser la génération d'URLs Logo.dev
- Ajout de `NEXT_PUBLIC_LOGO_DEV_TOKEN` dans `.env.example`
- Mise à jour des composants: `AgentCard`, `StackFlow`, `StackList`, `Hero`, `Features`

## 3. Validation Zod des API routes
**Fichiers**: `lib/validators/api.ts`, `app/api/recommend/route.ts`, `app/api/waitlist/route.ts`
- Ajout de `zod@3.23.8` dans `package.json`
- Création de schémas Zod pour valider les entrées utilisateur
- Protection contre les injections et données malformées

## 4. Correction fuite mémoire - "JavaScript heap out of memory"
**Fichiers**: `lib/llm/router.ts`, `lib/gemini/recommender.ts`, `lib/agents/orchestrator.ts`, `package.json`
- Ajout de timeouts (30s pour LLM, 120s global orchestrator)
- Augmentation RAM Node.js à 4GB (`--max-old-space-size=4096`)
- Nettoyage mémoire après parsing JSON
- Suppression de logs verbeux
- Documentation: `MEMORY_LEAK_FIX.md`

## 5. Synchronisation Clerk ↔ Supabase
**Fichiers**: `lib/supabase/queries.ts`, `app/dashboard/page.tsx`, `app/api/recommend/route.ts`, `.env.local`, `.env.example`
- Ajout de `SUPABASE_SERVICE_ROLE_KEY` (corrigé depuis `SERVICE_ROLE SECRET`)
- Création de `ensureUserExists()` pour auto-créer les utilisateurs manquants
- Récupération de l'email depuis Clerk et passage à `ensureUserExists()`
- Webhook Clerk déjà configuré dans `app/api/auth/webhook/route.ts`
- Documentation: `SUPABASE_SETUP.md`

## 6. Correction erreur "invalid input syntax for type uuid"
**Fichiers**: `lib/supabase/queries.ts`
- Changement de `getUserStacks()` et `saveStack()` pour utiliser `supabaseService` (service_role key)
- Contournement des problèmes JWT Clerk → UUID Supabase
- Ajout de logs détaillés pour debug conversion Clerk ID → UUID

## 7. Correction erreur build Vercel - "GROQ_API_KEY environment variable is missing"
**Fichiers**: `lib/groq/client.ts`, `lib/gemini/client.ts`, `lib/llm/router.ts`, `lib/gemini/recommender.ts`
- **Problème**: Les clients LLM s'initialisaient au moment de l'import du module, avant que les variables d'environnement ne soient disponibles pendant la phase de build
- **Solution**: Implémentation de l'initialisation lazy (paresseuse)
  - Création de `getGroqClient()` qui initialise le client Groq seulement quand nécessaire
  - Création de `getGeminiClient()` qui initialise le client Gemini seulement quand nécessaire
  - Les clients retournent `null` si la clé API n'est pas configurée (au lieu de crasher)
  - Mise à jour de tous les fichiers utilisant ces clients pour appeler les fonctions getter
- **Résultat**: Le build Vercel passe maintenant sans erreur, même sans les clés API configurées pendant la phase de build

---

## Notes importantes
- ⚠️ Ne JAMAIS commit `.env.local` (contient des clés API sensibles)
- ✅ Le projet est déployé sur Vercel
- ✅ Toutes les variables d'environnement doivent être configurées dans le dashboard Vercel
- ✅ Le build local fonctionne: `npm run build` passe sans erreur
