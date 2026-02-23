-- Active: 1771510940833@@127.0.0.1@5432@service_db_dev
-- =====================================================================
-- TABLE: users
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS users (
    id_user uuid DEFAULT uuidv7 () PRIMARY KEY,
    full_name varchar(150) NOT NULL,
    email citext NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    phone varchar(50),
    address varchar(100),
    role role_enum NOT NULL DEFAULT 'provider',
    gdpr_consent boolean NOT NULL DEFAULT FALSE,
    gdpr_consent_date timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz
);

-- Business checks
ALTER TABLE users
ADD CONSTRAINT chk_email_format CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- Trigger updated_at
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

COMMENT ON TABLE users IS 'Utilisateurs (clients, prestataires, admins) - RGPD ready';