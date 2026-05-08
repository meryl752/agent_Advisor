-- Simple diagnostic to understand the current state

-- 1. Count everything
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM conversations) as total_conversations,
  (SELECT COUNT(*) FROM conversations WHERE stack_id IS NOT NULL) as conversations_with_stack,
  (SELECT COUNT(*) FROM stacks) as total_stacks;

-- 2. Show all conversations with user info
SELECT 
  c.session_id,
  c.user_id as conv_user_uuid,
  u.clerk_id,
  c.stack_id,
  c.stack_generated,
  c.created_at,
  ARRAY_LENGTH(c.messages, 1) as message_count
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- 3. Show all stacks with user info
SELECT 
  s.id as stack_id,
  s.name,
  s.user_id as stack_clerk_id,
  u.id as user_uuid,
  u.clerk_id,
  s.created_at,
  (SELECT COUNT(*) FROM conversations WHERE stack_id = s.id) as linked_conversations
FROM stacks s
LEFT JOIN users u ON s.user_id = u.clerk_id
ORDER BY s.created_at DESC;
