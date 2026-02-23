CREATE OR REPLACE VIEW v_revenue_by_month AS
SELECT DATE_TRUNC('month', p.payment_date) AS month, SUM(p.amount) AS total_revenue
FROM payments p
WHERE
    p.payment_status = 'paid'::payment_status_enum
    AND p.payment_date IS NOT NULL
GROUP BY
    month
ORDER BY month DESC;