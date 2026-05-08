-- ============================================================
-- LINK EXISTING STACKS TO CONVERSATIONS (V2 - More Robust)
-- Match stacks to conversations based on user and timestamp proximity
-- ============================================================

-- Step 1: Show what we're about to link (for verification)
DO $$
DECLARE
  match_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO match_count
  FROM (
    SELECT DISTINCT ON (s.id)
      s.id as stack_id,
      c.session_id,
      s.user_id as stack_clerk_id,
      u.clerk_id as user_clerk_id,
      c.user_id as conv_user_uuid,
      u.id as user_uuid,
      ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds
    FROM stacks s
    JOIN users u ON s.user_id = u.clerk_id  -- stacks.user_id is clerk_id (TEXT)
    JOIN conversations c ON u.id = c.user_id  -- conversations.user_id is users.id (UUID)
    WHERE c.stack_id IS NULL  -- Only match conversations without a stack
      AND ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) < 300  -- Within 5 minutes
    ORDER BY s.id, time_diff_seconds ASC
  ) matches;
  
  RAISE NOTICE 'Found % potential stack-conversation matches', match_count;
END $$;

-- Step 2: Perform the linking
WITH stack_conversation_matches AS (
  SELECT DISTINCT ON (s.id)
    s.id as stack_id,
    c.session_id,
    s.user_id as stack_clerk_id,
    c.user_id as conv_user_uuid,
    ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds
  FROM stacks s
  JOIN users u ON s.user_id = u.clerk_id  -- stacks.user_id is clerk_id (TEXT)
  JOIN conversations c ON u.id = c.user_id  -- conversations.user_id is users.id (UUID)
  WHERE c.stack_id IS NULL  -- Only match conversations without a stack
    AND ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) < 300  -- Within 5 minutes
  ORDER BY s.id, time_diff_seconds ASC
)
UPDATE conversations c
SET 
  stack_generated = true,
  stack_id = m.stack_id,
  updated_at = NOW()
FROM stack_conversation_matches m
WHERE c.session_id = m.session_id;

-- Step 3: Show the results
SELECT 
  'Linked Conversations' as result_type,
  c.session_id,
  c.stack_id,
  s.name as stack_name,
  s.user_id as stack_clerk_id,
  u.clerk_id as user_clerk_id,
  c.created_at as conversation_created,
  s.created_at as stack_created,
  ABS(EXTRACT(EPOCH FROM (s.created_at - c.created_at))) as time_diff_seconds
FROM conversations c
JOIN stacks s ON c.stack_id = s.id
JOIN users u ON c.user_id = u.id
WHERE c.stack_generated = true
ORDER BY c.updated_at DESC;

-- Step 4: Show unlinked conversations (for debugging)
SELECT 
  'Unlinked Conversations' as result_type,
  c.session_id,
  c.user_id,
  u.clerk_id,
  c.created_at,
  c.stack_generated
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.stack_id IS NULL
ORDER BY c.created_at DESC
LIMIT 10;

-- Step 5: Show unlinked stacks (for debugging)
SELECT 
  'Unlinked Stacks' as result_type,
  s.id as stack_id,
  s.name,
  s.user_id as clerk_id,
  s.created_at
FROM stacks s
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.stack_id = s.id
)
ORDER BY s.created_at DESC
LIMIT 10;
