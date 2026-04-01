-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS stack_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id      uuid NOT NULL,          -- references stacks.id (soft ref)
  user_id       uuid NOT NULL,          -- references users.id
  stack_rating  smallint CHECK (stack_rating BETWEEN 1 AND 5),
  stack_comment text,
  agent_ratings jsonb DEFAULT '[]',     -- [{agent_name, rating 1-5, comment}]
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (stack_id, user_id)            -- one feedback per user per stack
);

-- Index for fast lookup by stack
CREATE INDEX IF NOT EXISTS idx_stack_feedback_stack_id ON stack_feedback(stack_id);
CREATE INDEX IF NOT EXISTS idx_stack_feedback_user_id  ON stack_feedback(user_id);
