-- =========================================
-- SUPPRESSION DE TOUS LES TYPES (ENUM)
-- PROJET HOMESERVICES
-- =========================================

-- Types legacy ou experimentaux
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Types utilises par les migrations actuelles
DROP TYPE IF EXISTS payment_status_enum CASCADE;
DROP TYPE IF EXISTS booking_status_enum CASCADE;
DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS auth_provider_enum CASCADE;
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS event_category_enum CASCADE;
DROP TYPE IF EXISTS severity_enum CASCADE;

-- Pourquoi cet ordre ?
-- Les types peuvent etre references par plusieurs tables ou objets SQL.
-- L'utilisation de CASCADE permet de nettoyer proprement les dependances restantes.
