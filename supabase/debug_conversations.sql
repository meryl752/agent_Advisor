-- ============================================================
-- DIAGNOSTIC: Check conversations and stacks linking status
-- ============================================================

-- 1. Check conversations table structure and data
SELECT 
  'Conversations Overview' as check_name,
  COUNT(*) as total_conversations,
  COUNT(stack_id) as conversations_with_stack,
  COUNT(*) - COUNT(stack_id) as conversations_without_stack
FROM conversations;

-- 2. Check stacks table
SELECT 
  'Stacks Overview' as check_name,
  COUNT(*) as total_stacks
FROM stacks;

-- 3. Check users table
SELECT 
  'Users Overview' as check_name,
  COUNT(*) as total_users
FROM users;

-- 4. Show sample conversations with their details
SELECT 
  'Sample Conversations' as check_name,
  c.session_id,
  c.user_id,
  c.stack_id,
  c.stack_generated,
  c.created_at,
  u.clerk_id
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Show sample stacks with their details
SELECT 
  'Sample Stacks' as check_name,
  s.id as stack_id,
  s.user_id as stack_clerk_id,
  s.name,
  s.created_at,
  u.id as user_uuid
FROM stacks s
LEFT JOIN users u ON s.user_id = u.clerk_id
ORDER BY s.created_at DESC
LIMIT 10;

-- 6. Try to match stacks to conversations (the correct way via users table)
SELECT 
  'Potential Matches' as check_name,
  s.id as stack_id,
  s.name as stack_name,
  s.created_at as stack_created,
  c.session_id,
  c.created_at as conv_created,
  ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds,
  c.stack_id as current_stack_id
FROM stacks s
JOIN users u ON s.user_id = u.clerk_id
JOIN conversations c ON u.id = c.user_id
ORDER BY s.created_at DESC, time_diff_seconds ASC
LIMIT 20;
