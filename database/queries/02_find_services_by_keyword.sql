SELECT
    s.id_service,
    s.title,
    s.description,
    s.price,
    c.name AS category,
    u.full_name AS provider_name
FROM
    services s
    JOIN categories c ON c.id_category = s.category_id
    JOIN users u ON u.id_user = s.provider_id
WHERE
    s.title ILIKE '%Service%'
    OR s.description ILIKE '%Prestation%'
ORDER BY s.created_at DESC
LIMIT 50;