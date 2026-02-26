-- ============================================
-- 🔐 Permissions for app_service
-- ============================================

-- Accès au schéma
GRANT USAGE ON SCHEMA public TO app_service;

-- Tables EXISTANTES
GRANT
SELECT, INSERT,
UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_service;

-- Séquences EXISTANTES
GRANT USAGE,
SELECT ON ALL SEQUENCES IN SCHEMA public TO app_service;

-- Tables FUTURES créées par postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT
SELECT, INSERT,
UPDATE, DELETE ON TABLES TO app_service;

-- Séquences FUTURES créées par postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
GRANT USAGE,
SELECT ON SEQUENCES TO app_service;