-- ============================================================
-- CLEANUP: Remove empty conversations from testing phase
-- ============================================================

-- 1. Show what will be deleted
SELECT 
  'CONVERSATIONS TO DELETE' as action,
  c.session_id,
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

-- 2. Delete empty conversations
DELETE FROM conversations
WHERE messages IS NULL 
   OR messages = 'null'::jsonb 
   OR messages = '[]'::jsonb
   OR jsonb_array_length(messages) = 0;

-- 3. Show remaining conversations
SELECT 
  'REMAINING CONVERSATIONS' as status,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN messages IS NOT NULL AND jsonb_array_length(messages) > 0 THEN 1 END) as with_messages,
  COUNT(CASE WHEN stack_id IS NOT NULL THEN 1 END) as with_stack
FROM conversations;
