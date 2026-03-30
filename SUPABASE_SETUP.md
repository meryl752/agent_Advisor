# Configuration Supabase - StackAI

## Clés API requises

Ton projet nécessite 3 clés Supabase:

### 1. NEXT_PUBLIC_SUPABASE_URL
- **Où la trouver:** Supabase Dashboard → Settings → API → Project URL
- **Exemple:** `https://xxxxx.supabase.co`
- **Usage:** URL publique de ton projet Supabase
- **Visibilité:** Publique (côté client)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Où la trouver:** Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Exemple:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Usage:** Clé publique pour les requêtes authentifiées côté client
- **Visibilité:** Publique (côté client)
- **Permissions:** Limitées par Row Level Security (RLS)

### 3. SUPABASE_SERVICE_ROLE_KEY ⚠️ CRITIQUE
- **Où la trouver:** Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Exemple:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (différent de anon)
- **Usage:** Clé secrète pour les opérations serveur (webhooks, auto-création users)
- **Visibilité:** PRIVÉE (serveur uniquement, JAMAIS côté client)
- **Permissions:** TOUTES - bypass RLS

## ⚠️ SÉCURITÉ CRITIQUE

**JAMAIS exposer la `service_role` key:**
- ❌ Ne JAMAIS la commiter dans git
- ❌ Ne JAMAIS l'utiliser côté client
- ❌ Ne JAMAIS la partager publiquement
- ✅ Uniquement dans `.env.local` (ignoré par git)
- ✅ Uniquement pour les opérations serveur

## Configuration dans .env.local

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjA1NTgsImV4cCI6MjA4OTgzNjU1OH0.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MDU1OCwiZXhwIjoyMDg5ODM2NTU4fQ.xxxxx
```

## Pourquoi la service_role key est nécessaire?

### Sans service_role key:
- ❌ Les webhooks Clerk ne peuvent pas créer d'utilisateurs dans Supabase
- ❌ L'auto-création d'utilisateurs échoue
- ❌ Erreur: "Failed to create user for Clerk ID: xxx"
- ❌ Les utilisateurs doivent être créés manuellement dans Supabase

### Avec service_role key:
- ✅ Les webhooks Clerk créent automatiquement les utilisateurs
- ✅ L'auto-création fonctionne si le webhook échoue
- ✅ Synchronisation parfaite Clerk ↔ Supabase
- ✅ Expérience utilisateur fluide

## Vérification

Après avoir ajouté la clé, redémarre le serveur:

```bash
npm run dev
```

Tu devrais voir dans les logs:
- `✅ Auto-created user for Clerk ID: user_xxx` (si auto-création)
- `✅ Webhook: User xxx synced to Supabase` (si webhook)

Au lieu de:
- `❌ SUPABASE_SERVICE_ROLE_KEY is missing - cannot auto-create users`
- `❌ Failed to create user for Clerk ID: xxx`

## Schéma de la table users

Ta table `users` dans Supabase doit avoir cette structure:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free',
  full_name TEXT,
  avatar_url TEXT,
  stacks_count INTEGER DEFAULT 0,
  last_signed_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches rapides par clerk_id
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
```

## Dépannage

### Erreur: "Failed to create user"
1. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est dans `.env.local`
2. Vérifie que la clé commence par `eyJhbGciOiJIUzI1NiI...`
3. Vérifie que c'est bien la clé `service_role` et pas `anon`
4. Redémarre le serveur après avoir ajouté la clé

### Erreur: "User not found"
1. L'utilisateur existe dans Clerk mais pas dans Supabase
2. Le webhook n'a pas fonctionné (normal en dev local)
3. L'auto-création devrait le créer au premier appel API
4. Si ça échoue, c'est que la `service_role` key manque

### Le webhook ne fonctionne pas en dev local
C'est normal! Clerk ne peut pas atteindre `localhost`. Solutions:
- Utilise ngrok/localtunnel pour exposer ton localhost
- Ou déploie en production pour tester le webhook
- En dev, l'auto-création via `ensureUserExists()` suffit
