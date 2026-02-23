SELECT u.id_user, u.full_name, COUNT(b.id_booking) AS total_bookings
FROM
    users u
    LEFT JOIN services s ON s.provider_id = u.id_user
    LEFT JOIN bookings b ON b.service_id = s.id_service
WHERE
    u.role = 'provider'
GROUP BY
    u.id_user,
    u.full_name
ORDER BY total_bookings ASC;