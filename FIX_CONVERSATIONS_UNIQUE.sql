-- Fix: Add UNIQUE constraint on session_id for upsert to work correctly
-- Run this in Supabase SQL Editor

ALTER TABLE conversations ADD CONSTRAINT conversations_session_id_unique UNIQUE (session_id);
