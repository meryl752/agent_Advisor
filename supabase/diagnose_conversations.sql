-- ============================================================
-- DIAGNOSTIC: Vérifier pourquoi les conversations ne s'affichent pas
-- ============================================================

-- 1. Voir toutes les conversations avec leurs détails
SELECT 
  'TOUTES LES CONVERSATIONS' as check_name,
  c.session_id,
  c.user_id as conv_user_uuid,
  u.clerk_id,
  u.email,
  c.stack_id,
  c.stack_generated,
  jsonb_array_length(c.messages) as message_count,
  c.created_at,
  c.updated_at
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 2. Voir les conversations SANS messages
SELECT 
  'CONVERSATIONS SANS MESSAGES' as check_name,
  c.session_id,
  u.clerk_id,
  u.email,
  c.stack_id,
  c.created_at
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.messages IS NULL 
   OR c.messages = 'null'::jsonb 
   OR c.messages = '[]'::jsonb
   OR jsonb_array_length(c.messages) = 0
ORDER BY c.created_at DESC;

-- 3. Voir les conversations AVEC messages
SELECT 
  'CONVERSATIONS AVEC MESSAGES' as check_name,
  c.session_id,
  u.clerk_id,
  u.email,
  jsonb_array_length(c.messages) as message_count,
  c.messages->0->>'role' as first_message_role,
  LEFT(c.messages->0->>'content', 50) as first_message_preview,
  c.created_at
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
WHERE c.messages IS NOT NULL 
  AND c.messages != 'null'::jsonb
  AND jsonb_array_length(c.messages) > 0
ORDER BY c.created_at DESC;

-- 4. Compter les conversations par utilisateur
SELECT 
  'CONVERSATIONS PAR UTILISATEUR' as check_name,
  u.clerk_id,
  u.email,
  COUNT(c.id) as total_conversations,
  COUNT(CASE WHEN c.messages IS NOT NULL AND jsonb_array_length(c.messages) > 0 THEN 1 END) as with_messages,
  COUNT(CASE WHEN c.stack_id IS NOT NULL THEN 1 END) as with_stack
FROM users u
LEFT JOIN conversations c ON c.user_id = u.id
GROUP BY u.id, u.clerk_id, u.email
ORDER BY total_conversations DESC;
