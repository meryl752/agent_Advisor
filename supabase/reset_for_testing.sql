-- ============================================================
-- RESET COMPLET POUR TESTS
-- Supprime tous les stacks et conversations pour repartir proprement
-- ============================================================

-- 1. Supprimer toutes les conversations
DELETE FROM conversations;

-- 2. Supprimer tous les stacks
DELETE FROM stacks;

-- 3. Vérifier que tout est vide
SELECT 
  'APRÈS NETTOYAGE' as status,
  (SELECT COUNT(*) FROM conversations) as conversations_count,
  (SELECT COUNT(*) FROM stacks) as stacks_count;

-- Maintenant vous pouvez créer une nouvelle conversation et tout fonctionnera!
