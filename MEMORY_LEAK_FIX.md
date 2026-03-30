# Memory Leak Fix - StackAI

## Problème résolu

Le serveur Node.js crashait avec "JavaScript heap out of memory" après quelques requêtes.

## Causes identifiées

1. **Pas de timeout sur les appels LLM** - Les requêtes Gemini/Groq pouvaient bloquer indéfiniment
2. **Pas de limite mémoire Node.js** - Par défaut ~1.5GB, insuffisant pour les LLM
3. **Accumulation de logs console.log** - Mémoire non libérée
4. **Utilisateurs Clerk non synchronisés avec Supabase** - Erreurs répétées

## Corrections appliquées

### 1. Timeout sur tous les appels LLM (30s max)
- `lib/llm/router.ts` - Timeout global + retry logic
- `lib/gemini/recommender.ts` - Timeout sur refineWithGemini
- `lib/agents/orchestrator.ts` - Timeout global orchestration (120s)

### 2. Augmentation limite mémoire Node.js
- `package.json` - `NODE_OPTIONS='--max-old-space-size=4096'` (4GB)

### 3. Auto-création utilisateurs Supabase
- `lib/supabase/queries.ts` - Fonction `ensureUserExists()` crée automatiquement l'utilisateur si manquant

### 4. Nettoyage mémoire
- Suppression des console.log verbeux dans l'orchestrateur
- Nettoyage explicite des grandes chaînes après parsing JSON

## Comment tester

```bash
# Redémarrer le serveur avec les nouvelles limites
npm run dev

# Le serveur devrait maintenant:
# - Timeout après 30s par appel LLM
# - Timeout après 120s pour l'orchestration complète
# - Créer automatiquement les utilisateurs manquants
# - Utiliser jusqu'à 4GB de RAM avant de crasher
```

## Monitoring

Surveiller ces logs:
- `❌ [Orchestrator] Global timeout after 120s` - L'orchestration prend trop de temps
- `LLM timeout` - Un appel LLM a dépassé 30s
- `✅ Auto-created user for Clerk ID: xxx` - Utilisateur créé automatiquement

## Si le problème persiste

1. Vérifier que les clés API Gemini/Groq sont valides
2. Réduire la taille des prompts dans `queryAnalyzer.ts` et `stackBuilder.ts`
3. Augmenter encore la limite: `--max-old-space-size=8192` (8GB)
4. Ajouter un cache Redis pour les réponses LLM fréquentes
