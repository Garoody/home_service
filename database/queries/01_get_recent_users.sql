SELECT
    id_user,
    full_name,
    email,
    role,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;