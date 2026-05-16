-- Télémétrie produit : parcours, génération, notes, suivi digest
CREATE TABLE IF NOT EXISTS public.product_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  session_id  uuid NULL,
  stack_id    uuid NULL REFERENCES public.stacks(id) ON DELETE SET NULL,
  event_name  text NOT NULL,
  properties  jsonb NOT NULL DEFAULT '{}'::jsonb,
  source      text NOT NULL DEFAULT 'api' CHECK (source IN ('web', 'api', 'cron')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name_created
  ON public.product_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_user_created
  ON public.product_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_events_stack_created
  ON public.product_events (stack_id, created_at DESC)
  WHERE stack_id IS NOT NULL;

COMMENT ON TABLE public.product_events IS 'Append-only product analytics (no PII message content by default).';
