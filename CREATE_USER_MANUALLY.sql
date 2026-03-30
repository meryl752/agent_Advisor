-- Script SQL pour créer manuellement l'utilisateur dans Supabase
-- À exécuter dans: Supabase Dashboard → SQL Editor → New Query

-- Remplace 'user_3BLFcjLZiDqKhTPcZbl6Mge4PyT' par ton vrai Clerk ID
-- Remplace 'ton-email@example.com' par ton vrai email

INSERT INTO users (clerk_id, email, plan, created_at)
VALUES (
  'user_3BLFcjLZiDqKhTPcZbl6Mge4PyT',
  'ton-email@example.com',
  'free',
  NOW()
)
ON CONFLICT (clerk_id) DO NOTHING;

-- Vérifier que l'utilisateur a été créé
SELECT * FROM users WHERE clerk_id = 'user_3BLFcjLZiDqKhTPcZbl6Mge4PyT';
