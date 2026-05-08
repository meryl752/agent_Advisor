-- Add custom_title column to conversations table
-- Run in Supabase SQL Editor

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS custom_title TEXT;
