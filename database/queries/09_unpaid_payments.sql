SELECT p.id_payment, p.amount, p.payment_status, p.payment_date, b.id_booking
FROM payments p
    JOIN bookings b ON b.id_booking = p.booking_id
WHERE
    p.payment_status = 'pending'
ORDER BY p.payment_date NULLS LAST;