# Analyse détaillée des Prompts LLM

## 📋 Vue d'ensemble

Le système utilise **2 appels LLM critiques** :
1. **Query Analyzer** (Groq llama-3.3-70b ou llama-3.1-8b-instant) - 1024 tokens max
2. **Stack Builder** (Groq llama-3.3-70b) - 3000 tokens max

Le **Matcher** n'utilise PAS de LLM - c'est du scoring algorithmique pur (RRF).

---

## 🔍 ÉTAPE 1 : Query Analyzer

### Modèle utilisé
- **Primaire** : `llama-3.1-8b-instant` (Groq) - rapide mais moins précis
- **Fallback** : `llama-3.3-70b-versatile` (Groq) - plus lent mais plus précis
- **Timeout** : 10 secondes
- **Max tokens** : 1024

### Prompt actuel

```
<role>
Tu es un consultant senior en transformation digitale et IA, spécialisé dans 
l'optimisation des processus business par les outils IA. Tu as accompagné plus 
de 500 entreprises dans leur adoption de l'IA.
</role>

<mission>
Analyser en profondeur la demande suivante et en extraire TOUTE l'information 
nécessaire pour construire un stack IA parfaitement adapté.
</mission>

<user_request>
OBJECTIF EXPRIMÉ: "${ctx.objective}"
SECTEUR D'ACTIVITÉ: ${ctx.sector}
TAILLE ÉQUIPE: ${ctx.team_size}
BUDGET MENSUEL MAX: ${budgetValue}€
NIVEAU TECHNIQUE: ${ctx.tech_level}
URGENCE: ${ctx.timeline}
OUTILS DÉJÀ EN PLACE: ${ctx.current_tools.join(', ') || 'aucun'}
</user_request>

<instructions>
1. REFORMULE l'objectif de façon précise et actionnable
2. DÉCOMPOSE en sous-tâches concrètes — chaque sous-tâche doit être:
   - Spécifique et mesurable
   - Directement liée à l'objectif principal
   - Réalisable avec un outil IA ou digital
3. IDENTIFIE les catégories d'outils nécessaires parmi:
   copywriting, image, automation, analytics, customer_service, seo, 
   prospecting, coding, research, video, website
   
   ATTENTION - Mapping des besoins vers catégories:
   - "créer un site web", "site internet", "landing page" → website
   - "réservation", "booking", "prise de rendez-vous" → automation
   - "être trouvé sur Google", "référencement local", "SEO local" → seo
   - "contenu", "textes", "descriptions" → copywriting
   - "images", "photos", "visuels" → image
   
4. DÉTECTE les contraintes implicites que l'utilisateur n'a pas mentionnées 
   mais qui sont évidentes
5. CONTEXTUALISE selon le secteur — chaque secteur a ses spécificités
6. DÉFINIS des métriques de succès MESURABLES et CHIFFRÉES
</instructions>

<output_format>
JSON strict, aucun markdown, aucun backtick, aucun texte avant ou après:
{
  "original": "Reformulation précise et actionnable de l'objectif",
  "subtasks": [
    "Sous-tâche 1: action concrète + résultat attendu",
    "Sous-tâche 2: action concrète + résultat attendu",
    ...
  ],
  "required_categories": ["catégorie1", "catégorie2", "catégorie3"],
  "implicit_constraints": [
    "Contrainte implicite 1 avec explication",
    "Contrainte implicite 2 avec explication"
  ],
  "sector_context": "Analyse du contexte sectoriel: défis spécifiques, 
                     opportunités IA, benchmarks du secteur",
  "success_metrics": [
    "Métrique 1: chiffrée et mesurable",
    "Métrique 2: chiffrée et mesurable"
  ],
  "budget_max": ${budgetValue}
}
</output_format>
```

### 🔴 Problèmes identifiés

#### 1. **Mapping des catégories incomplet et incorrect**

**Problème** :
```
ATTENTION - Mapping des besoins vers catégories:
- "créer un site web", "site internet", "landing page" → website
```

**Mais** : Le prompt ne mentionne PAS :
- "ultra-fast landing page" → website
- "page builder" → website  
- "React components" → coding
- "export code" → coding
- "design control" → website ou image

