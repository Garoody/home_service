-- 06_seed_reviews.sql
-- Avis sur une réservation (si possible)

WITH
    one_booking AS (
        SELECT b.id_booking, b.client_id, s.provider_id
        FROM bookings b
            JOIN services s ON s.id_service = b.service_id
        ORDER BY b.created_at ASC
        LIMIT 1
    )
INSERT INTO
    reviews (
        id_review,
        booking_id,
        client_id,
        provider_id,
        rating,
        comment,
        created_at
    )
SELECT
    uuidv7 (),
    id_booking,
    client_id,
    provider_id,
    5,
    'Très bon service, rapide et professionnel !',
    CURRENT_TIMESTAMP
FROM one_booking
ON CONFLICT DO NOTHING;