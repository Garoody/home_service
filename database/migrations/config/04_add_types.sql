-- Active: 1767954162611@@127.0.0.1@5432@service_db_dev
-- ============================================================================
-- TODO ÉTAPE 3-B : TYPES ÉNUMÉRÉS (ENUM) (à exécuter avec le rôle postgres)
-- ============================================================================

-- ! Important : Si vous ajoutez une nouvelle valeur dans un type,il faut le supprimer et le recréer !

-- Forcer l'encodage client
SET CLIENT_ENCODING TO 'UTF8';

-- Rôles utilisateurs (Access Control Level)
CREATE TYPE role_enum AS ENUM(
    'admin',         -- Gestion des utilisateurs et des droits
    'client',     -- Utilisateur normal
     'provider'    --pour distinguer les prestataires.
);

COMMENT ON TYPE role_enum IS 'Rôles des utilisateurs pour la gestion des droits Access Controle Level (ACL)';

-- Fournisseurs d'authentification
CREATE TYPE auth_provider_enum AS ENUM(
    'local',        -- Authentification locale
    'google',       -- Authentification Google
    'azure',        -- Authentification Azure
    'apple'         -- Authentification Apple
);

COMMENT ON TYPE auth_provider_enum IS 'Fournisseur d authentification';

-- Types de contenu des pépites
CREATE TYPE content_type_enum AS ENUM(
    'livre',
    'podcast',
    'article',
    'video',
    'note'
);

COMMENT ON TYPE content_type_enum IS 'Types de contenu';

-- Catégories d'événements (analytics & logs)
CREATE TYPE event_category_enum AS ENUM (
    'analytics',   -- Événements métier (login, création item...)
    'audit',       -- Audit trail (modification compte, suppression...)
    'monitoring',  -- Health checks, performance
    'gdpr'         -- Événements RGPD (export, suppression, consentement...)
);

COMMENT ON TYPE event_category_enum IS 'Catégories principales des événements système';

-- Niveaux de sévérité (pour les logs)
CREATE TYPE severity_enum AS ENUM (
    'info',        -- Information normale
    'warning',     -- Avertissement (ex: tentative de login échouée)
    'error',       -- Erreur récupérable (ex: validation échouée)
    'critical'     -- Erreur critique (ex: base de données inaccessible)
);

COMMENT ON TYPE severity_enum IS 'Niveaux de gravité pour les événements de type monitoring/audit';