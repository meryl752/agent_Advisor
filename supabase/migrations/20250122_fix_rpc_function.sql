-- Fix: Update smart_search_agents_v2 to use vector_dims() instead of array_length()
-- Date: 2025-01-22
-- Description: 
--   The array_length() function doesn't work with VECTOR type in pgvector.
--   We need to use vector_dims() instead to get the dimension of a vector.

-- Drop the existing function
DROP FUNCTION IF EXISTS smart_search_agents_v2(VECTOR, INTEGER, TEXT);

-- Create the corrected function
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
  -- Detect embedding dimension using vector_dims() function from pgvector
  embedding_dim := vector_dims(query_embedding);

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT) TO anon;

-- Test the function (optional - comment out if you want to run manually)
-- SELECT smart_search_agents_v2(
--   (SELECT embedding_jina FROM agents WHERE embedding_jina IS NOT NULL LIMIT 1),
--   0,
--   NULL
-- );
