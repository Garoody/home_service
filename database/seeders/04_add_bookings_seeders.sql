-- 04_seed_bookings.sql
-- Crée 2 réservations pour "Client Test" sur les services existants

SET CLIENT_ENCODING TO 'UTF8';

WITH
    client AS (
        SELECT id_user
        FROM users
        WHERE
            email = 'client@homeservices.local'
        LIMIT 1
    ),
    svc AS (
        SELECT id_service, price
        FROM services
        ORDER BY created_at DESC
        LIMIT 2
    )
INSERT INTO
    bookings (
        id_booking,
        client_id,
        service_id,
        booking_date,
        booking_time,
        status,
        total_price,
        created_at
    )
SELECT uuidv7 (), (
        SELECT id_user
        FROM client
    ), s.id_service, CURRENT_DATE + (ROW_NUMBER() OVER ())::int, TIME '14:00', 'pending', s.price, CURRENT_TIMESTAMP
FROM svc s
ON CONFLICT DO NOTHING;