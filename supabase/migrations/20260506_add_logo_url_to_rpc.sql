-- Fix: Add logo_url and website_url to smart_search_agents_v2 return type
-- Date: 2026-05-06
-- Description:
--   Adds logo_url and website_url fields to the RPC function return type
--   so that the frontend can display tool logos and links properly.

-- Drop the existing function
DROP FUNCTION IF EXISTS smart_search_agents_v2(VECTOR, INTEGER, TEXT, INTEGER);

-- Create updated function with logo_url and website_url
CREATE OR REPLACE FUNCTION smart_search_agents_v2(
  query_embedding VECTOR,
  user_budget_max INTEGER DEFAULT 0,
  user_category TEXT DEFAULT NULL,
  match_count INTEGER DEFAULT 40
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  description TEXT,
  price_from NUMERIC,
  score INTEGER,
  roi_score INTEGER,
  use_cases TEXT[],
  compatible_with TEXT[],
  best_for TEXT[],
  not_for TEXT[],
  integrations TEXT[],
  website_domain TEXT,
  website_url TEXT,
  logo_url TEXT,
  setup_difficulty TEXT,
  time_to_value TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  embedding_dim INTEGER;
BEGIN
  embedding_dim := vector_dims(query_embedding);

  IF embedding_dim = 1024 THEN
    -- Jina AI embeddings (1024 dim) — HNSW index
    IF user_category IS NOT NULL THEN
      RETURN QUERY
      SELECT
        a.id, a.name, a.category, a.description,
        a.price_from, a.score, a.roi_score,
        a.use_cases, a.compatible_with,
        a.best_for, a.not_for, a.integrations,
        a.website_domain, a.website_url, a.logo_url,
        a.setup_difficulty, a.time_to_value,
        (1 - (a.embedding_jina <=> query_embedding))::FLOAT AS similarity
      FROM agents a
      WHERE
        a.embedding_jina IS NOT NULL
        AND (user_budget_max = 0 OR a.price_from <= user_budget_max)
        AND a.category = user_category
      ORDER BY a.embedding_jina <=> query_embedding
      LIMIT match_count;
    ELSE
      RETURN QUERY
      SELECT
        a.id, a.name, a.category, a.description,
        a.price_from, a.score, a.roi_score,
        a.use_cases, a.compatible_with,
        a.best_for, a.not_for, a.integrations,
        a.website_domain, a.website_url, a.logo_url,
        a.setup_difficulty, a.time_to_value,
        (1 - (a.embedding_jina <=> query_embedding))::FLOAT AS similarity
      FROM agents a
      WHERE
        a.embedding_jina IS NOT NULL
        AND (user_budget_max = 0 OR a.price_from <= user_budget_max)
      ORDER BY a.embedding_jina <=> query_embedding
      LIMIT match_count;
    END IF;

  ELSE
    -- HuggingFace embeddings (384 dim) — fallback
    IF user_category IS NOT NULL THEN
      RETURN QUERY
      SELECT
        a.id, a.name, a.category, a.description,
        a.price_from, a.score, a.roi_score,
        a.use_cases, a.compatible_with,
        a.best_for, a.not_for, a.integrations,
        a.website_domain, a.website_url, a.logo_url,
        a.setup_difficulty, a.time_to_value,
        (1 - (a.embedding <=> query_embedding))::FLOAT AS similarity
      FROM agents a
      WHERE
        a.embedding IS NOT NULL
        AND (user_budget_max = 0 OR a.price_from <= user_budget_max)
        AND a.category = user_category
      ORDER BY a.embedding <=> query_embedding
      LIMIT match_count;
    ELSE
      RETURN QUERY
      SELECT
        a.id, a.name, a.category, a.description,
        a.price_from, a.score, a.roi_score,
        a.use_cases, a.compatible_with,
        a.best_for, a.not_for, a.integrations,
        a.website_domain, a.website_url, a.logo_url,
        a.setup_difficulty, a.time_to_value,
        (1 - (a.embedding <=> query_embedding))::FLOAT AS similarity
      FROM agents a
      WHERE
        a.embedding IS NOT NULL
        AND (user_budget_max = 0 OR a.price_from <= user_budget_max)
      ORDER BY a.embedding <=> query_embedding
      LIMIT match_count;
    END IF;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION smart_search_agents_v2(VECTOR, INTEGER, TEXT, INTEGER) TO service_role;
