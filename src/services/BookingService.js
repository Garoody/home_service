"use strict";

import db from "../config/database.js";

class BookingService {
  static async create({ client_id, service_id, booking_date, booking_time, total_price }) {
    const result = await db.query(
      `
      INSERT INTO bookings (client_id, service_id, booking_date, booking_time, status, total_price, created_at)
      VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
      RETURNING *
      `,
      [client_id, service_id, booking_date, booking_time, total_price]
    );

    return result.rows[0];
  }

  static async getByUser(userId) {
    const result = await db.query(
      `
      SELECT * FROM bookings
      WHERE client_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return result.rows;
  }
}

export default BookingService;