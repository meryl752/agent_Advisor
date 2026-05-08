-- Script SQL pour rendre l'email optionnel dans la table users
-- À exécuter dans: Supabase Dashboard → SQL Editor → New Query

-- Supprimer la contrainte NOT NULL sur la colonne email
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Vérifier que la modification a été appliquée
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';
-- Devrait afficher: is_nullable = YES
