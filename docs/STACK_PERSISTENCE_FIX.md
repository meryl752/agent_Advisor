# Stack Persistence - Plan de correction complet

## Problème actuel
Les stacks générées ne sont pas correctement liées aux conversations, ce qui empêche :
1. De retrouver la conversation où un stack a été généré
2. D'afficher les stacks dans "My Stacks" avec un lien vers la conversation
3. De naviguer entre les conversations et les stacks

## Architecture cible

### Tables et relations
```
users (table Clerk/Supabase)
  ├─ id (uuid)
  └─ clerk_id (string)

conversations
  ├─ id (uuid, PK)
  ├─ user_id (uuid, FK → users.id)
  ├─ session_id (text, UNIQUE) ← identifiant client de la session
  ├─ custom_title (text, nullable) ← titre personnalisé
  ├─ messages (jsonb) ← historique du chat
  ├─ stack_generated (boolean)
  ├─ stack_id (uuid, FK → stacks.id) ← lien vers le stack généré
  ├─ created_at (timestamptz)
  └─ updated_at (timestamptz)

stacks
  ├─ id (uuid, PK)
  ├─ user_id (uuid, FK → users.id)
  ├─ name (text)
  ├─ objective (text)
  ├─ agent_ids (text[])
  ├─ total_cost (numeric)
  ├─ roi_estimate (numeric)
  ├─ score (numeric)
  ├─ created_at (timestamptz)
  └─ updated_at (timestamptz)
```

### Flux de données

#### 1. Création d'une conversation
```
User ouvre /dashboard/recommend
  → Frontend génère un session_id (UUID)
  → User envoie des messages
  → POST /api/chat avec { session_id, message }
  → Sauvegarde dans conversations via saveConversation()
```

#### 2. Génération d'un stack
```
User demande un stack
  → POST /api/recommend avec { session_id, objective, ... }
  → runOrchestrator() génère le stack
  → saveStack() crée une ligne dans stacks
  → UPSERT dans conversations pour lier stack_id + session_id
  → Frontend affiche le stack
```

#### 3. Affichage dans "My Stacks"
```
User va sur /dashboard/stack
  → Récupère tous les stacks de l'user
  → Pour chaque stack, récupère le session_id depuis conversations
  → Affiche les cards avec lien vers /dashboard/recommend/{session_id}
```

#### 4. Retour à une conversation
```
User clique sur un stack dans "My Stacks"
  → Navigation vers /dashboard/recommend/{session_id}
  → Page charge la conversation depuis conversations
  → Affiche l'historique des messages
  → Affiche le stack généré via /api/stacks/{stack_id}
```

## Corrections nécessaires

### 1. Migration SQL ✅
Fichier: `stackai/supabase/migrations/20260507_fix_conversations_schema.sql`
- Ajouter `custom_title` à conversations
- Ajouter contrainte UNIQUE sur `session_id`
- Ajouter index sur `stack_id`

### 2. Mise à jour de saveConversation() 
Fichier: `stackai/lib/supabase/memory.ts`
- Ajouter paramètre `customTitle` optionnel
- Sauvegarder `custom_title` dans l'UPSERT

### 3. Mise à jour de l'API /api/recommend
Fichier: `stackai/app/api/recommend/route.ts`
- S'assurer que l'UPSERT inclut tous les champs nécessaires
- Vérifier que `user_id` est bien le UUID de la table users (pas clerk_id)

### 4. Mise à jour de la page /dashboard/stack
Fichier: `stackai/app/[locale]/dashboard/stack/page.tsx`
- Récupérer correctement le `user_id` (UUID) depuis users
- Filtrer les conversations par `user_id`
- Construire le `stackSessionMap` correctement

### 5. Mise à jour de la page /dashboard/recommend/[sessionId]
Fichier: `stackai/app/[locale]/dashboard/recommend/[sessionId]/page.tsx`
- Charger la conversation depuis `conversations` table
- Afficher l'historique des messages
- Si `stack_id` existe, charger et afficher le stack

## Tests à effectuer

1. **Créer une nouvelle conversation**
   - Aller sur /dashboard/recommend
   - Envoyer quelques messages
   - Vérifier que la conversation est sauvegardée dans la DB

2. **Générer un stack**
   - Dans la conversation, demander un stack
   - Vérifier que le stack est créé dans `stacks`
   - Vérifier que `conversations.stack_id` est mis à jour
   - Vérifier que `conversations.stack_generated = true`

3. **Voir le stack dans "My Stacks"**
   - Aller sur /dashboard/stack
   - Vérifier que le stack apparaît
   - Cliquer sur le stack
   - Vérifier qu'on arrive sur la bonne conversation

4. **Retour à la conversation**
   - La conversation doit afficher l'historique complet
   - Le stack doit être affiché avec tous les détails
   - Les logos et liens doivent être présents

## Ordre d'exécution

1. ✅ Exécuter la migration SQL dans Supabase
2. Mettre à jour `memory.ts`
3. Vérifier `/api/recommend/route.ts`
4. Vérifier `/dashboard/stack/page.tsx`
5. Tester le flux complet
6. Corriger les bugs éventuels

## Notes importantes

- **session_id** : Généré côté client (UUID), unique par conversation
- **user_id** : UUID de la table `users`, PAS le `clerk_id`
- **stack_id** : UUID de la table `stacks`, lien vers le stack généré
- **custom_title** : Titre personnalisé de la conversation (optionnel)

## Vérifications DB

```sql
-- Vérifier qu'une conversation est bien liée à un stack
SELECT 
  c.session_id,
  c.custom_title,
  c.stack_generated,
  c.stack_id,
  s.name as stack_name,
  s.objective
FROM conversations c
LEFT JOIN stacks s ON c.stack_id = s.id
WHERE c.user_id = 'USER_UUID_HERE'
ORDER BY c.updated_at DESC;

-- Vérifier qu'un stack a bien une conversation associée
SELECT 
  s.id as stack_id,
  s.name as stack_name,
  c.session_id,
  c.custom_title
FROM stacks s
LEFT JOIN conversations c ON c.stack_id = s.id
WHERE s.user_id = 'USER_UUID_HERE'
ORDER BY s.created_at DESC;
```
