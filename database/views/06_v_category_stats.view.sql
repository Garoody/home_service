CREATE OR REPLACE VIEW v_category_stats AS
SELECT
    c.id_category,
    c.name AS category_name,
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
    ) AS total_revenue_paid
FROM
    categories c
    LEFT JOIN services s ON s.category_id = c.id_category
    LEFT JOIN bookings b ON b.service_id = s.id_service
    LEFT JOIN payments p ON p.booking_id = b.id_booking
GROUP BY
    c.id_category,
    c.name
ORDER BY total_revenue_paid DESC;