**Impact** : Pour ta requête "ultra-fast landing page for SaaS", le LLM peut :
- Détecter "landing page" → website ✅
- Détecter "React components" → coding ✅
- Mais "website" n'existe pas dans la base ! ❌

#### 2. **Modèle trop rapide (8b-instant) pour une tâche complexe**

**Problème** :
- `llama-3.1-8b-instant` est utilisé par défaut (maxTokens <= 1200)
- Ce modèle est rapide mais **moins précis** pour l'analyse sémantique
- Il peut **manquer des nuances** dans les requêtes complexes

**Exemple** :
```
Input: "ultra-fast landing page with smooth animations and React components"
8b-instant peut détecter: ["coding", "website"]
70b-versatile détecterait: ["website", "coding", "image"] (animations = design)
```

#### 3. **Pas d'exemples concrets dans le prompt**

**Problème** : Le prompt ne donne PAS d'exemples de bonnes analyses.

**Solution** : Ajouter des exemples few-shot :
```xml
<examples>
<example>
Input: "Je veux créer une landing page ultra-rapide pour mon SaaS"
Output: {
  "required_categories": ["website", "image", "copywriting"],
  "subtasks": [
    "Créer une landing page responsive avec animations fluides",
    "Générer du contenu marketing convaincant",
    "Optimiser les visuels et le design"
  ]
}
</example>
</examples>
```

#### 4. **Validation des catégories trop stricte**

**Code actuel** :
```typescript
validated.required_categories = validated.required_categories.filter(c =>
  (VALID_CATEGORIES as readonly string[]).includes(c)
)
```

**Problème** : Si le LLM retourne une catégorie invalide, elle est **silencieusement supprimée**.

**Exemple** :
- LLM retourne : `["website", "design", "coding"]`
- "design" n'existe pas → supprimé
- Résultat final : `["website", "coding"]`
- Mais "website" n'existe pas dans la base → recherche échoue !

---

## 🎯 ÉTAPE 2 : Matcher (Pas de LLM)

Le Matcher est **purement algorithmique** - pas d'appel LLM.

### Scoring métier

```typescript
// Catégorie exacte requise (+30 points)
if (query.required_categories.includes(agent.category)) score += 30

// Match use_cases (+25 max)
const useCaseMatches = (agent.use_cases ?? []).filter(uc =>
  allText.includes(uc.toLowerCase())
).length
score += Math.min(useCaseMatches * 8, 25)

// Match best_for (+15 max)
const bestForMatches = (agent.best_for ?? []).filter(bf =>
  allText.includes(bf.toLowerCase())
).length
score += Math.min(bestForMatches * 8, 15)

// Pénalité not_for (-20 par match)
const notForMatches = (agent.not_for ?? []).filter(nf =>
  allText.includes(nf.toLowerCase())
).length
score -= notForMatches * 20
```

### 🔴 Problèmes identifiés

#### 1. **Catégorie = +30 points (trop dominant)**

**Problème** : Si la catégorie matche, l'agent gagne automatiquement +30 points.

**Exemple avec ta requête** :
- Query Analyzer détecte : `["coding", "website"]`
- Windsurf (coding) : +30 points ✅
- Cursor (coding) : +30 points ✅
- Framer AI (image) : 0 points ❌ (devrait être "website")

**Impact** : Les outils de coding dominent le scoring même s'ils ne sont pas pertinents.

#### 2. **Match use_cases trop simpliste (substring)**

**Code actuel** :
```typescript
allText.includes(uc.toLowerCase())
```

**Problème** : Match par substring simple.

**Exemple** :
- use_case: "design"
- allText: "I want to create an ultra-fast landing page with smooth animations"
- Match : ❌ (pas de "design" dans le texte)

**Mais** : "smooth animations" = design !

#### 3. **99 agents sans "not_for" = pas de pénalité**

**Problème critique** :
- Minea (research) : `not_for: []` → pas de pénalité
- Windsurf (coding) : `not_for: []` → pas de pénalité
- Cursor (coding) : `not_for: []` → pas de pénalité

**Impact** : Ces agents ne sont JAMAIS pénalisés même s'ils sont totalement hors sujet.

---

## 🏗️ ÉTAPE 3 : Stack Builder

### Modèle utilisé
- **Modèle** : `llama-3.3-70b-versatile` (Groq) - toujours le gros modèle
- **Timeout** : 10 secondes
- **Max tokens** : 3000

