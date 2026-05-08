-- ============================================================
-- CONFIGURE ROW LEVEL SECURITY FOR SUBSCRIPTION TABLES
-- Date: 2026-05-08
-- Description:
--   Enables Row Level Security (RLS) on subscription_tracking and
--   subscription_history tables. Users can only access their own
--   subscription data based on their Clerk user ID.
-- ============================================================

-- Enable RLS on both tables
ALTER TABLE subscription_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUBSCRIPTION_TRACKING POLICIES
-- ============================================================

-- Policy: Users can read their own subscription tracking data
DROP POLICY IF EXISTS "subscription_tracking_select_own" ON subscription_tracking;
CREATE POLICY "subscription_tracking_select_own" ON subscription_tracking
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Policy: Users can insert their own subscription tracking data
DROP POLICY IF EXISTS "subscription_tracking_insert_own" ON subscription_tracking;
CREATE POLICY "subscription_tracking_insert_own" ON subscription_tracking
  FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Policy: Users can update their own subscription tracking data
DROP POLICY IF EXISTS "subscription_tracking_update_own" ON subscription_tracking;
CREATE POLICY "subscription_tracking_update_own" ON subscription_tracking
  FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Policy: Users can delete their own subscription tracking data
DROP POLICY IF EXISTS "subscription_tracking_delete_own" ON subscription_tracking;
CREATE POLICY "subscription_tracking_delete_own" ON subscription_tracking
  FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- ============================================================
-- SUBSCRIPTION_HISTORY POLICIES
-- ============================================================

-- Policy: Users can read their own subscription history
DROP POLICY IF EXISTS "subscription_history_select_own" ON subscription_history;
CREATE POLICY "subscription_history_select_own" ON subscription_history
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Policy: Users can insert their own subscription history entries
-- (typically done by the application when status changes)
DROP POLICY IF EXISTS "subscription_history_insert_own" ON subscription_history;
CREATE POLICY "subscription_history_insert_own" ON subscription_history
  FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Note: No UPDATE or DELETE policies for subscription_history
-- History entries should be immutable for audit purposes

-- Add comments for documentation
COMMENT ON POLICY "subscription_tracking_select_own" ON subscription_tracking IS 
  'Users can only read their own subscription tracking data';
COMMENT ON POLICY "subscription_tracking_insert_own" ON subscription_tracking IS 
  'Users can only insert subscription tracking data for themselves';
COMMENT ON POLICY "subscription_tracking_update_own" ON subscription_tracking IS 
  'Users can only update their own subscription tracking data';
COMMENT ON POLICY "subscription_tracking_delete_own" ON subscription_tracking IS 
  'Users can only delete their own subscription tracking data';

COMMENT ON POLICY "subscription_history_select_own" ON subscription_history IS 
  'Users can only read their own subscription history';
COMMENT ON POLICY "subscription_history_insert_own" ON subscription_history IS 
  'Users can only insert subscription history entries for themselves';
