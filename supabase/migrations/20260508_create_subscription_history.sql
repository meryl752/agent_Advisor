-- ============================================================
-- CREATE SUBSCRIPTION HISTORY TABLE
-- Date: 2026-05-08
-- Description:
--   Creates the subscription_history table to track all changes
--   to subscription status over time. This enables users to view
--   their subscription change history in the ROI Tracker.
-- ============================================================

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  previous_status boolean NOT NULL,
  new_status boolean NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for fast lookups by user_id and changed_at (for history queries)
-- Most recent first ordering
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_changed 
  ON subscription_history(user_id, changed_at DESC);

-- Create index for fast lookups by agent_id (for tool-specific history)
CREATE INDEX IF NOT EXISTS idx_subscription_history_agent_id 
  ON subscription_history(agent_id);

-- Create index for fast lookups by changed_at (for time-based queries)
CREATE INDEX IF NOT EXISTS idx_subscription_history_changed_at 
  ON subscription_history(changed_at DESC);

-- Add comments for documentation
COMMENT ON TABLE subscription_history IS 'Audit log of all subscription status changes';
COMMENT ON COLUMN subscription_history.user_id IS 'Clerk user ID (text format)';
COMMENT ON COLUMN subscription_history.agent_id IS 'References agents.id - the tool whose status changed';
COMMENT ON COLUMN subscription_history.previous_status IS 'Subscription status before the change';
COMMENT ON COLUMN subscription_history.new_status IS 'Subscription status after the change';
COMMENT ON COLUMN subscription_history.changed_at IS 'Timestamp when the status change occurred';
