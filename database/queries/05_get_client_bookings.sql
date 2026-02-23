SELECT b.id_booking, s.title, b.booking_date, b.booking_time, b.status, b.total_price, b.created_at
FROM bookings b
    JOIN services s ON s.id_service = b.service_id
WHERE
    b.client_id = (
        SELECT id_user
        FROM users
        WHERE
            email = 'client@homeservices.local'
        LIMIT 1
    )
ORDER BY b.created_at DESC;