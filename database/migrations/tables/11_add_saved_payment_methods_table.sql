-- =====================================================================
-- TABLE: saved_payment_methods
-- Stockage securise des cartes enregistrees (jamais le numero complet ni le CVC)
-- Cette table sert uniquement a memoriser des metadonnees utiles au client:
-- marque, 4 derniers chiffres, expiration et nom du titulaire.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id_saved_payment_method uuid DEFAULT uuidv7() PRIMARY KEY,
    user_id uuid NOT NULL,
    brand varchar(30) NOT NULL,
    last4 varchar(4) NOT NULL,
    exp_month int NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
    exp_year int NOT NULL CHECK (exp_year >= 2024),
    cardholder_name varchar(120) NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz,
    CONSTRAINT fk_saved_payment_methods_user FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE
);

CREATE TRIGGER set_timestamp_saved_payment_methods
BEFORE UPDATE ON saved_payment_methods
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user ON saved_payment_methods(user_id);

COMMENT ON TABLE saved_payment_methods IS 'Cartes enregistrees sous forme de metadonnees non sensibles';
