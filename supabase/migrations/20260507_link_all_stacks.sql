-- ============================================================
-- LINK ALL EXISTING STACKS TO CONVERSATIONS
-- This version links ALL stacks to their most recent conversation
-- regardless of time difference (more permissive than the 5-minute window)
-- ============================================================

-- Step 1: Show current state
SELECT 
  'BEFORE LINKING' as status,
  COUNT(*) as total_conversations,
  COUNT(stack_id) as conversations_with_stack,
  COUNT(*) - COUNT(stack_id) as conversations_without_stack
FROM conversations;

-- Step 2: Link each stack to its user's most recent conversation
-- (or the conversation closest in time to when the stack was created)
WITH stack_conversation_matches AS (
  SELECT DISTINCT ON (s.id)
    s.id as stack_id,
    c.session_id,
    c.user_id as conv_user_uuid,
    s.user_id as stack_clerk_id,
    u.clerk_id as user_clerk_id,
    s.created_at as stack_created,
    c.created_at as conv_created,
    ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds
  FROM stacks s
  JOIN users u ON s.user_id = u.clerk_id  -- stacks.user_id is clerk_id (TEXT)
  JOIN conversations c ON u.id = c.user_id  -- conversations.user_id is users.id (UUID)
  WHERE c.stack_id IS NULL  -- Only match conversations without a stack
  ORDER BY s.id, time_diff_seconds ASC  -- Pick the closest conversation in time
)
UPDATE conversations c
SET 
  stack_generated = true,
  stack_id = m.stack_id,
  updated_at = NOW()
FROM stack_conversation_matches m
WHERE c.session_id = m.session_id;

-- Step 3: Show results after linking
SELECT 
  'AFTER LINKING' as status,
  COUNT(*) as total_conversations,
  COUNT(stack_id) as conversations_with_stack,
  COUNT(*) - COUNT(stack_id) as conversations_without_stack
FROM conversations;

-- Step 4: Show all linked conversations with details
SELECT 
  'LINKED CONVERSATIONS' as result_type,
  c.session_id,
  c.stack_id,
  s.name as stack_name,
  u.clerk_id,
  c.created_at as conversation_created,
  s.created_at as stack_created,
  ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds,
  ROUND(ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) / 60.0, 1) as time_diff_minutes
FROM conversations c
JOIN stacks s ON c.stack_id = s.id
JOIN users u ON c.user_id = u.id
WHERE c.stack_generated = true
ORDER BY c.updated_at DESC;

-- Step 5: Show conversations that still don't have a stack
-- (These are conversations where the user chatted but never generated a stack)
SELECT 
  'CONVERSATIONS WITHOUT STACK' as result_type,
  c.session_id,
  u.clerk_id,
  c.created_at,
  ARRAY_LENGTH(c.messages, 1) as message_count
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.stack_id IS NULL
ORDER BY c.created_at DESC;

-- Step 6: Show stacks that don't have a conversation
-- (This shouldn't happen in normal flow, but might exist from old data)
SELECT 
  'STACKS WITHOUT CONVERSATION' as result_type,
  s.id as stack_id,
  s.name,
  s.user_id as clerk_id,
  s.created_at
FROM stacks s
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.stack_id = s.id
)
ORDER BY s.created_at DESC;
