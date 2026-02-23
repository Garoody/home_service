CREATE OR REPLACE VIEW v_payments_full AS
SELECT
    p.id_payment,
    p.amount,
    p.payment_status,
    p.payment_date,
    p.created_at,
    p.updated_at,
    b.id_booking,
    b.status AS booking_status,
    b.total_price,
    b.booking_date,
    b.booking_time,
    cu.id_user AS client_id,
    cu.full_name AS client_name,
    cu.email AS client_email,
    pu.id_user AS provider_id,
    pu.full_name AS provider_name,
    pu.email AS provider_email,
    s.id_service,
    s.title AS service_title,
    c.name AS category_name
FROM
    payments p
    JOIN bookings b ON b.id_booking = p.booking_id
    JOIN users cu ON cu.id_user = b.client_id
    JOIN services s ON s.id_service = b.service_id
    JOIN categories c ON c.id_category = s.category_id
    JOIN users pu ON pu.id_user = s.provider_id;