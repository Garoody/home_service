-- ============================================================================
--  TODO ÉTAPE 3-A : EXTENSIONS (à exécuter avec le rôle postgres)
-- ============================================================================

-- Extensions modernes PostgreSQL
CREATE EXTENSION IF NOT EXISTS "citext";
-- Texte insensible à la casse (email,)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- Recherche floue (Trigram) pour le moteur de recherche
CREATE EXTENSION IF NOT EXISTS "btree_gin";
-- Indexation performante pour les types standards.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Fonctions crypto (optionnel)