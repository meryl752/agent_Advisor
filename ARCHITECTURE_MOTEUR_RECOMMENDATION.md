# Architecture du Moteur de Recommandation StackAI

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Pipeline complet](#pipeline-complet)
3. [Composants détaillés](#composants-détaillés)
4. [Recherche vectorielle](#recherche-vectorielle)
5. [Scoring hybride (RRF)](#scoring-hybride-rrf)
6. [Flux de données](#flux-de-données)
7. [Optimisations et performances](#optimisations-et-performances)

---

## 🎯 Vue d'ensemble

Le moteur de recommandation StackAI est un système hybride qui combine :
- **Recherche vectorielle sémantique** (embeddings Jina AI 1024D + pgvector + HNSW)
- **Scoring métier** (catégories, use cases, budget, intégrations)
- **Fusion RRF** (Reciprocal Rank Fusion) pour combiner les deux approches
- **LLM orchestration** pour l'analyse et la construction du stack final

### Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INPUT (UserContext)                      │
│  • Objectif, secteur, budget, niveau technique, timeline, etc.  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR (orchestrator.ts)                  │
│                    Timeout: 15 secondes                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────────┐
   │ ÉTAPE 1 │    │ ÉTAPE 2  │    │   ÉTAPE 3    │
   │ Analyze │───▶│ Retrieve │───▶│    Match     │
   │  Query  │    │  Agents  │    │   & Score    │
   └─────────┘    └──────────┘    └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │   ÉTAPE 4    │
                                   │    Build     │
                                   │    Stack     │
                                   └──────────────┘
```

---

## 🔄 Pipeline complet

### Étape 1 : Analyse de la requête (Query Analyzer)

**Fichier** : `lib/agents/queryAnalyzer.ts`

**Rôle** : Transformer l'input utilisateur brut en une requête structurée et analysée.

**Processus** :
1. **Input** : `UserContext` (objectif, secteur, budget, niveau technique, etc.)
2. **LLM Call** : Appel à Groq (llama-3.3-70b-versatile) avec un prompt expert
3. **Output** : `AnalyzedQuery` (JSON structuré)

**Extraction** :
- ✅ **Reformulation** de l'objectif (plus précis et actionnable)
- ✅ **Décomposition** en sous-tâches concrètes (5-10 sous-tâches)
- ✅ **Catégories requises** (mapping intelligent vers les catégories valides)
- ✅ **Contraintes implicites** (détection automatique)
- ✅ **Contexte sectoriel** (spécificités du secteur)
- ✅ **Métriques de succès** (chiffrées et mesurables)

**Exemple de mapping intelligent** :
```
"créer un site web" → catégorie: website
"réservation en ligne" → catégorie: automation
"être trouvé sur Google" → catégorie: seo
"générer du contenu" → catégorie: copywriting
```

**Validation** : Schéma Zod pour garantir la structure du JSON retourné par le LLM.

**Fallback** : Si le LLM échoue, retourne une version minimale avec l'objectif brut.

---

### Étape 2 : Récupération des agents (Retrieval)

**Fichier** : `lib/agents/orchestrator.ts` (lignes 60-100)

**Rôle** : Récupérer les agents les plus pertinents via recherche vectorielle ou fallback.

#### 2.1 Mode Vectoriel (prioritaire)

**Processus** :
1. **Génération d'embedding** via Jina AI v4 (1024 dimensions)
   - Texte : `objectif + contexte sectoriel + top 3 sous-tâches`
   - Service : `embeddingService.generate()` (avec retry automatique)
   - Latence moyenne : ~900ms

2. **Recherche vectorielle** via Supabase RPC `smart_search_agents_v2`
   - Input : embedding 1024D + budget max + catégorie primaire
   - Index HNSW : recherche ultra-rapide (objectif P95 < 200ms)
   - Output : 50 agents max, triés par similarité cosine

3. **Résultat** : `VectorAgent[]` avec score de similarité [0, 1]

#### 2.2 Mode Fallback (si vectoriel échoue)

**Déclenchement** :
- Erreur API Jina AI
- Erreur RPC Supabase
- Aucun agent retourné

**Processus** :
1. Récupération des agents par catégories (SQL classique)
2. Adaptation en `VectorAgent[]` avec `similarity = 1` (neutre)
3. Le scoring métier prend le relais

**Avantage** : Zéro downtime, le système continue de fonctionner même si la recherche vectorielle est indisponible.

---

### Étape 3 : Scoring hybride (Matcher)

**Fichier** : `lib/agents/matcher.ts`

**Rôle** : Combiner la recherche vectorielle et le scoring métier via **Reciprocal Rank Fusion (RRF)**.

#### 3.1 Scoring métier (`computeBusinessScore`)

**Critères** :

| Critère | Points | Description |
|---------|--------|-------------|
| **Catégorie exacte** | +30 | L'agent est dans une catégorie requise par l'analyseur |
| **Use cases match** | +25 max | Jusqu'à 8 points par use case qui matche (max 3) |
| **Best_for match** | +15 max | Cas d'usage prioritaires qui correspondent |
| **Not_for penalty** | -20 par match | Pénalité forte si l'agent n'est PAS fait pour ce cas |
| **Intégrations natives** | +10 max | 3 points par intégration avec les outils actuels |
| **Difficulté inadaptée** | -15 | Si setup_difficulty > niveau technique utilisateur |
| **Timeline urgente** | -10 | Si timeline = "asap" et time_to_value > 1 semaine |

**Élimination stricte** : Si `price_from > budget_max`, l'agent est éliminé (score = null).

#### 3.2 Reciprocal Rank Fusion (RRF)

**Pourquoi RRF ?**
- ✅ Résistant aux outliers (un score extrême ne domine pas tout)
- ✅ Pas besoin de normaliser les scores entre eux
- ✅ Mathématiquement prouvé supérieur aux poids fixes (benchmarks IR)

**Formule** :
```
RRF_score = 1/(k + rank_vector) + 1/(k + rank_business)
```
Où `k = 60` (constante RRF standard)

**Processus** :
1. **Classement vectoriel** : Ordre de similarité Supabase (déjà trié)
2. **Classement métier** : Tri par `businessScore` décroissant
3. **Fusion RRF** : Calcul du score RRF pour chaque agent
4. **Normalisation** : Score final sur [0, 100]

**Exemple** :
```
Agent A : rank_vector=1, rank_business=5
  → RRF = 1/(60+1) + 1/(60+5) = 0.0164 + 0.0154 = 0.0318

Agent B : rank_vector=3, rank_business=2
  → RRF = 1/(60+3) + 1/(60+2) = 0.0159 + 0.0161 = 0.0320

→ Agent B gagne (meilleur équilibre)
```

**Output** : `ScoredAgent[]` avec `relevance_score` [0-100] et `relevance_reason` (explication lisible).

---

### Étape 4 : Construction du stack (Stack Builder)

**Fichier** : `lib/agents/stackBuilder.ts`

**Rôle** : Construire un stack cohérent et actionnable à partir des top 5 candidats.

**Processus** :
1. **Input** : Top 5 agents scorés + contexte utilisateur + stacks de référence
2. **LLM Call** : Groq (llama-3.3-70b-versatile) avec prompt expert (3000 tokens)
3. **Output** : `FinalStack` (JSON structuré)

**Prompt engineering** :
- ✅ **Contexte riche** : Profil technique, équipe, budget, urgence, outils actuels
- ✅ **Règles strictes** : Budget max, nombre d'agents (4-6), ordre chronologique
- ✅ **Spécificité** : Chaque description doit mentionner CE projet précis
- ✅ **Résultats concrets** : Chiffrés ("Tu gagnes X heures/semaine")
- ✅ **Complémentarité** : Expliquer comment les agents s'articulent entre eux

**Expertise e-commerce** : Détection automatique des projets e-commerce et application de règles spécifiques (ordre logique, outils spécialisés, tracking/rétention obligatoires).

**Réparation JSON** : Si le LLM tronque le JSON, tentative de réparation automatique (`repairTruncatedJSON`).

**Output** :
```typescript
{
  stack_name: "Nom court et mémorable",
  justification: "3 phrases: problème → solution → résultat",
  total_cost: 158, // €/mois
  roi_estimate: 300, // %
  time_saved_per_week: 15, // heures
  quick_wins: ["Aujourd'hui: ...", "Dans 48h: ...", "Dans 1 semaine: ..."],
  warnings: ["Vigilance 1", "Limitation 2"],
  subtasks: [{ name, without_ai, with_ai, tool_name }],
  agents: [
    {
      id, name, category, price_from, score, rank,
      role: "Rôle SPÉCIFIQUE dans CE projet",
      reason: "Pourquoi CET outil pour CE profil",
      concrete_result: "Exemple chiffré précis",
      prompt_to_use: "Prompt exact ou étapes de config"
    }
  ]
}
```

---

## 🔍 Recherche vectorielle

### Architecture technique

```
┌──────────────────────────────────────────────────────────────┐
│                    JINA AI v4 EMBEDDINGS                      │
│  • Modèle: jina-embeddings-v3                                │
│  • Dimensions: 1024                                           │
│  • Latence: ~900ms moyenne                                    │
│  • Retry: 3 tentatives avec backoff exponentiel              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE PGVECTOR + HNSW                     │
│  • Extension: pgvector                                        │
│  • Index: HNSW (m=16, ef_construction=64)                    │
│  • Colonne: embedding_jina VECTOR(1024)                      │
│  • Opérateur: <=> (cosine distance)                          │
│  • Limite: 50 agents max                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              RPC: smart_search_agents_v2                      │
│  • Détection automatique de dimension (384 ou 1024)          │
│  • Filtrage: budget + catégorie                              │
│  • Tri: ORDER BY similarity DESC                             │
│  • Output: agents + similarity score                         │
└──────────────────────────────────────────────────────────────┘
```

### Service d'embeddings

**Fichier** : `lib/embeddings/service.ts`

**Caractéristiques** :
- ✅ **Singleton** : Une seule instance partagée
- ✅ **Retry automatique** : 3 tentatives avec délai exponentiel (2s, 4s, 8s)
- ✅ **Logging détaillé** : Provider, dimensions, latence, retries
- ✅ **Statistiques** : Compteurs de requêtes, erreurs, latence moyenne

**API Jina AI** :
```typescript
POST https://api.jina.ai/v1/embeddings
Headers: Authorization: Bearer <JINA_API_KEY>
Body: {
  model: "jina-embeddings-v3",
  input: "texte à embedder",
  encoding_type: "float"
}
Response: {
  data: [{ embedding: [0.123, -0.456, ...] }] // 1024 dimensions
}
```

### Fonction RPC Supabase

**Fichier SQL** : `supabase/migrations/20250122_fix_rpc_types.sql`

**Signature** :
```sql
smart_search_agents_v2(
  query_embedding VECTOR,
  user_budget_max INTEGER DEFAULT 0,
  user_category TEXT DEFAULT NULL
)
```

**Logique** :
1. Détection de dimension : `vector_dims(query_embedding)`
2. Si 1024D → recherche sur `embedding_jina` (HNSW index)
3. Si 384D → recherche sur `embedding_backup` (fallback HuggingFace)
4. Filtrage : budget + catégorie
5. Tri : `ORDER BY embedding <=> query_embedding` (cosine distance)
6. Limite : 50 agents max

**Performance** :
- ✅ **Sans HNSW** : ~500ms (scan séquentiel)
- ✅ **Avec HNSW** : <200ms P95 (objectif)

---

## 🎯 Scoring hybride (RRF)

### Pourquoi un scoring hybride ?

**Problème** : La recherche vectorielle seule ne suffit pas.
- ❌ Peut retourner des agents hors budget
- ❌ Ne prend pas en compte les intégrations natives
- ❌ Ignore la difficulté technique vs niveau utilisateur
- ❌ Ne pénalise pas les "not_for" (anti-patterns)

**Solution** : Combiner recherche vectorielle + scoring métier via RRF.

### Avantages de RRF vs pondération manuelle

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Pondération manuelle** | Simple à comprendre | Sensible aux outliers, nécessite normalisation, poids arbitraires |
| **RRF** | Résistant aux outliers, pas de normalisation, mathématiquement prouvé | Moins intuitif |

**Exemple concret** :
```
Scénario : Agent A a une similarité de 0.95 mais coûte 500€/mois (hors budget)
           Agent B a une similarité de 0.75 mais coûte 50€/mois (dans budget)

Pondération manuelle (50% vector + 50% business) :
  Agent A : 0.95 * 0.5 + 0 * 0.5 = 0.475 (éliminé mais score élevé)
  Agent B : 0.75 * 0.5 + 0.8 * 0.5 = 0.775 (gagne)

RRF :
  Agent A : éliminé AVANT fusion (hors budget)
  Agent B : 1/(60+1) + 1/(60+1) = 0.0328 (seul candidat)
```

### Formule RRF détaillée

```
Pour chaque agent :
  1. rank_vector = position dans le classement vectoriel (1 = meilleur)
  2. rank_business = position dans le classement métier (1 = meilleur)
  3. RRF_score = 1/(k + rank_vector) + 1/(k + rank_business)
     où k = 60 (constante standard)

Normalisation sur [0, 100] :
  relevance_score = ((RRF_score - min_RRF) / (max_RRF - min_RRF)) * 100
```

---

## 📊 Flux de données

### Diagramme de séquence complet

```
User → API /recommend
  │
  ├─→ Orchestrator.runOrchestrator(ctx)
  │     │
  │     ├─→ QueryAnalyzer.analyzeQuery(ctx)
  │     │     ├─→ LLM (Groq llama-3.3-70b)
  │     │     └─→ AnalyzedQuery (JSON validé)
  │     │
  │     ├─→ EmbeddingService.generate(text)
  │     │     ├─→ Jina AI API (1024D)
  │     │     └─→ embedding vector
  │     │
  │     ├─→ Supabase.rpc('smart_search_agents_v2')
  │     │     ├─→ HNSW index search
  │     │     └─→ VectorAgent[] (50 max)
  │     │
  │     ├─→ Matcher.matchAgents(agents, query, ctx)
  │     │     ├─→ computeBusinessScore() pour chaque agent
  │     │     ├─→ RRF fusion (vector + business)
  │     │     └─→ ScoredAgent[] (top 15)
  │     │
  │     └─→ StackBuilder.buildStack(ctx, query, top5)
  │           ├─→ LLM (Groq llama-3.3-70b)
  │           └─→ FinalStack (JSON)
  │
  └─→ Response: { stack, meta }
```

### Types de données

```typescript
// Input utilisateur
UserContext {
  objective: string
  sector: string
  team_size: 'solo' | 'small' | 'medium' | 'large'
  budget: 'zero' | 'low' | 'medium' | 'high'
  tech_level: 'beginner' | 'intermediate' | 'advanced'
  timeline: 'asap' | 'weeks' | 'months'
  current_tools: string[]
}

// Après analyse LLM
AnalyzedQuery {
  original: string
  subtasks: string[]
  required_categories: string[]
  implicit_constraints: string[]
  sector_context: string
  success_metrics: string[]
  budget_max: number
}

// Après recherche vectorielle
VectorAgent {
  id, name, category, description, price_from, score, roi_score,
  use_cases, compatible_with, best_for, integrations,
  website_domain, setup_difficulty, time_to_value,
  similarity: number  // [0, 1] cosine similarity
}

// Après scoring hybride
ScoredAgent {
  ...VectorAgent,
  relevance_score: number  // [0, 100] RRF score
  relevance_reason: string // explication lisible
}

// Output final
FinalStack {
  stack_name, justification, total_cost, roi_estimate,
  time_saved_per_week, quick_wins, warnings, subtasks,
  agents: StackAgent[]
}
```

---

## ⚡ Optimisations et performances

### 1. Timeout global (15 secondes)

**Problème** : Certaines requêtes peuvent bloquer indéfiniment (API timeout, LLM lent).

**Solution** : `Promise.race()` entre le pipeline et un timeout de 15s.

```typescript
const timeoutPromise = new Promise<null>(resolve =>
  setTimeout(() => resolve(null), 15_000)
)
return Promise.race([orchestrationPromise, timeoutPromise])
```

**Justification** : 
- Pipeline typique : 7-9 secondes
- Marge de sécurité : 6 secondes
- UX web moderne : réponse en < 10 secondes idéalement

### 2. Parallélisation

**Optimisation** : Récupération des stacks de référence en parallèle de la recherche vectorielle.

```typescript
const referenceStacksPromise = getReferenceStack(...)
// ... recherche vectorielle ...
const referenceStacks = await referenceStacksPromise
```

### 3. Cache Supabase

**Fichier** : `lib/supabase/queries.ts`

**Stratégie** : `unstable_cache` de Next.js pour les données rarement modifiées.

```typescript
export const getAllAgents = unstable_cache(
  async () => { /* query */ },
  ['all-agents'],
  { revalidate: 300 } // 5 minutes
)
```

### 4. Index HNSW

**Paramètres** :
- `m = 16` : Nombre de connexions par nœud (équilibre vitesse/précision)
- `ef_construction = 64` : Taille de la liste de candidats pendant la construction

**Impact** :
- ✅ **Sans HNSW** : ~500ms (scan séquentiel de 205 agents)
- ✅ **Avec HNSW** : <200ms P95 (objectif)

### 5. Retry avec backoff exponentiel

**Service d'embeddings** :
```typescript
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    return await callJinaAI(text)
  } catch (err) {
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt) // 2s, 4s, 8s
      await sleep(delay)
    }
  }
}
```

### 6. Fallback gracieux

**Stratégie** : Si la recherche vectorielle échoue, fallback sur recherche par catégories.

```typescript
try {
  vectorAgents = await getVectorMatchedAgents(...)
  retrievalMode = 'vector'
} catch (err) {
  vectorAgents = adaptToVectorAgents(await getAgentsByCategories(...))
  retrievalMode = 'fallback'
}
```

**Avantage** : Zéro downtime, le système continue de fonctionner.

---

## 📈 Métriques et monitoring

### Métriques retournées

```typescript
OrchestratorResult {
  stack: FinalStack,
  meta: {
    agents_analyzed: number      // Nombre d'agents récupérés
    agents_shortlisted: number   // Nombre d'agents après scoring
    subtasks_detected: number    // Nombre de sous-tâches détectées
    processing_time_ms: number   // Temps total du pipeline
    retrieval_mode: 'vector' | 'fallback'  // Mode de récupération
    embedding_provider: 'jina'   // Provider d'embeddings
    embedding_latency_ms: number // Latence de génération d'embedding
  }
}
```

### Logging structuré

**Format** : `[Component] Status — Details`

**Exemples** :
```
[Orchestrator] Étape 1 — Analyse...
[Orchestrator] ✅ 5 sous-tâches | catégories: [copywriting, seo]
[Embedding] ✅ Jina AI v4 - 1024 dimensions - 798ms
[Orchestrator] ✅ Mode vectoriel — 50 agents
[Matcher] RRF scoring — 50 agents (budget=200€, tech=intermediate)
[Matcher] ✅ RRF terminé — top 3: Claude(100), GPT(97), Helium(94)
[Orchestrator] ✅ "Stack E-commerce" — 5 agents, 158€/mois
[Orchestrator] ✅ Pipeline complet en 7868ms (mode: vector)
```

---

## 🔧 Configuration et variables d'environnement

### Variables requises

```bash
# Jina AI (embeddings)
JINA_API_KEY=jina_xxx

# Supabase (base de données + pgvector)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Groq (LLM)
GROQ_API_KEY=gsk_xxx

# Optionnel : Tavily (recherche web pour guides)
API_TAVILY=tvly-xxx
```

### Constantes

**Fichier** : `lib/constants.ts`

```typescript
// Mapping budget utilisateur → montant max en €/mois
BUDGET_MAP = {
  zero: 0,
  low: 50,
  medium: 200,
  high: 500
}

// Catégories valides d'outils
VALID_CATEGORIES = [
  'copywriting', 'seo', 'automation', 'research',
  'image', 'video', 'coding', 'analytics',
  'crm', 'email', 'social', 'website', ...
]

// Difficulté autorisée selon niveau technique
DIFFICULTY_ALLOWED = {
  beginner: ['easy'],
  intermediate: ['easy', 'medium'],
  advanced: ['easy', 'medium', 'hard']
}
```

---

## 🚀 Améliorations futures

### Court terme
- ✅ Finaliser l'index HNSW (P95 < 200ms)
- ✅ Supprimer les anciennes fonctions RPC (conflit actuel)
- ⏳ Ajouter des tests unitaires pour le matcher
- ⏳ Ajouter des tests d'intégration pour le pipeline complet

### Moyen terme
- 📊 Dashboard de monitoring (latences, taux de succès, mode fallback)
- 🔄 A/B testing sur les prompts LLM
- 📈 Tracking des conversions (stack généré → stack sauvegardé)
- 🎯 Fine-tuning du modèle d'embeddings sur nos données

### Long terme
- 🤖 Apprentissage par renforcement (feedback utilisateur → amélioration du scoring)
- 🌐 Support multi-langue (embeddings multilingues)
- 🔍 Recherche hybride avancée (BM25 + vector + graph)
- 💾 Cache intelligent des embeddings (éviter régénération)

---

## 📚 Références

### Papers et ressources
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) - Cormack et al., 2009
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320) - Malkov & Yashunin, 2016
- [Jina AI Embeddings](https://jina.ai/embeddings/)

### Fichiers clés du projet
- `lib/agents/orchestrator.ts` - Pipeline principal
- `lib/agents/queryAnalyzer.ts` - Analyse LLM de la requête
- `lib/agents/matcher.ts` - Scoring hybride RRF
- `lib/agents/stackBuilder.ts` - Construction du stack final
- `lib/embeddings/service.ts` - Service d'embeddings Jina AI
- `lib/supabase/queries.ts` - Requêtes Supabase + RPC
- `supabase/migrations/20250122_*.sql` - Migrations SQL

---

**Dernière mise à jour** : 22 janvier 2025  
**Version** : 2.0 (migration Jina AI + HNSW)