### Prompt actuel (extrait)

```
<role>
Tu es un architecte de solutions IA d'élite. Tu construis des stacks d'outils 
IA sur mesure qui transforment concrètement les business. Chaque recommandation 
que tu fais est basée sur le profil EXACT de l'utilisateur — jamais générique, 
toujours spécifique.
</role>

<project_context>
OBJECTIF ANALYSÉ: ${query.original}
SECTEUR: ${ctx.sector}
CONTEXTE SECTORIEL: ${query.sector_context}
PROFIL TECHNIQUE: ${TECH_LEVEL_DESCRIPTION[ctx.tech_level]}
PROFIL ÉQUIPE: ${TEAM_DESCRIPTION[ctx.team_size]}
BUDGET MAXIMUM ABSOLU: ${BUDGET_MAP[ctx.budget]}€/mois
URGENCE: ${ctx.timeline}
OUTILS DÉJÀ EN PLACE: ${ctx.current_tools.join(', ') || 'aucun — partir de zéro'}
</project_context>

<available_candidates>
1. ID="..." | NOM="Minea" | CATÉGORIE=research | PRIX=49€/mois | 
   SCORE_PERTINENCE=85/100 | RAISON_SÉLECTION="catégorie research requise"
2. ID="..." | NOM="Windsurf" | CATÉGORIE=coding | PRIX=10€/mois | 
   SCORE_PERTINENCE=82/100 | RAISON_SÉLECTION="catégorie coding requise"
3. ID="..." | NOM="GitHub Copilot" | CATÉGORIE=coding | PRIX=10€/mois | 
   SCORE_PERTINENCE=80/100 | RAISON_SÉLECTION="catégorie coding requise"
4. ID="..." | NOM="Cursor" | CATÉGORIE=coding | PRIX=20€/mois | 
   SCORE_PERTINENCE=78/100 | RAISON_SÉLECTION="catégorie coding requise"
5. ID="..." | NOM="Framer AI" | CATÉGORIE=image | PRIX=5€/mois | 
   SCORE_PERTINENCE=45/100 | RAISON_SÉLECTION="2 use cases correspondent"
</available_candidates>

<critical_rules>
RÈGLE 1 — BUDGET: Le total_cost DOIT être ≤ ${BUDGET_MAP[ctx.budget]}€/mois.
RÈGLE 2 — NOMBRE: Sélectionne entre 4 et 6 agents. Ni plus, ni moins.
RÈGLE 3 — ORDRE: Les agents sont classés dans l'ordre CHRONOLOGIQUE 
                 d'implémentation.
RÈGLE 4 — SPÉCIFICITÉ: Chaque description doit mentionner CE projet précis.
RÈGLE 5 — RÉSULTATS CONCRETS: Chaque concrete_result doit être chiffré.
RÈGLE 6 — PROFIL: Respecte le niveau technique.
RÈGLE 7 — COMPLÉMENTARITÉ: Les agents doivent s'articuler entre eux.
</critical_rules>
```

### 🔴 Problèmes identifiés

#### 1. **Le LLM reçoit des candidats déjà mal scorés**

**Problème** : Le Stack Builder reçoit les top 5 du Matcher.

**Dans ton cas** :
```
Top 5 candidats reçus par le Stack Builder:
1. Minea (research) - 85/100 ✅ (mais hors sujet)
2. Windsurf (coding) - 82/100 ✅ (mais hors sujet)
3. GitHub Copilot (coding) - 80/100 ✅ (mais hors sujet)
4. Cursor (coding) - 78/100 ✅ (mais hors sujet)
5. Framer AI (image) - 45/100 ❌ (pertinent mais mal scoré)
```

**Impact** : Le LLM choisit parmi les 5 meilleurs selon le Matcher, même s'ils sont hors sujet !

#### 2. **Pas de contexte sur "landing page builders"**

**Problème** : Le prompt ne mentionne PAS explicitement les landing page builders.

**Solution** : Ajouter un contexte spécifique :
```xml
<landing_page_expertise>
Pour les projets de landing pages, privilégie :
- Framer AI, Webflow, v0.dev pour le design et la création
- Tailwind UI, Shadcn UI pour les composants React
- Vercel, Netlify pour le déploiement
ÉVITE les IDE génériques (Cursor, Windsurf) sauf si l'utilisateur veut 
coder from scratch.
</landing_page_expertise>
```

