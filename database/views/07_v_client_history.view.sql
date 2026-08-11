CREATE OR REPLACE VIEW v_client_history AS
SELECT
    b.id_booking,
    b.client_id,
    cu.full_name AS client_name,
    s.id_service,
    s.title AS service_title,
    c.name AS category_name,
    b.booking_date,
    b.booking_time,
    b.status,
    b.total_price,
    p.payment_status,
    p.payment_date,
    r.rating,
    r.comment
FROM
    bookings b
    JOIN users cu ON cu.id_user = b.client_id
    JOIN services s ON s.id_service = b.service_id
    JOIN categories c ON c.id_category = s.category_id
    LEFT JOIN payments p ON p.booking_id = b.id_booking
    LEFT JOIN reviews r ON r.booking_id = b.id_booking;


    