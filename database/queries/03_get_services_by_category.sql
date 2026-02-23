SELECT s.id_service, s.title, s.price, u.full_name AS provider_name, s.created_at
FROM services s
    JOIN users u ON u.id_user = s.provider_id
WHERE
    s.category_id = (
        SELECT id_category
        FROM categories
        ORDER BY name
        LIMIT 1
    )
ORDER BY s.created_at DESC;