SELECT DATE_TRUNC('month', payment_date) AS month, SUM(amount) AS total_revenue
FROM payments
WHERE
    payment_status = 'paid'
    AND payment_date IS NOT NULL
GROUP BY
    month
ORDER BY month DESC;