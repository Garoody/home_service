-- =====================================================================
-- TABLE: categories
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS categories (
    id_category uuid DEFAULT uuidv7() PRIMARY KEY,
    name varchar(100) NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz
);

-- Trigger updated_at
CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE categories IS 'Catégories de services (plomberie, ménage, etc.)';
