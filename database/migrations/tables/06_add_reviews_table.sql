-- =====================================================================
-- TABLE: reviews
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS reviews (
    id_review uuid DEFAULT uuidv7() PRIMARY KEY,
    booking_id uuid NOT NULL,
    client_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz,
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id_booking) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_client FOREIGN KEY (client_id) REFERENCES users(id_user) ON DELETE RESTRICT,
    CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES users(id_user) ON DELETE RESTRICT,
    CONSTRAINT uq_reviews_booking UNIQUE (booking_id)
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_timestamp_reviews ON reviews;
CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);

COMMENT ON TABLE reviews IS 'Avis des clients (note + commentaire) après une réservation';
