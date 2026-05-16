-- Notes utilisateur sur les recommandations (stack + agents)
CREATE TABLE IF NOT EXISTS public.stack_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id      uuid NOT NULL REFERENCES public.stacks(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stack_rating  smallint CHECK (stack_rating BETWEEN 1 AND 5),
  stack_comment text,
  agent_ratings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stack_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stack_feedback_stack_id ON public.stack_feedback(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_feedback_user_id ON public.stack_feedback(user_id);

COMMENT ON TABLE public.stack_feedback IS 'User ratings and comments on generated stacks and per-agent recommendations.';
COMMENT ON COLUMN public.stack_feedback.agent_ratings IS 'Array of {agent_name, rating 1-5, comment}.';
