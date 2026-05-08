# Architecture de Gestion des Conversations

## Principe Fondamental: Séparation des Responsabilités

**RÈGLE D'OR:** Chaque endpoint a UNE seule responsabilité. Jamais de chevauchement.

## Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│                    CONVERSATION LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

1. USER SENDS MESSAGE
   ↓
   /api/chat (POST)
   - Receives user message
   - Calls LLM
   - Returns AI response
   - Does NOT save to database
   ↓
2. FRONTEND SAVES CONVERSATION
   ↓
   /api/memory/update (POST)
   - Saves messages to conversations table
   - Uses saveConversation() function
   - ONLY manages messages field
   - Never touches stack_id or stack_generated
   ↓
3. USER GENERATES STACK
   ↓
   /api/recommend (POST)
   - Generates stack recommendation
   - Saves stack to stacks table
   - Links stack to conversation using linkStackToConversation()
   - ONLY updates stack_id and stack_generated
   - Never touches messages field
   ↓
4. USER VIEWS CONVERSATION
   ↓
   /api/conversations/[sessionId] (GET)
   - Fetches conversation with messages
   - Fetches linked stack if exists
   - Read-only operation
```

## Responsabilités par Endpoint

### `/api/chat` (POST)
**Responsabilité:** Gérer la conversation avec le LLM
- ✅ Recevoir le message utilisateur
- ✅ Appeler le LLM avec contexte
- ✅ Retourner la réponse de l'IA
- ❌ Ne sauvegarde RIEN dans la base de données

### `/api/memory/update` (POST)
**Responsabilité:** Sauvegarder les messages de conversation
- ✅ Sauvegarder/mettre à jour les messages
- ✅ Créer une nouvelle conversation si elle n'existe pas
- ✅ Préserver les informations de stack existantes
- ❌ Ne modifie JAMAIS stack_id ou stack_generated (sauf si explicitement fourni)

### `/api/recommend` (POST)
**Responsabilité:** Générer et sauvegarder un stack
- ✅ Générer la recommandation de stack
- ✅ Sauvegarder le stack dans la table stacks
- ✅ Lier le stack à la conversation via linkStackToConversation()
- ❌ Ne touche JAMAIS au champ messages

### `/api/conversations/[sessionId]` (GET)
**Responsabilité:** Récupérer une conversation complète
- ✅ Charger la conversation avec ses messages
- ✅ Charger le stack lié si il existe
- ❌ Read-only - ne modifie rien

## Fonctions de Base de Données

### `saveConversation(clerkId, sessionId, messages, options?)`
**Responsabilité:** Gérer les messages de conversation

**Comportement:**
1. Si la conversation existe:
   - UPDATE uniquement le champ `messages`
   - Préserve `stack_id` et `stack_generated` existants
   - Sauf si explicitement fourni dans options
2. Si la conversation n'existe pas:
   - INSERT une nouvelle conversation
   - Initialise `stack_id` à null et `stack_generated` à false

**Protection:**
- Vérifie toujours l'existence avant d'agir
- Ne fait JAMAIS d'UPSERT aveugle
- Préserve les données existantes

### `linkStackToConversation(sessionId, stackId)`
**Responsabilité:** Lier un stack à une conversation

**Comportement:**
1. UPDATE uniquement `stack_id` et `stack_generated`
2. Ne touche JAMAIS au champ `messages`
3. Retourne `{ success: boolean, error?: string }`

**Protection:**
- Opération atomique
- Pas de side-effects sur les messages

## Protection au Niveau Base de Données

### Trigger: `protect_messages_trigger`
**Fonction:** Empêcher la suppression accidentelle de messages

**Comportement:**
- Si `messages` contient des données (length > 0)
- Et qu'une UPDATE tente de le mettre à `[]` ou `null`
- Alors le trigger préserve les anciens messages
- Et log un WARNING

**Exemple:**
```sql
-- Tentative de suppression
UPDATE conversations 
SET messages = '[]'::jsonb 
WHERE session_id = 'abc-123';

-- Résultat: messages préservés + WARNING dans les logs
```

### Trigger: `log_message_changes_trigger`
**Fonction:** Logger tous les changements de messages

**Comportement:**
- Log un NOTICE à chaque modification de messages
- Affiche l'ancien et le nouveau nombre de messages
- Permet de tracer les modifications

## Règles de Développement

### ✅ À FAIRE
1. Toujours utiliser `saveConversation()` pour sauvegarder des messages
2. Toujours utiliser `linkStackToConversation()` pour lier un stack
3. Vérifier l'existence avant de modifier
4. Logger toutes les erreurs
5. Tester avec des conversations existantes ET nouvelles

### ❌ À NE JAMAIS FAIRE
1. ❌ Faire un UPSERT aveugle sur conversations
2. ❌ Modifier messages et stack_id dans la même opération
3. ❌ Utiliser `.update()` sans vérifier l'existence
4. ❌ Ignorer les erreurs de base de données
5. ❌ Assumer qu'une conversation existe

## Tests de Non-Régression

Avant chaque déploiement, vérifier:

### Test 1: Nouvelle Conversation
```
1. Créer une nouvelle conversation
2. Envoyer plusieurs messages
3. Vérifier que les messages sont sauvegardés
4. Générer un stack
5. Vérifier que les messages sont toujours là
6. Rafraîchir la page
7. Vérifier que les messages s'affichent
```

### Test 2: Conversation Existante
```
1. Ouvrir une conversation existante avec messages
2. Envoyer un nouveau message
3. Vérifier que les anciens messages sont préservés
4. Générer un nouveau stack
5. Vérifier que les messages sont toujours là
```

### Test 3: Protection des Messages
```
1. Créer une conversation avec messages
2. Tenter de générer un stack (qui ne devrait pas toucher aux messages)
3. Vérifier que les messages sont intacts
4. Vérifier les logs Supabase pour les WARNINGS
```

## Monitoring en Production

### Métriques à Surveiller
1. **Conversations sans messages:** Devrait être 0 ou très faible
2. **Warnings de protection:** Indique des tentatives de suppression
3. **Erreurs de sauvegarde:** Problèmes de base de données
4. **Temps de réponse:** Performance des endpoints

### Requête de Diagnostic
```sql
-- Vérifier la santé des conversations
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN messages IS NOT NULL AND jsonb_array_length(messages) > 0 THEN 1 END) as with_messages,
  COUNT(CASE WHEN stack_id IS NOT NULL THEN 1 END) as with_stack,
  ROUND(100.0 * COUNT(CASE WHEN messages IS NOT NULL AND jsonb_array_length(messages) > 0 THEN 1 END) / COUNT(*), 2) as health_percentage
FROM conversations;

-- health_percentage devrait être > 95% en production
```

## Rollback en Cas de Problème

Si des messages sont perdus en production:

1. **Arrêter les déploiements**
2. **Vérifier les logs Supabase** pour identifier la cause
3. **Restaurer depuis backup** si disponible
4. **Appliquer le trigger de protection** si pas déjà fait
5. **Tester en staging** avant de redéployer

## Conclusion

Cette architecture garantit:
- ✅ Aucune perte de messages
- ✅ Séparation claire des responsabilités
- ✅ Protection au niveau base de données
- ✅ Traçabilité complète
- ✅ Facilité de debugging
- ✅ Scalabilité

**En production, les messages des utilisateurs sont sacrés. Cette architecture les protège.**
