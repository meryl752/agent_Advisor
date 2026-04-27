# Migration vers Jina AI v4 + Index HNSW

Ce document explique comment migrer les embeddings de HuggingFace vers Jina AI v4 et créer un index HNSW pour améliorer les performances de 10x.

## 📋 Vue d'ensemble

### Avant (HuggingFace)
- **Modèle** : sentence-transformers/all-MiniLM-L6-v2
- **Dimensions** : 384
- **Performance** : Lent (cold start), erreurs 404
- **Index** : Aucun (recherche séquentielle)

### Après (Jina AI v4)
- **Modèle** : jina-embeddings-v3
- **Dimensions** : 1024
- **Performance** : Rapide, stable, pas de cold start
- **Index** : HNSW (10x plus rapide)
- **Gratuit** : 1 million de tokens/mois

---

## 🚀 Étapes de migration

### Étape 1 : Appliquer la migration SQL

La migration SQL crée :
- Nouvelles colonnes (`embedding_jina`, `embedding_backup`, `embedding_provider`, `embedding_updated_at`)
- Index HNSW sur `embedding_jina`
- Fonction RPC `smart_search_agents_v2` qui supporte les deux formats

**Option A : Via Supabase Dashboard (RECOMMANDÉ)**

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Aller dans **SQL Editor**
3. Copier le contenu de `supabase/migrations/20250122_add_jina_embeddings_hnsw.sql`
4. Exécuter le SQL
5. Vérifier qu'il n'y a pas d'erreurs

**Option B : Via script**

```bash
npx tsx scripts/apply-migration.ts
```

### Étape 2 : Tester la migration (Dry-run)

Avant de migrer tous les embeddings, testez avec quelques agents :

```bash
# Tester avec 5 agents
npx tsx scripts/migrate-embeddings.ts --dry-run --limit 5
```

Vérifiez que :
- ✅ Les embeddings sont générés (1024 dimensions)
- ✅ Pas d'erreurs API
- ✅ Latence acceptable (~1-2 secondes par agent)

### Étape 3 : Migrer les top agents d'abord

Migrez d'abord les agents les plus importants (par score) :

```bash
# Migrer les 50 meilleurs agents
npx tsx scripts/migrate-embeddings.ts --priority --limit 50
```

### Étape 4 : Migrer tous les agents

Une fois les tests validés, migrez tous les agents :

```bash
# Migration complète
npx tsx scripts/migrate-embeddings.ts
```

**Temps estimé** : ~2-3 minutes pour 200 agents (avec pauses pour éviter rate limits)

### Étape 5 : Vérifier la migration

```bash
# Vérifier dans Supabase SQL Editor
SELECT 
  COUNT(*) as total,
  COUNT(embedding_jina) as with_jina,
  COUNT(embedding_backup) as with_backup,
  embedding_provider
FROM agents
GROUP BY embedding_provider;
```

Résultat attendu :
```
total | with_jina | with_backup | embedding_provider
------|-----------|-------------|-------------------
200   | 200       | 200         | jina
```

---

## 🧪 Tests

### Test 1 : Vérifier que l'API fonctionne

```bash
npx tsx scripts/test-embedding-service.ts
```

Résultat attendu :
```
✅ Jina AI v4 - 1024 dimensions - ~1400ms
✅ Tous les tests ont réussi!
```

### Test 2 : Tester la recherche vectorielle

Ouvrir http://localhost:3000/dashboard/recommend et créer un stack.

Vérifier dans les logs du serveur :
```
[Embedding] ✅ Jina AI v4 - 1024 dimensions - 1243ms
[Orchestrator] ✅ Mode vectoriel — 42 agents
```

---

## 📊 Performance attendue

### Avant (HuggingFace sans index)
- **Recherche vectorielle** : ~500-1000ms (P95)
- **Cold start** : Oui (première requête lente)
- **Erreurs** : Fréquentes (404)

### Après (Jina AI + HNSW)
- **Recherche vectorielle** : <200ms (P95) ⚡
- **Cold start** : Non
- **Erreurs** : Rares

**Amélioration** : **5-10x plus rapide** 🚀

---

## 🔧 Commandes utiles

### Migration

```bash
# Dry-run (simulation)
npx tsx scripts/migrate-embeddings.ts --dry-run

# Migrer 10 agents
npx tsx scripts/migrate-embeddings.ts --limit 10

# Migrer les top agents
npx tsx scripts/migrate-embeddings.ts --priority --limit 50

# Migration complète
npx tsx scripts/migrate-embeddings.ts

# Aide
npx tsx scripts/migrate-embeddings.ts --help
```

### Vérification

```bash
# Tester le service d'embeddings
npx tsx scripts/test-embedding-service.ts

# Vérifier les colonnes en base
# (dans Supabase SQL Editor)
SELECT * FROM agents LIMIT 1;

# Vérifier l'index HNSW
SELECT indexname FROM pg_indexes WHERE tablename = 'agents';
```

---

## ⚠️ Troubleshooting

### Erreur : "JINA_API_KEY manquant"

Vérifier que `.env.local` contient :
```env
JINA_API_KEY=jina_xxxxxxxxxxxxx
```

### Erreur : "Rate limit exceeded"

Jina AI a une limite de requêtes par minute. Le script fait des pauses automatiques, mais si vous avez beaucoup d'agents :

1. Réduire `batchSize` dans le script (ligne 185)
2. Augmenter la pause entre batches (ligne 165)

### Erreur : "Column embedding_jina does not exist"

La migration SQL n'a pas été appliquée. Retourner à l'Étape 1.

### Performance toujours lente

1. Vérifier que l'index HNSW existe :
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'agents';
   ```

2. Vérifier que les embeddings Jina sont bien utilisés :
   ```sql
   SELECT COUNT(*) FROM agents WHERE embedding_jina IS NOT NULL;
   ```

3. Vérifier les logs du serveur pour voir quel provider est utilisé

---

## 📚 Ressources

- [Jina AI Documentation](https://jina.ai/embeddings/)
- [pgvector HNSW Index](https://github.com/pgvector/pgvector#hnsw)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-search)

---

## ✅ Checklist de migration

- [ ] Étape 1 : Migration SQL appliquée
- [ ] Étape 2 : Dry-run testé avec succès
- [ ] Étape 3 : Top 50 agents migrés
- [ ] Étape 4 : Tous les agents migrés
- [ ] Étape 5 : Vérification en base OK
- [ ] Test 1 : Service d'embeddings fonctionne
- [ ] Test 2 : Recherche vectorielle fonctionne
- [ ] Performance : P95 < 200ms ⚡

---

**Date de migration** : _____________

**Nombre d'agents migrés** : _____________

**Performance mesurée (P95)** : _____________ms
