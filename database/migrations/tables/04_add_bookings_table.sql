-- =====================================================================
-- TABLE: bookings
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

CREATE TABLE IF NOT EXISTS bookings (
    id_booking uuid DEFAULT uuidv7() PRIMARY KEY,
    client_id uuid NOT NULL,
    service_id uuid NOT NULL,
    booking_date date NOT NULL,
    booking_time time NOT NULL,
    status booking_status_enum NOT NULL DEFAULT 'pending',
    total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz,
    CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) REFERENCES users(id_user) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id_service) ON DELETE RESTRICT
);

-- Trigger updated_at
CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

COMMENT ON TABLE bookings IS 'Réservations des clients pour des services';
