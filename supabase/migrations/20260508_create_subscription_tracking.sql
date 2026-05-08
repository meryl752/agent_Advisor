-- ============================================================
-- CREATE SUBSCRIPTION TRACKING TABLE
-- Date: 2026-05-08
-- Description:
--   Creates the subscription_tracking table to persist user subscription
--   status (active/inactive) for each tool in their stack.
--   This table enables the ROI Tracker feature to track which tools
--   users are actively subscribed to.
-- ============================================================

-- Create subscription_tracking table
CREATE TABLE IF NOT EXISTS subscription_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one subscription status per user-agent pair
  CONSTRAINT subscription_tracking_user_agent_unique UNIQUE (user_id, agent_id)
);

-- Create index for fast lookups by user_id and agent_id
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_user_agent 
  ON subscription_tracking(user_id, agent_id);

-- Create index for fast lookups by user_id only
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_user_id 
  ON subscription_tracking(user_id);

-- Create index for fast lookups by agent_id only
CREATE INDEX IF NOT EXISTS idx_subscription_tracking_agent_id 
  ON subscription_tracking(agent_id);

-- Auto-update updated_at timestamp on row change
CREATE OR REPLACE FUNCTION update_subscription_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_tracking_updated_at ON subscription_tracking;
CREATE TRIGGER trg_subscription_tracking_updated_at
  BEFORE UPDATE ON subscription_tracking
  FOR EACH ROW EXECUTE FUNCTION update_subscription_tracking_timestamp();

-- Add comments for documentation
COMMENT ON TABLE subscription_tracking IS 'Tracks subscription status (active/inactive) for each user-tool pair';
COMMENT ON COLUMN subscription_tracking.user_id IS 'Clerk user ID (text format)';
COMMENT ON COLUMN subscription_tracking.agent_id IS 'References agents.id - the tool being tracked';
COMMENT ON COLUMN subscription_tracking.is_active IS 'Whether the user has an active subscription to this tool';
COMMENT ON COLUMN subscription_tracking.created_at IS 'Timestamp when the subscription tracking was first created';
COMMENT ON COLUMN subscription_tracking.updated_at IS 'Timestamp when the subscription status was last updated';
