"use strict";

import db from "../config/database.js";
import Payment from "../entities/Payment.js";

class PgPaymentRepository {
  static async findByBookingId(bookingId) {
    const query = /*sql*/`
      SELECT id_payment, booking_id, amount, payment_status, payment_date, created_at, updated_at
      FROM public.payments
      WHERE booking_id = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [bookingId]);
    return Payment.fromDatabase(rows[0]);
  }

  static async create({ booking_id, amount, payment_status = "pending", payment_date = null }) {
    const query = /*sql*/`
      INSERT INTO public.payments (booking_id, amount, payment_status, payment_date)
      VALUES ($1, $2, $3, $4)
      RETURNING id_payment, booking_id, amount, payment_status, payment_date, created_at, updated_at;
    `;

    const values = [booking_id, amount, payment_status, payment_date];
    const { rows } = await db.query(query, values);
    return Payment.fromDatabase(rows[0]);
  }
}

export default PgPaymentRepository;
