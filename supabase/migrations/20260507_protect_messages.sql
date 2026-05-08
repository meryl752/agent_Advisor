-- ============================================================
-- PROTECT MESSAGES FROM ACCIDENTAL DELETION
-- Add database-level protection to prevent message loss
-- ============================================================

-- 1. Add a trigger to prevent messages from being set to empty array or null
-- if they already contain data
CREATE OR REPLACE FUNCTION protect_conversation_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- If messages already exist and are not empty
  IF OLD.messages IS NOT NULL 
     AND jsonb_array_length(OLD.messages) > 0 
     AND (NEW.messages IS NULL OR jsonb_array_length(NEW.messages) = 0) THEN
    -- Prevent the update - keep old messages
    NEW.messages := OLD.messages;
    RAISE WARNING 'Attempted to delete messages from conversation %. Messages preserved.', OLD.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS protect_messages_trigger ON conversations;
CREATE TRIGGER protect_messages_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION protect_conversation_messages();

-- 2. Add a check to log when messages are modified
CREATE OR REPLACE FUNCTION log_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log significant changes
  IF OLD.messages IS DISTINCT FROM NEW.messages THEN
    RAISE NOTICE 'Messages changed for conversation %: old_count=%, new_count=%',
      NEW.session_id,
      CASE WHEN OLD.messages IS NULL THEN 0 ELSE jsonb_array_length(OLD.messages) END,
      CASE WHEN NEW.messages IS NULL THEN 0 ELSE jsonb_array_length(NEW.messages) END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create logging trigger
DROP TRIGGER IF EXISTS log_message_changes_trigger ON conversations;
CREATE TRIGGER log_message_changes_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_message_changes();

-- 3. Show current state
SELECT 
  'PROTECTION ENABLED' as status,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN messages IS NOT NULL AND jsonb_array_length(messages) > 0 THEN 1 END) as conversations_with_messages
FROM conversations;
