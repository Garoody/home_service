CREATE OR REPLACE VIEW v_provider_stats AS
SELECT
    u.id_user AS provider_id,
    u.full_name AS provider_name,
    u.email AS provider_email,
    COUNT(DISTINCT s.id_service) AS total_services,
    COUNT(DISTINCT b.id_booking) AS total_bookings,
    COALESCE(
        SUM(
            CASE
                WHEN p.payment_status = 'paid'::payment_status_enum THEN p.amount
                ELSE 0
            END
        ),
        0
    ) AS total_revenue_paid,
    ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
    COUNT(r.id_review) AS total_reviews
FROM
    users u
    LEFT JOIN services s ON s.provider_id = u.id_user
    LEFT JOIN bookings b ON b.service_id = s.id_service
    LEFT JOIN payments p ON p.booking_id = b.id_booking
    LEFT JOIN reviews r ON r.provider_id = u.id_user
WHERE
    u.role IN (
        'provider'::role_enum,
        'admin'::role_enum,
        'client'::role_enum
    ) -- garde tous si besoin
GROUP BY
    u.id_user,
    u.full_name,
    u.email;