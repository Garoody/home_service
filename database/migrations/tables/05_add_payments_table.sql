-- =====================================================================
-- TABLE: payments
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS payments (
    id_payment uuid DEFAULT uuidv7() PRIMARY KEY,
    booking_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id_booking) ON DELETE CASCADE,
    CONSTRAINT uq_payments_booking UNIQUE (booking_id)
);

-- Trigger updated_at
CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

COMMENT ON TABLE payments IS 'Paiements liés aux réservations';
