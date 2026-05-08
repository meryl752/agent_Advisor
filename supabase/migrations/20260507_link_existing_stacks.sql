-- ============================================================
-- LINK EXISTING STACKS TO CONVERSATIONS
-- Match stacks to conversations based on user_id and timestamp proximity
-- ============================================================

-- For each stack, find the conversation that was created closest in time
-- and link them together
WITH stack_conversation_matches AS (
  SELECT DISTINCT ON (s.id)
    s.id as stack_id,
    c.session_id,
    s.user_id as stack_user_id,
    c.user_id as conv_user_id,
    ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds
  FROM stacks s
  JOIN users u ON s.user_id = u.clerk_id  -- stacks.user_id is clerk_id (text)
  JOIN conversations c ON u.id = c.user_id  -- conversations.user_id is users.id (uuid)
  WHERE c.stack_id IS NULL  -- Only match conversations that don't have a stack yet
  ORDER BY s.id, time_diff_seconds ASC
)
UPDATE conversations c
SET 
  stack_generated = true,
  stack_id = m.stack_id,
  updated_at = NOW()
FROM stack_conversation_matches m
WHERE c.session_id = m.session_id
  AND m.time_diff_seconds < 300;  -- Only match if within 5 minutes

-- Show the results
SELECT 
  c.session_id,
  c.stack_id,
  s.name as stack_name,
  c.updated_at
FROM conversations c
JOIN stacks s ON c.stack_id = s.id
WHERE c.stack_generated = true
ORDER BY c.updated_at DESC;
