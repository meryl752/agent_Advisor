-- Migration: Add Jina AI embeddings support and HNSW index
-- Date: 2025-01-22
-- Description: 
--   1. Add new columns for Jina AI embeddings (1024 dimensions)
--   2. Backup existing HuggingFace embeddings (384 dimensions)
--   3. Create HNSW index for 10x faster vector search
--   4. Update RPC function to support both embedding formats

-- ============================================================================
-- STEP 1: Add new columns to agents table
-- ============================================================================

-- Add column for Jina AI embeddings (1024 dimensions)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS embedding_jina VECTOR(1024);

-- Add column to backup existing HuggingFace embeddings (384 dimensions)
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS embedding_backup VECTOR(384);

-- Add column to track which provider was used
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS embedding_provider TEXT DEFAULT 'huggingface';

-- Add column to track when embedding was last updated
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================================
-- STEP 2: Backup existing embeddings
-- ============================================================================

-- Copy existing HuggingFace embeddings to backup column
UPDATE agents 
SET embedding_backup = embedding 
WHERE embedding_backup IS NULL AND embedding IS NOT NULL;

-- ============================================================================
-- STEP 3: Create HNSW index on Jina embeddings
-- ============================================================================

-- Create HNSW index for fast similarity search
-- Parameters:
--   m = 16: Number of connections per node (balance between speed and accuracy)
--   ef_construction = 64: Size of dynamic candidate list during construction
CREATE INDEX IF NOT EXISTS agents_embedding_jina_hnsw_idx 
ON agents 
USING hnsw (embedding_jina vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- STEP 4: Create updated RPC function for dual embedding support
-- ============================================================================

-- Drop old function if exists
DROP FUNCTION IF EXISTS smart_search_agents_v2(VECTOR, INTEGER, TEXT);

-- Create new function that supports both embedding formats
CREATE OR REPLACE FUNCTION smart_search_agents_v2(
  query_embedding VECTOR,
  user_budget_max INTEGER DEFAULT 0,
  user_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  price_from INTEGER,
  score INTEGER,
  roi_score INTEGER,
  use_cases TEXT[],
  compatible_with TEXT[],
  best_for TEXT[],
  not_for TEXT[],
  integrations TEXT[],
  website_domain TEXT,
  setup_difficulty TEXT,
  time_to_value TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  embedding_dim INTEGER;
BEGIN
  -- Detect embedding dimension to determine which column to use
  embedding_dim := array_length(query_embedding, 1);

  -- Use appropriate column based on dimension
  IF embedding_dim = 1024 THEN
    -- Jina AI embeddings - use HNSW index on embedding_jina
    RETURN QUERY
    SELECT 
      a.id, 
      a.name, 
      a.category, 
      a.description,
      a.price_from, 
      a.score, 
      a.roi_score,
      a.use_cases, 
      a.compatible_with, 
      a.best_for, 
      a.not_for,
      a.integrations, 
      a.website_domain, 
      a.setup_difficulty, 
      a.time_to_value,
      1 - (a.embedding_jina <=> query_embedding) AS similarity
    FROM agents a
    WHERE (user_budget_max = 0 OR a.price_from <= user_budget_max)
      AND (user_category IS NULL OR a.category = user_category)
      AND a.embedding_jina IS NOT NULL
    ORDER BY a.embedding_jina <=> query_embedding
    LIMIT 50;
    
  ELSIF embedding_dim = 384 THEN
    -- HuggingFace embeddings - fallback to backup column
    RETURN QUERY
    SELECT 
      a.id, 
      a.name, 
      a.category, 
      a.description,
      a.price_from, 
      a.score, 
      a.roi_score,
      a.use_cases, 
      a.compatible_with, 
      a.best_for, 
      a.not_for,
      a.integrations, 
      a.website_domain, 
      a.setup_difficulty, 
      a.time_to_value,
      1 - (a.embedding_backup <=> query_embedding) AS similarity
    FROM agents a
    WHERE (user_budget_max = 0 OR a.price_from <= user_budget_max)
      AND (user_category IS NULL OR a.category = user_category)
      AND a.embedding_backup IS NOT NULL
    ORDER BY a.embedding_backup <=> query_embedding
    LIMIT 50;
    
  ELSE
    -- Invalid embedding dimension
    RAISE EXCEPTION 'Invalid embedding dimension: %. Expected 384 or 1024.', embedding_dim;
  END IF;
END;
$$;

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN agents.embedding_jina IS 'Jina AI v4 embeddings (1024 dimensions) - primary embedding column';
COMMENT ON COLUMN agents.embedding_backup IS 'Backup of original HuggingFace embeddings (384 dimensions)';
COMMENT ON COLUMN agents.embedding_provider IS 'Provider used to generate the embedding (jina or huggingface)';
COMMENT ON COLUMN agents.embedding_updated_at IS 'Timestamp of last embedding update';
COMMENT ON INDEX agents_embedding_jina_hnsw_idx IS 'HNSW index for fast similarity search on Jina embeddings';

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================

-- Grant execute permission on the RPC function to authenticated users
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT) TO anon;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- To apply this migration:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify the new columns exist: SELECT * FROM agents LIMIT 1;
-- 3. Verify the HNSW index exists: SELECT indexname FROM pg_indexes WHERE tablename = 'agents';
-- 4. Test the RPC function with a sample embedding
