-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS guide_cache (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key  text UNIQUE NOT NULL,
  content    text NOT NULL,           -- JSON string of implementation steps
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guide_cache_key ON guide_cache(cache_key);
