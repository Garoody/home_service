-- Active: 1767954162611@@127.0.0.1@5432@service_db_dev

-- service - Base de données principale
-- Version: 1.0.0
-- Date: 2026-01-08
-- Description: Coffre-fort numérique personnel (Deuxième Cerveau)
-- ============================================================================

-- ============================================================================
-- TODO ÉTAPE 1 (DCL/DDL) : CRÉATION DE LA BASE DE DONNÉES (à exécuter avec le rôle postgres)
-- ============================================================================

-- Création de la base avec support UTF8 complet
CREATE DATABASE service_db_dev WITH ENCODING = 'UTF8';

COMMENT ON DATABASE service_db_dev IS 'Base de données principales du projet service - Coffre-fort numérique';


