# Configuration du Rate Limiting avec Upstash Redis

## Vue d'ensemble

Le rate limiting protège l'API `/api/recommend` contre les abus en limitant le nombre de requêtes par utilisateur selon leur plan d'abonnement.

## Étape 1 : Créer un compte Upstash

1. Aller sur [https://upstash.com](https://upstash.com)
2. Créer un compte gratuit (pas de carte bancaire requise)
3. Le plan gratuit inclut :
   - 10,000 commandes/jour
   - 256 MB de stockage
   - Largement suffisant pour démarrer

## Étape 2 : Créer une base Redis

1. Dans le dashboard Upstash, cliquer sur "Create Database"
2. Choisir un nom (ex: `stackai-rate-limit`)
3. Sélectionner la région la plus proche de ton serveur Vercel
4. Type : **Global** (pour la réplication multi-région)
5. Cliquer sur "Create"

## Étape 3 : Récupérer les credentials

1. Dans la page de ta database, aller dans l'onglet "REST API"
2. Copier les deux valeurs :
   - `UPSTASH_REDIS_REST_URL` (ex: `https://us1-xxx.upstash.io`)
   - `UPSTASH_REDIS_REST_TOKEN` (ex: `AXXXabc123...`)

## Étape 4 : Configurer les variables d'environnement

### En local (`.env.local`)

```env
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXabc123...
RATE_LIMIT_ENABLED=true
```

### Sur Vercel

1. Aller dans ton projet Vercel
2. Settings → Environment Variables
3. Ajouter les 3 variables :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `RATE_LIMIT_ENABLED` = `true`
4. Redéployer l'application

## Étape 5 : Tester le rate limiting

### Test 1 : Vérifier le health check

```bash
curl https://ton-app.vercel.app/api/health/rate-limit
```

Réponse attendue :
```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Test 2 : Faire une requête normale

```bash
curl -X POST https://ton-app.vercel.app/api/recommend \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Automatiser mon marketing"}'
```

Vérifier les headers de réponse :
```
X-RateLimit-Limit: 1
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706788800
```

### Test 3 : Dépasser la limite (free tier)

Refaire la même requête immédiatement. Tu devrais recevoir :

```json
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded for free tier: 1 request per 30 days",
  "limit": 1,
  "remaining": 0,
  "reset": "2024-02-01T12:00:00.000Z",
  "retryAfter": 2592000
}
```

Status code : `429 Too Many Requests`

## Limites par plan

| Plan | Limite | Période | Cas d'usage |
|------|--------|---------|-------------|
| **Free** | 1 requête | 30 jours | Découverte du produit |
| **Pro** | 10 requêtes | 1 heure | Utilisation régulière |
| **Agency** | 50 requêtes | 1 heure | Utilisation intensive |

## Désactiver le rate limiting (dev uniquement)

Pour désactiver temporairement en développement :

```env
RATE_LIMIT_ENABLED=false
```

⚠️ **Ne JAMAIS désactiver en production !**

## Monitoring

### Logs à surveiller

Le rate limiter log automatiquement :

1. **Rate limit dépassé** :
   ```
   [RateLimiter] Rate limit exceeded for user user_abc*** (free tier): 2/1 requests in 30 days
   ```

2. **Échec Redis** :
   ```
   [RedisClient] increment failed: Redis operation timeout
   [RateLimiter] Redis failure, allowing request (fail-open)
   ```

3. **Alertes critiques** :
   ```
   [RateLimiter] ALERT: 10 consecutive Redis failures detected
   ```

### Dashboard Upstash

1. Aller sur [console.upstash.com](https://console.upstash.com)
2. Sélectionner ta database
3. Onglet "Metrics" pour voir :
   - Nombre de commandes/jour
   - Latence moyenne
   - Utilisation mémoire

## Fail-Open Strategy

Si Redis est indisponible, le rate limiter **autorise les requêtes** (fail-open) pour maintenir la disponibilité du service.

Logs en cas de panne Redis :
```
[RateLimiter] Redis failure, allowing request (fail-open)
```

Cette stratégie privilégie la disponibilité sur la protection contre les abus.

## Coûts

### Plan gratuit Upstash
- 10,000 commandes/jour
- Suffisant pour ~300 utilisateurs actifs/jour (free tier)
- **Coût : 0€**

### Plan payant (si nécessaire)
- À partir de 0.2€ pour 100,000 commandes
- Facturation à l'usage
- Pas d'engagement

## Troubleshooting

### Erreur : "Upstash Redis not configured"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifier que `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont définies
2. Redémarrer le serveur de dev : `npm run dev`

### Erreur : "Redis operation timeout"

**Cause** : Latence réseau élevée ou Redis surchargé

**Solution** :
1. Vérifier le status Upstash : [status.upstash.com](https://status.upstash.com)
2. Choisir une région plus proche dans les settings Upstash
3. Les requêtes sont autorisées grâce au fail-open

### Rate limit ne fonctionne pas

**Vérifications** :
1. `RATE_LIMIT_ENABLED=true` dans les variables d'environnement
2. Health check retourne `"status": "healthy"`
3. L'utilisateur est bien authentifié (Clerk)
4. Le plan utilisateur est correctement défini dans Supabase

## Sécurité

✅ **Bonnes pratiques appliquées** :
- Credentials Redis jamais exposés côté client
- Fail-open pour maintenir la disponibilité
- Logs anonymisés (IDs tronqués)
- Timeouts sur toutes les opérations Redis (1s)
- Validation des données Redis

⚠️ **À ne PAS faire** :
- Exposer `UPSTASH_REDIS_REST_TOKEN` dans le code
- Désactiver le rate limiting en production
- Utiliser la même database Redis pour plusieurs environnements

## Support

- Documentation Upstash : [docs.upstash.com](https://docs.upstash.com)
- Discord Upstash : [upstash.com/discord](https://upstash.com/discord)
- Issues GitHub : Créer une issue dans le repo
