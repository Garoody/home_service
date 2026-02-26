"use strict";

import db from "../config/database.js";

class PaymentService {
  static async create({ booking_id, amount }) {
    const result = await db.query(
      `
      INSERT INTO payments (booking_id, amount, payment_status, payment_date)
      VALUES ($1, $2, 'pending', NOW())
      RETURNING *
      `,
      [booking_id, amount]
    );

    return result.rows[0];
  }

  static async markAsPaid(id) {
    const result = await db.query(
      `
      UPDATE payments
      SET payment_status = 'paid'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return result.rows[0];
  }
}

export default PaymentService;