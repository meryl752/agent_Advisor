-- Suivi « stack actif » pour futurs digests (coûts, alternatives, etc.)
ALTER TABLE stacks
  ADD COLUMN IF NOT EXISTS digest_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_enabled_at timestamptz NULL;

COMMENT ON COLUMN stacks.digest_enabled IS 'Si true, ce stack est celui suivi pour les mises à jour / digests.';
COMMENT ON COLUMN stacks.digest_enabled_at IS 'Date à laquelle le suivi digest a été activé (réinitialisé à chaque activation).';

CREATE INDEX IF NOT EXISTS idx_stacks_user_digest_enabled
  ON stacks (user_id)
  WHERE digest_enabled = true;
