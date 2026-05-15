-- Analyse catalogue agents + embeddings (à exécuter dans Supabase SQL Editor)
-- Objectif : voir la qualité des données alignées avec le moteur (Jina 1024 + RRF matcher)

-- ── 1. Couverture embeddings ─────────────────────────────────────────────
SELECT
  COUNT(*) AS total_agents,
  COUNT(embedding_jina) AS with_jina,
  COUNT(*) - COUNT(embedding_jina) AS missing_jina,
  COUNT(embedding) AS with_legacy_hf,
  COUNT(embedding_backup) AS with_backup_384,
  embedding_provider,
  MIN(embedding_updated_at) AS oldest_embed_at,
  MAX(embedding_updated_at) AS newest_embed_at
FROM agents
GROUP BY embedding_provider
ORDER BY total_agents DESC;

-- ── 2. Richesse des champs (impact retrieval + matcher métier) ─────────────
SELECT
  COUNT(*) FILTER (WHERE description IS NULL OR TRIM(description) = '') AS empty_description,
  COUNT(*) FILTER (WHERE description IS NOT NULL AND LENGTH(TRIM(description)) < 40) AS very_short_description,
  COUNT(*) FILTER (WHERE use_cases IS NULL OR CARDINALITY(use_cases) = 0) AS no_use_cases,
  COUNT(*) FILTER (WHERE best_for IS NULL OR CARDINALITY(best_for) = 0) AS no_best_for,
  COUNT(*) FILTER (WHERE not_for IS NULL OR CARDINALITY(not_for) = 0) AS no_not_for,
  COUNT(*) FILTER (WHERE integrations IS NULL OR CARDINALITY(integrations) = 0) AS no_integrations,
  ROUND(AVG(LENGTH(COALESCE(description, ''))))::INT AS avg_description_len,
  ROUND(AVG(COALESCE(CARDINALITY(use_cases), 0)))::NUMERIC(6,1) AS avg_use_cases_count
FROM agents;

-- ── 3. Répartition par catégorie (déséquilibre = biais reco) ────────────────
SELECT category, COUNT(*) AS n
FROM agents
GROUP BY category
ORDER BY n DESC;

-- ── 4. Agents « pauvres » (priorité enrichissement / re-embed) ─────────────
SELECT id, name, category,
  LENGTH(COALESCE(description, '')) AS desc_len,
  COALESCE(CARDINALITY(use_cases), 0) AS n_use_cases,
  (embedding_jina IS NULL) AS missing_jina
FROM agents
WHERE embedding_jina IS NULL
   OR COALESCE(CARDINALITY(use_cases), 0) < 2
   OR LENGTH(TRIM(COALESCE(description, ''))) < 50
ORDER BY missing_jina DESC, n_use_cases ASC, desc_len ASC
LIMIT 40;

-- ── 5. Doublons de noms (qualité catalogue) ─────────────────────────────────
SELECT name, COUNT(*) AS c
FROM agents
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY c DESC
LIMIT 30;
