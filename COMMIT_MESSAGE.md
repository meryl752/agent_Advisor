# 🚀 Fix: Amélioration majeure du moteur de recommandation

## Problèmes résolus

### 1. API HuggingFace cassée (404)
- ❌ **Avant**: URL incorrecte causait un fallback systématique
- ✅ **Après**: URL corrigée vers `/pipeline/feature-extraction/`
- **Impact**: Recherche vectorielle sémantique maintenant fonctionnelle

### 2. Qualité des données agents
- ❌ **Avant**: 12 agents critiques sans `best_for` ni `not_for`
- ✅ **Après**: Enrichissement manuel des 12 agents les plus populaires
- **Agents enrichis**: Claude Sonnet, Midjourney, Perplexity Pro, Buffer AI, Clay, Make.com, Polar Analytics, Canva AI, Apollo.io, Instantly AI, Tidio AI, Surfer SEO

### 3. Scoring métier incomplet
- ❌ **Avant**: Pas de pénalité pour les mauvais matchs
- ✅ **Après**: Pénalité `-20 points` par `not_for` match
- **Impact**: Élimine les recommandations absurdes (ex: Midjourney pour créer un site web)

### 4. Catégorie manquante
- ❌ **Avant**: Pas de catégorie `website`
- ✅ **Après**: Catégorie `website` ajoutée aux VALID_CATEGORIES
- **Impact**: Meilleure détection des besoins de création de sites web

### 5. Rate limiting Groq
- ❌ **Avant**: Appels parallèles saturaient la limite (429 errors)
- ✅ **Après**: Retry automatique + exécution par batch de 2
- **Impact**: Plus d'erreurs "All LLM calls failed"

## Fichiers modifiés

### Core
- `lib/agents/orchestrator.ts` - Fix URL HuggingFace
- `lib/agents/matcher.ts` - Ajout pénalité `not_for`
- `lib/agents/queryAnalyzer.ts` - Amélioration mapping catégories
- `lib/agents/guideBuilder.ts` - Batch processing pour rate limit
- `lib/llm/router.ts` - Retry automatique sur rate limit
- `lib/constants.ts` - Ajout catégorie `website`

### Data
- `agents_export.json` - 12 agents enrichis avec `best_for` et `not_for`

### Scripts
- `scripts/enrich-critical.ts` - Script d'enrichissement manuel
- `scripts/enrich-agents.ts` - Script d'enrichissement automatique (IA)

### UI
- `app/components/dashboard/TrendingAgents.tsx` - Fix clés React dupliquées

## Résultats attendus

**Avant** (requête restaurant):
```
❌ Claude Sonnet (chatbot)
❌ Midjourney (génération d'images)
❌ Ahrefs (SEO analytics)
```

**Après** (requête restaurant):
```
✅ Framer AI (création de sites web)
✅ Canva AI (design menu)
✅ Surfer SEO (référencement local)
```

## Tests recommandés

1. Tester la requête restaurant originale
2. Vérifier que l'embedding fonctionne (pas de fallback)
3. Vérifier les logs pour confirmer le mode vectoriel
4. Tester d'autres cas d'usage (e-commerce, SaaS, etc.)

## Breaking changes

Aucun - Tous les changements sont rétrocompatibles
