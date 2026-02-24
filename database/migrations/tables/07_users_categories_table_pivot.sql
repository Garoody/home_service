-- Active: 1767954162611@@127.0.0.1@5432@service_db_dev
-- ============================================================================
-- TODO ÉTAPE 5.5 : TABLE 5 -> ITEM_TAGS (Table de liaison/pivot Many-to-Many) (DDL)

-- Relation Merise : items (0,N) --- (0,N) tags
-- ============================================================================

-- Forcer l'encodage client
SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS user_categories (
    id_category UUID REFERENCES categories (id_category) ON DELETE CASCADE,
    id_user UUID REFERENCES users (id_user) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_category, id_user) -- Clé primaire composite (un item ne peut avoir le même tag qu'une seule fois)
);

-- Index pour requêtes inverses (tous les items d'un tag)
CREATE INDEX idx_user_categories_user ON user_categories (id_category);

-- Documentation
COMMENT ON TABLE user_categories IS 'Table de liaison gérant la relation Many-to-Many entre Items et Tags';
-- Application du trigger