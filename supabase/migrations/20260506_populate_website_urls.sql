-- Populate website_url from website_domain
-- Date: 2026-05-06
-- Description:
--   Generates website_url by adding https:// prefix to website_domain
--   for all agents that have a website_domain but no website_url yet.

UPDATE agents 
SET website_url = 'https://' || website_domain 
WHERE website_domain IS NOT NULL 
  AND website_domain != '' 
  AND website_url IS NULL;
