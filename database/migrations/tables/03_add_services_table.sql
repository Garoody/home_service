-- =====================================================================
-- TABLE: services
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS services (
    id_service uuid DEFAULT uuidv7() PRIMARY KEY,
    provider_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title varchar(150) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz,
    CONSTRAINT fk_services_provider FOREIGN KEY (provider_id) REFERENCES users(id_user) ON DELETE RESTRICT,
    CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES categories(id_category) ON DELETE RESTRICT
);

-- Trigger updated_at
CREATE TRIGGER set_timestamp_services
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);

COMMENT ON TABLE services IS 'Services proposés par les prestataires';
