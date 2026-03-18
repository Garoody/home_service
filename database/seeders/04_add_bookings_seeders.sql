-- 04_seed_bookings.sql
-- Reservations de demonstration reliees directement au client
-- et aux services avec des identifiants faciles a suivre.

SET CLIENT_ENCODING TO 'UTF8';

INSERT INTO
    bookings (
        id_booking,
        client_id,
        service_id,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
        status,
        total_price,
        created_at
    )
VALUES (
        '018d5c8e-4000-7001-c001-000000000001',
        '018d5c8e-1000-7001-9001-000000000002',
        '018d5c8e-3000-7001-b001-000000000001',
        'Client',
        'Test',
        'Paris',
        '10 rue de la Paix',
        CURRENT_DATE + 1,
        TIME '14:00',
        'completed',
        45.00,
        CURRENT_TIMESTAMP
    ),
    (
        '018d5c8e-4000-7001-c001-000000000002',
        '018d5c8e-1000-7001-9001-000000000002',
        '018d5c8e-3000-7001-b001-000000000002',
        'Client',
        'Test',
        'Paris',
        '10 rue de la Paix',
        CURRENT_DATE + 2,
        TIME '15:30',
        'pending',
        55.00,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id_booking) DO UPDATE
SET
    client_id = EXCLUDED.client_id,
    service_id = EXCLUDED.service_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    booking_date = EXCLUDED.booking_date,
    booking_time = EXCLUDED.booking_time,
    status = EXCLUDED.status,
    total_price = EXCLUDED.total_price;
