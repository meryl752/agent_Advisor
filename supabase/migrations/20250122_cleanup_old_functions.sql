-- Cleanup: Remove old smart_search_agents functions to avoid conflicts
-- Date: 2025-01-22
-- Description: 
--   Remove all versions of the old smart_search_agents function
--   to ensure only smart_search_agents_v2 is used

-- Drop all versions of the old function
DROP FUNCTION IF EXISTS smart_search_agents(VECTOR, DOUBLE PRECISION, TEXT);
DROP FUNCTION IF EXISTS smart_search_agents(VECTOR, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS smart_search_agents(VECTOR, INTEGER, TEXT);
DROP FUNCTION IF EXISTS smart_search_agents(VECTOR);

-- Verify smart_search_agents_v2 exists and has correct signature
-- (This should already exist from previous migration)
-- If not, uncomment and run the full function creation from 20250122_fix_rpc_types.sql
