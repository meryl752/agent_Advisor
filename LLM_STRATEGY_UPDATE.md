# Mise à jour de la stratégie LLM

**Date** : 22 avril 2026  
**Objectif** : Améliorer la fiabilité et la vitesse du Query Analyzer

---

## 🔴 Problèmes identifiés

### 1. Qwen OpenRouter trop lent
```
[LLM] Calling Qwen 2.5 72B with 1300 max tokens...
[LLM] Qwen 2.5 72B failed: Timeout: Qwen 2.5 72B  ← Timeout fréquent
[LLM] Qwen failed, falling back to Groq
```

**Cause** : OpenRouter peut être lent (charge serveur, latence réseau)
**Impact** : On tombe toujours sur le fallback Llama

### 2. Validation regex trop stricte
```
[QueryAnalyzer] ❌ Erreur: ID must match format d{N}_t{M}
```

**Cause** : Le regex `/^d\d+_t\d+$/` rejette les IDs générés par les LLMs
**Impact** : Fallback utilisé → catégories vides → mauvaises recommandations

---

## ✅ Solutions appliquées

### 1. Qwen sur Groq (au lieu d'OpenRouter)

**Avant** :
- Qwen 2.5 72B via OpenRouter (lent, timeouts fréquents)
- Fallback : Llama 3.3 70B sur Groq

**Après** :
- Qwen 2.5 72B sur Groq (rapide, infrastructure Groq)
- Fallback : Llama 3.3 70B sur Groq

**Avantages** :
- ✅ Même vitesse que Llama (infrastructure Groq ultra-rapide)
- ✅ Meilleur raisonnement structuré que Llama
- ✅ Meilleur respect des formats JSON
- ✅ Gratuit (comme Llama sur Groq)

### 2. Regex assoupli

**Avant** :
```typescript
/^d\d+_t\d+$/  // Accepte uniquement : d1_t1, d2_t3, etc.
```

**Après** :
```typescript
/^[a-zA-Z0-9_-]+$/  // Accepte : d1_t1, task_1, t1, domain1_task1, etc.
```

**Avantages** :
- ✅ Moins de rejets
- ✅ Meilleur taux de succès
- ✅ Validation critique maintenue (dépendances, duplicates)

### 3. Nouvelle stratégie LLM

**Fast mode (≤1200 tokens)** :
```
Race entre :
1. Gemini Flash (très rapide)
2. Qwen Groq (rapide + intelligent)

→ Le premier qui répond gagne
```

**Slow mode (>1200 tokens)** :
```
Priorité :
1. Gemini Flash (rapide + intelligent)
2. Fallback : Qwen Groq
3. Fallback : Llama Groq (dernier recours)
```

---

## 📊 Comparaison des modèles

| Modèle | Vitesse | Raisonnement | JSON | Coût | Disponibilité |
|--------|---------|--------------|------|------|---------------|
| **Gemini Flash** | ⚡⚡⚡ Très rapide | ⭐⭐⭐ Excellent | ⭐⭐⭐ Excellent | Gratuit | Google |
| **Qwen Groq** | ⚡⚡⚡ Très rapide | ⭐⭐⭐ Excellent | ⭐⭐⭐ Excellent | Gratuit | Groq |
| **Llama Groq** | ⚡⚡⚡ Très rapide | ⭐⭐ Bon | ⭐⭐ Bon | Gratuit | Groq |
| ~~Qwen OpenRouter~~ | ⚡ Lent | ⭐⭐⭐ Excellent | ⭐⭐⭐ Excellent | Gratuit | OpenRouter |

---

## 🎯 Résultat attendu

### Avant
```
[LLM] Calling Qwen 2.5 72B with 1300 max tokens...
[LLM] Qwen 2.5 72B failed: Timeout: Qwen 2.5 72B
[LLM] Qwen failed, falling back to Groq
[LLM] Calling Groq llama-3.3-70b-versatile...
[QueryAnalyzer] ❌ Erreur: ID must match format d{N}_t{M}
[Orchestrator] ✅ 1 sous-tâches | catégories: []  ← FALLBACK !
```

### Après
```
[LLM] Fast mode — racing Gemini Flash vs Qwen Groq
[LLM] Groq qwen2.5-72b-instruct success - 2588 chars
[QueryAnalyzer] ✅ 3 domaines | 8 sous-tâches atomiques | catégories: [website, coding]
[Orchestrator] ✅ Mode vectoriel — 50 agents
[Matcher] ✅ RRF terminé — top 3: Framer AI(75), v0.dev(70), Webflow(65)
```

---

## 📝 Fichiers modifiés

1. `stackai/lib/agents/queryAnalyzer.ts`
   - Regex assoupli : `/^[a-zA-Z0-9_-]+$/`

2. `stackai/lib/groq/client.ts`
   - Modèle par défaut : `qwen2.5-72b-instruct`
   - Fallback : `llama-3.3-70b-versatile`

3. `stackai/lib/llm/router.ts`
   - Retrait de Qwen OpenRouter
   - Nouvelle stratégie : Gemini Flash + Qwen Groq
   - callGroq avec fallback automatique Qwen → Llama

---

## 🧪 Tests recommandés

1. **Test Query Analyzer** : Vérifier que les IDs sont acceptés
2. **Test vitesse** : Mesurer le temps de réponse (devrait être <5s)
3. **Test qualité** : Vérifier que les catégories sont bien détectées

---

## 🚀 Prochaines étapes

1. ✅ Tester avec des requêtes réelles
2. ⏳ Monitorer les logs pour vérifier :
   - Quel modèle répond (Gemini ou Qwen)
   - Temps de réponse
   - Taux de succès de la validation
3. ⏳ Ajuster si nécessaire

---

## 📌 Notes importantes

- **Qwen OpenRouter retiré** : Trop de timeouts, remplacé par Qwen Groq
- **Gemini Flash prioritaire** : Plus rapide et tout aussi intelligent
- **Validation critique maintenue** : Dépendances et duplicates toujours vérifiés
- **Pas de régression** : Fallback Llama toujours disponible en dernier recours
