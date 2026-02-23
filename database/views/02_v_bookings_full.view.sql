CREATE OR REPLACE VIEW v_bookings_full AS
SELECT
    b.id_booking,
    b.booking_date,
    b.booking_time,
    b.status,
    b.total_price,
    b.created_at,
    b.updated_at,
    cu.id_user AS client_id,
    cu.full_name AS client_name,
    cu.email AS client_email,
    cu.phone AS client_phone,
    s.id_service,
    s.title AS service_title,
    s.price AS service_price,
    c.id_category,
    c.name AS category_name,
    pu.id_user AS provider_id,
    pu.full_name AS provider_name,
    pu.email AS provider_email,
    pu.phone AS provider_phone
FROM
    bookings b
    JOIN users cu ON cu.id_user = b.client_id
    JOIN services s ON s.id_service = b.service_id
    JOIN categories c ON c.id_category = s.category_id
    JOIN users pu ON pu.id_user = s.provider_id;