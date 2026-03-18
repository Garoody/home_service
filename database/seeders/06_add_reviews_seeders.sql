-- 06_seed_reviews.sql
-- Avis de demonstration sur une reservation terminee.

SET CLIENT_ENCODING TO 'UTF8';

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
VALUES (
        '018d5c8e-6000-7001-e001-000000000001',
        '018d5c8e-4000-7001-c001-000000000001',
        '018d5c8e-1000-7001-9001-000000000002',
        '018d5c8e-1000-7001-9001-000000000003',
        5,
        'Tres bon service, rapide et professionnel !',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (booking_id) DO UPDATE
SET
    client_id = EXCLUDED.client_id,
    provider_id = EXCLUDED.provider_id,
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment;
