-- Session locale (FR/EN) + stack health breakdown
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

COMMENT ON COLUMN public.conversations.locale IS 'User-facing language for this chat session (en | fr).';

ALTER TABLE public.stacks
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.stacks.score_breakdown IS 'Decomposed stack health: dimensions, tips, computed_at.';

CREATE TABLE IF NOT EXISTS public.stack_score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id uuid NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  overall smallint NOT NULL CHECK (overall >= 0 AND overall <= 100),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stack_score_snapshots_stack_created
  ON public.stack_score_snapshots (stack_id, created_at DESC);
