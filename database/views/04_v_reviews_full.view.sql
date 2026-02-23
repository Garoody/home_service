CREATE OR REPLACE VIEW v_reviews_full AS
SELECT
    r.id_review,
    r.rating,
    r.comment,
    r.created_at,
    r.updated_at,
    b.id_booking,
    b.booking_date,
    b.booking_time,
    b.status AS booking_status,
    cu.id_user AS client_id,
    cu.full_name AS client_name,
    cu.email AS client_email,
    pu.id_user AS provider_id,
    pu.full_name AS provider_name,
    pu.email AS provider_email,
    s.id_service,
    s.title AS service_title,
    c.id_category,
    c.name AS category_name
FROM
    reviews r
    JOIN bookings b ON b.id_booking = r.booking_id
    JOIN users cu ON cu.id_user = r.client_id
    JOIN users pu ON pu.id_user = r.provider_id
    JOIN services s ON s.id_service = b.service_id
    JOIN categories c ON c.id_category = s.category_id;