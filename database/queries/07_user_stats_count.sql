SELECT role, COUNT(*) AS total_users
FROM users
GROUP BY
    role
ORDER BY total_users DESC;