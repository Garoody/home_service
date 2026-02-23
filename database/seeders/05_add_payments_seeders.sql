-- 05_seed_payments.sql
-- Paiement "paid" pour la 1ère réservation, "pending" pour la 2ème

WITH
    b AS (
        SELECT id_booking, total_price, ROW_NUMBER() OVER (
                ORDER BY created_at ASC
            ) AS rn
        FROM bookings
        ORDER BY created_at ASC
        LIMIT 2
    )
INSERT INTO
    payments (
        id_payment,
        booking_id,
        amount,
        payment_status,
        payment_date
    )
SELECT
    uuidv7 (),
    id_booking,
    total_price,
    CASE
        WHEN rn = 1 THEN 'paid'::payment_status_enum
        ELSE 'pending'::payment_status_enum
    END,
    CASE
        WHEN rn = 1 THEN CURRENT_TIMESTAMP
        ELSE NULL
    END
FROM b
ON CONFLICT DO NOTHING;