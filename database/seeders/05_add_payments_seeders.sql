-- 05_seed_payments.sql
-- Paiements de demonstration relies directement aux reservations.

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    payments (
        id_payment,
        booking_id,
        amount,
        payment_status,
        payment_date
    )
VALUES (
        '018d5c8e-5000-7001-d001-000000000001',
        '018d5c8e-4000-7001-c001-000000000001',
        45.00,
        'paid'::payment_status_enum,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-5000-7001-d001-000000000002',
        '018d5c8e-4000-7001-c001-000000000002',
        55.00,
        'pending'::payment_status_enum,
        NULL
    )
ON CONFLICT (booking_id) DO UPDATE
SET
    amount = EXCLUDED.amount,
    payment_status = EXCLUDED.payment_status,
    payment_date = EXCLUDED.payment_date;
