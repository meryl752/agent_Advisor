-- ============================================================
-- FIX CONVERSATIONS SCHEMA
-- Add missing custom_title column and ensure proper indexing
-- ============================================================

-- Add custom_title column if it doesn't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS custom_title TEXT;

-- Add unique constraint on session_id to prevent duplicates
-- This ensures one conversation per session
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_session_id_key'
  ) THEN
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_session_id_key UNIQUE (session_id);
  END IF;
END $$;

-- Create index on stack_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_stack_id ON conversations(stack_id);

-- Add comment to clarify the schema
COMMENT ON COLUMN conversations.custom_title IS 'User-defined title for the conversation (optional)';
COMMENT ON COLUMN conversations.stack_id IS 'References stacks.id if a stack was generated in this conversation';
COMMENT ON COLUMN conversations.session_id IS 'Client-generated UUID for the chat session';
