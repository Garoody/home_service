-- 03_seed_services.sql
-- Cree des services pour "Provider Test" dans plusieurs categories

SET CLIENT_ENCODING TO 'UTF8';

WITH
    provider AS (
        SELECT id_user
        FROM users
        WHERE
            email = 'provider@homeservices.local'
        LIMIT 1
    ),
    cats AS (
        SELECT id_category, name
        FROM categories
    )
INSERT INTO
    services (
        id_service,
        provider_id,
        category_id,
        title,
        description,
        price,
        created_at
    )
SELECT
    uuidv7 (),
    (
        SELECT id_user
        FROM provider
    ),
    c.id_category,
    'Service de ' || c.name,
    'Prestation professionnelle de ' || c.name,
    CASE c.name
        WHEN U&'Menage' THEN 45.00
        WHEN 'Jardinage' THEN 55.00
        WHEN 'Plomberie' THEN 70.00
        ELSE 50.00
    END,
    CURRENT_TIMESTAMP
FROM cats c
ON CONFLICT DO NOTHING;