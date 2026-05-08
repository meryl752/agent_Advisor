-- Add logo_url and website_url columns to agents table
-- Date: 2026-05-06
-- Description:
--   Adds logo_url and website_url columns to the agents table
--   to store tool logos and website URLs for display in the frontend.

-- Add logo_url column (nullable, stores direct URL to logo image)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add website_url column (nullable, stores full website URL)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add index on website_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_website_url ON agents(website_url);

-- Add comment for documentation
COMMENT ON COLUMN agents.logo_url IS 'Direct URL to the tool logo image';
COMMENT ON COLUMN agents.website_url IS 'Full website URL (e.g., https://example.com)';
