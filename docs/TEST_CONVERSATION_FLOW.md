# Test de Non-Régression: Flux de Conversation

## Objectif
Vérifier que les messages ne sont JAMAIS perdus, même après génération de stack.

## Prérequis
1. Base de données propre (exécuter `cleanup_empty_conversations.sql`)
2. Trigger de protection activé (exécuter `20260507_protect_messages.sql`)
3. Code déployé avec les nouvelles fonctions

## Test 1: Nouvelle Conversation Complète

### Étapes
1. ✅ Aller sur `/dashboard/recommend` (nouvelle session)
2. ✅ Envoyer un message: "Je veux automatiser mon marketing"
3. ✅ Attendre la réponse de l'IA
4. ✅ Envoyer un autre message: "Mon budget est de 100€/mois"
5. ✅ Attendre la réponse de l'IA
6. ✅ Dire "génère" pour déclencher la génération de stack
7. ✅ Attendre que le stack soit généré et affiché
8. ✅ Rafraîchir la page (F5)

### Résultat Attendu
- ✅ Tous les messages (4 au total: 2 user + 2 AI) s'affichent après rafraîchissement
- ✅ Le stack généré s'affiche dans le canvas
- ✅ Aucune erreur 404 dans la console
- ✅ Les logs Supabase ne montrent aucun WARNING de protection

### Vérification Base de Données
```sql
-- Remplacer SESSION_ID par le vrai session_id
SELECT 
  session_id,
  jsonb_array_length(messages) as message_count,
  stack_id,
  stack_generated
FROM conversations
WHERE session_id = 'SESSION_ID';

-- Devrait montrer: message_count = 4, stack_id = [un UUID], stack_generated = true
```

## Test 2: Conversation Existante + Nouveau Stack

### Étapes
1. ✅ Ouvrir une conversation existante avec messages
2. ✅ Vérifier que les messages s'affichent
3. ✅ Envoyer un nouveau message
4. ✅ Générer un nouveau stack
5. ✅ Rafraîchir la page

### Résultat Attendu
- ✅ Tous les anciens messages + nouveaux messages s'affichent
- ✅ Le nouveau stack s'affiche
- ✅ Aucune perte de données

## Test 3: Protection Trigger

### Étapes
1. ✅ Créer une conversation avec messages
2. ✅ Noter le session_id
3. ✅ Dans Supabase SQL Editor, tenter:
```sql
UPDATE conversations 
SET messages = '[]'::jsonb 
WHERE session_id = 'SESSION_ID';
```

### Résultat Attendu
- ✅ La requête s'exécute MAIS les messages sont préservés
- ✅ Un WARNING apparaît dans les logs Supabase
- ✅ Vérifier avec:
```sql
SELECT jsonb_array_length(messages) FROM conversations WHERE session_id = 'SESSION_ID';
-- Devrait toujours montrer le nombre original de messages
```

## Test 4: Génération Multiple de Stacks

### Étapes
1. ✅ Créer une conversation
2. ✅ Envoyer des messages
3. ✅ Générer un premier stack
4. ✅ Continuer la conversation
5. ✅ Générer un deuxième stack (remplace le premier)
6. ✅ Rafraîchir la page

### Résultat Attendu
- ✅ Tous les messages sont préservés
- ✅ Le dernier stack généré s'affiche
- ✅ Aucune perte de messages

## Test 5: Stress Test - Multiples Utilisateurs

### Étapes
1. ✅ Ouvrir 3 onglets avec 3 comptes différents
2. ✅ Dans chaque onglet, créer une conversation
3. ✅ Envoyer des messages simultanément
4. ✅ Générer des stacks simultanément
5. ✅ Rafraîchir tous les onglets

### Résultat Attendu
- ✅ Chaque utilisateur voit ses propres messages
- ✅ Aucune fuite de données entre utilisateurs
- ✅ Tous les messages sont préservés

## Diagnostic en Cas d'Échec

### Si les messages disparaissent:

1. **Vérifier les logs serveur:**
```bash
# Dans le terminal où tourne npm run dev
# Chercher les lignes avec [saveConversation] ou [linkStackToConversation]
```

2. **Vérifier les logs Supabase:**
```sql
-- Voir les dernières modifications
SELECT * FROM conversations 
ORDER BY updated_at DESC 
LIMIT 10;
```

3. **Vérifier que le trigger est actif:**
```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%protect%';
```

4. **Vérifier le code:**
- Est-ce que `saveConversation()` est appelé avec les bons paramètres?
- Est-ce que `linkStackToConversation()` est utilisé au lieu d'un UPDATE direct?
- Y a-t-il des UPSERT ailleurs dans le code?

## Checklist Avant Production

- [ ] Tous les tests passent
- [ ] Trigger de protection activé
- [ ] Aucun UPSERT direct sur conversations dans le code
- [ ] Logs de monitoring configurés
- [ ] Backup automatique activé
- [ ] Documentation à jour
- [ ] Équipe formée sur l'architecture

## Commandes Utiles

### Nettoyer les conversations de test
```sql
-- Supprimer toutes les conversations vides
DELETE FROM conversations 
WHERE messages IS NULL 
   OR messages = '[]'::jsonb 
   OR jsonb_array_length(messages) = 0;
```

### Voir l'état de santé
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN jsonb_array_length(messages) > 0 THEN 1 END) as with_messages,
  ROUND(100.0 * COUNT(CASE WHEN jsonb_array_length(messages) > 0 THEN 1 END) / COUNT(*), 2) as health_pct
FROM conversations;
```

### Voir les conversations récentes
```sql
SELECT 
  session_id,
  jsonb_array_length(messages) as msg_count,
  stack_id IS NOT NULL as has_stack,
  created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 10;
```

## Conclusion

Si tous ces tests passent, l'architecture est **bulletproof** et prête pour la production.

**Aucun message utilisateur ne sera jamais perdu.**
