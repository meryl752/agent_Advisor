-- ============================================================
-- USER MEMORY SYSTEM — Run in Supabase SQL Editor
-- ============================================================

-- ─── 1. user_memory ──────────────────────────────────────────
-- One row per user. Stores compressed AI memory.

CREATE TABLE IF NOT EXISTS user_memory (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Onboarding profile (denormalized for fast access)
  profile               jsonb DEFAULT '{}',
  -- Example:
  -- {
  --   "role": "Founder / CEO",
  --   "sector": "E-commerce",
  --   "team_size": "2–5",
  --   "budget": "$50 – $200",
  --   "main_goal": "Save time on repetitive tasks"
  -- }

  -- Compressed summary of all past stacks (always small, updated progressively)
  stacks_summary        text DEFAULT '',
  -- Example:
  -- "L'utilisateur a généré 4 stacks. Domaines : e-commerce (2), prospection (1), contenu (1).
  --  Budget moyen : 95€/mois. Outils récurrents : Apollo, Canva. Dernier stack : il y a 3 jours."

  -- Compressed summary of all past conversations (always small, updated progressively)
  conversation_summary  text DEFAULT '',
  -- Example:
  -- "L'utilisateur cherche à automatiser sa prospection LinkedIn.
  --  Il utilise déjà Klaviyo. Préfère les outils no-code. Budget limité."

  -- Extracted preferences from interactions
  preferences           jsonb DEFAULT '{}',
  -- Example:
  -- {
  --   "prefers_nocode": true,
  --   "avoids_expensive": true,
  --   "tools_already_using": ["Klaviyo", "Shopify"]
  -- }

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_user_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_memory_updated_at ON user_memory;
CREATE TRIGGER trg_user_memory_updated_at
  BEFORE UPDATE ON user_memory
  FOR EACH ROW EXECUTE FUNCTION update_user_memory_timestamp();


-- ─── 2. conversations ────────────────────────────────────────
-- Stores raw chat sessions. One row per session.

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  text NOT NULL,                    -- client-generated UUID per session
  messages    jsonb NOT NULL DEFAULT '[]',
  -- Example:
  -- [
  --   {"role": "user", "content": "Je veux automatiser ma prospection"},
  --   {"role": "assistant", "content": "Pour la prospection, voici ce que je recommande..."}
  -- ]
  stack_generated  boolean DEFAULT false,       -- did this session produce a stack?
  stack_id         uuid,                        -- references stacks.id if stack was generated
  summarized       boolean DEFAULT false,       -- has this session been compressed into user_memory?
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_summarized ON conversations(summarized) WHERE summarized = false;

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_user_memory_timestamp();


-- ─── 3. RLS Policies ─────────────────────────────────────────
-- Users can only access their own memory and conversations.

ALTER TABLE user_memory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- user_memory: read/write own row only
DROP POLICY IF EXISTS "user_memory_own" ON user_memory;
CREATE POLICY "user_memory_own" ON user_memory
  USING (user_id = (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- conversations: read/write own rows only
DROP POLICY IF EXISTS "conversations_own" ON conversations;
CREATE POLICY "conversations_own" ON conversations
  USING (user_id = (
    SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));
