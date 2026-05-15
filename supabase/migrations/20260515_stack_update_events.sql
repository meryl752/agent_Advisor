-- Événements de veille / digest pour le bloc « Updates » (stack suivi).
CREATE TABLE IF NOT EXISTS public.stack_update_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id uuid NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stack_update_events_stack_created
  ON public.stack_update_events (stack_id, created_at DESC);

COMMENT ON TABLE public.stack_update_events IS 'Alertes et points de digest liés à un stack (overview Updates).';
COMMENT ON COLUMN public.stack_update_events.type IS 'Catégorie libre : price_drop, alternative, info, digest, etc.';