#### 3. **RAISON_SÉLECTION trop vague**

**Problème** :
```
RAISON_SÉLECTION="catégorie coding requise"
```

**Impact** : Le LLM ne comprend PAS pourquoi Windsurf a été sélectionné. Il pense que c'est pertinent.

**Solution** : Enrichir la raison :
```
RAISON_SÉLECTION="catégorie coding requise · 3 use cases correspondent · 
                  similarité sémantique 75%"
```

---

## 📊 Résumé des problèmes par criticité

| # | Problème | Composant | Impact | Criticité |
|---|----------|-----------|--------|-----------|
| 1 | **Catégorie "website" manquante dans la base** | Data | 🔴 CRITIQUE | Bloque toutes les requêtes landing page |
| 2 | **99 agents sans "not_for"** | Data | 🔴 CRITIQUE | Pas de pénalité pour les mauvais matchs |
| 3 | **Mapping catégories incomplet** | Query Analyzer | 🟠 ÉLEVÉ | LLM détecte mal les catégories |
| 4 | **Modèle 8b-instant trop rapide** | Query Analyzer | 🟠 ÉLEVÉ | Analyse moins précise |
| 5 | **Catégorie = +30 points (trop dominant)** | Matcher | 🟠 ÉLEVÉ | Favorise les mauvais matchs |
| 6 | **Match use_cases par substring** | Matcher | 🟡 MOYEN | Manque des matchs sémantiques |
| 7 | **Pas d'exemples few-shot** | Query Analyzer | 🟡 MOYEN | LLM moins guidé |
| 8 | **Pas de contexte landing page** | Stack Builder | 🟡 MOYEN | LLM ne sait pas quoi privilégier |

---

## 🛠️ Plan de correction

### Phase 1 : Corrections DATA (impact immédiat)

1. ✅ Ajouter catégorie "website" aux constantes
2. ✅ Recatégoriser Framer AI, PageFly, Shogun, GemPages en "website"
3. ✅ Enrichir les "not_for" des 99 agents manquants

### Phase 2 : Corrections PROMPT (Query Analyzer)

4. ⏳ Enrichir le mapping des catégories avec plus d'exemples
5. ⏳ Ajouter des exemples few-shot
6. ⏳ Forcer l'utilisation du modèle 70b pour l'analyse (sacrifier 1-2s de latence)

### Phase 3 : Corrections SCORING (Matcher)

7. ⏳ Réduire le poids de la catégorie (30 → 20 points)
8. ⏳ Augmenter le poids des use_cases (25 → 35 points)
9. ⏳ Implémenter un match sémantique au lieu de substring

### Phase 4 : Corrections PROMPT (Stack Builder)

10. ⏳ Ajouter un contexte "landing_page_expertise"
11. ⏳ Enrichir les RAISON_SÉLECTION avec plus de détails
12. ⏳ Ajouter des exemples de bons stacks

---

## 🎯 Résultat attendu après corrections

### Avant (ton cas actuel)
```
Input: "ultra-fast landing page for SaaS with React components"

Query Analyzer détecte: ["coding", "website"]
↓
Matcher trouve:
1. Windsurf (coding) - 82/100
2. Cursor (coding) - 80/100
3. GitHub Copilot (coding) - 78/100
4. Minea (research) - 75/100
↓
Stack Builder choisit: Windsurf, Cursor, Copilot, Minea ❌
```

### Après corrections
```
Input: "ultra-fast landing page for SaaS with React components"

Query Analyzer détecte: ["website", "coding", "image"]
↓
Matcher trouve:
1. Framer AI (website) - 95/100 ✅
2. v0.dev (coding) - 88/100 ✅
3. Webflow (website) - 85/100 ✅
4. Tailwind UI (website) - 82/100 ✅
5. Vercel (website) - 78/100 ✅
↓
Stack Builder choisit: Framer AI, v0.dev, Tailwind UI, Vercel ✅
```

---

**Prochaine étape** : Tu veux qu'on commence par les corrections DATA (Phase 1) ou les corrections PROMPT (Phase 2) ?
