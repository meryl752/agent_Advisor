# Mise à jour des poids du Matcher

**Date** : 22 avril 2026  
**Objectif** : Rééquilibrer le scoring pour améliorer la pertinence des recommandations

---

## 🎯 Problème identifié

Le poids de la **catégorie** (+30 points) était trop dominant, ce qui causait :
- Des outils de coding (Windsurf, Cursor, Copilot) recommandés pour des landing pages
- Des outils hors sujet avec un score élevé juste parce qu'ils matchent la catégorie
- Les `use_cases` et `best_for` (plus précis) avaient trop peu d'impact

### Exemple du problème

```
Requête : "ultra-fast landing page for SaaS"
Query Analyzer détecte : ["coding", "website"]

Résultat AVANT corrections :
1. Windsurf (coding) - 82/100 ❌ (hors sujet mais +30 pour catégorie)
2. Cursor (coding) - 80/100 ❌
3. GitHub Copilot (coding) - 78/100 ❌
4. Minea (research) - 75/100 ❌
5. Framer AI (image) - 45/100 ✅ (pertinent mais mal scoré)
```

---

## ✅ Solution appliquée

### Modifications des poids

| Critère          | Avant      | Après      | Justification                                    |
|------------------|------------|------------|--------------------------------------------------|
| **Catégorie**    | +30 points | +20 points | Réduit la domination de la catégorie             |
| **Use cases**    | +8/match (max +25) | +10/match (max +35) | Plus précis que la catégorie, doit peser plus |
| **Best for**     | +8/match (max +15) | +10/match (max +20) | Très pertinent, mérite plus de poids |
| **Not for**      | -20/match  | -20/match  | Inchangé (déjà efficace)                         |
| **Intégrations** | +3/match (max +10) | +3/match (max +10) | Inchangé |
| **Difficulté**   | -15 points | -15 points | Inchangé                                         |
| **Timeline**     | -10 points | -10 points | Inchangé                                         |

### Modifications des données (Supabase)

1. ✅ **Recatégorisation des landing page builders**
   - Framer AI : `image` → `website`
   - PageFly : `automation` → `website`
   - Shogun : `automation` → `website`
   - GemPages : `automation` → `website`

2. ✅ **Enrichissement des "not_for"**
   - Ajout de "not_for" pour ~99 agents qui n'en avaient pas
   - Focus sur les agents critiques : Minea, Windsurf, Cursor, Copilot, etc.

---

## 🎯 Résultat attendu

```
Requête : "ultra-fast landing page for SaaS"
Query Analyzer détecte : ["website", "coding"]

Résultat APRÈS corrections :
1. Framer AI (website) - 75/100 ✅ (+20 catégorie + +35 use_cases + +20 best_for)
2. v0.dev (coding) - 70/100 ✅ (+20 catégorie + +30 use_cases + +20 best_for)
3. Webflow (website) - 65/100 ✅ (+20 catégorie + +25 use_cases + +20 best_for)
4. Windsurf (coding) - 20/100 ❌ (+20 catégorie - 20 not_for)
5. Cursor (coding) - 20/100 ❌ (+20 catégorie - 20 not_for)
```

---

## 📊 Impact sur le scoring

### Distribution des points (max théorique)

**Avant** :
- Catégorie : 30 points (42% du max)
- Use cases : 25 points (35%)
- Best for : 15 points (21%)
- Intégrations : 10 points (14%)
- **Total positif** : 70 points

**Après** :
- Catégorie : 20 points (24% du max)
- Use cases : 35 points (41%)
- Best for : 20 points (24%)
- Intégrations : 10 points (12%)
- **Total positif** : 85 points

### Avantages

1. **Meilleure précision** : Les `use_cases` et `best_for` (plus spécifiques) ont plus d'impact
2. **Moins de faux positifs** : La catégorie seule ne suffit plus à dominer le score
3. **Pénalités efficaces** : Les "not_for" peuvent maintenant contrebalancer la catégorie
4. **Score plus nuancé** : Distribution plus équilibrée entre les critères

---

## 🧪 Tests recommandés

1. **Test landing page** : "ultra-fast landing page for SaaS"
   - Attendu : Framer AI, v0.dev, Webflow en top 3
   
2. **Test e-commerce** : "boutique dropshipping Shopify"
   - Attendu : Shopify, Minea, AutoDS en top 3
   
3. **Test coding** : "développer une API REST avec TypeScript"
   - Attendu : Cursor, GitHub Copilot, Replit AI en top 3

---

## 📝 Fichiers modifiés

- `stackai/lib/agents/matcher.ts` - Fonction `computeBusinessScore()`
- `stackai/lib/agents/queryAnalyzer.ts` - Nouveau prompt structuré
- `stackai/lib/agents/types.ts` - Nouveaux types pour domaines/sous-tâches
- Base de données Supabase - Recatégorisation + enrichissement "not_for"

---

## 🚀 Prochaines étapes

1. ✅ Tester avec des requêtes réelles
2. ⏳ Monitorer les scores dans les logs
3. ⏳ Ajuster si nécessaire selon les retours utilisateurs
4. ⏳ Considérer un match sémantique pour `use_cases` (au lieu de substring)
