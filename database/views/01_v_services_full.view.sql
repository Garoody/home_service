CREATE OR REPLACE VIEW v_services_full AS
SELECT
    s.id_service,
    s.title,
    s.description,
    s.price,
    s.created_at,
    s.updated_at,
    c.id_category,
    c.name AS category_name,
    c.description AS category_description,
    p.id_user AS provider_id,
    p.full_name AS provider_name,
    p.email AS provider_email,
    p.phone AS provider_phone,
    p.address AS provider_address,
    p.role AS provider_role
FROM
    services s
    JOIN categories c ON c.id_category = s.category_id
    JOIN users p ON p.id_user = s.provider_id;