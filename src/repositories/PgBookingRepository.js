"use strict";

import db from "../config/database.js";
import Booking from "../entities/Booking.js";

class PgBookingRepository {
  static async findByClientId(clientId) {
    const query = `
      SELECT id_booking, client_id, service_id, booking_date, booking_time, status, total_price, created_at, updated_at
      FROM public.bookings
      WHERE client_id = $1
      ORDER BY created_at DESC;
    `;

    const { rows } = await db.query(query, [clientId]);
    return Booking.fromDatabaseList(rows);
  }

  static async create({ client_id, service_id, booking_date, booking_time, status = "pending", total_price }) {
    const query = /*sql*/`
      INSERT INTO public.bookings (client_id, service_id, booking_date, booking_time, status, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_booking, client_id, service_id, booking_date, booking_time, status, total_price, created_at, updated_at;
    `;

    const values = [client_id, service_id, booking_date, booking_time, status, total_price];
    const { rows } = await db.query(query, values);
    return Booking.fromDatabase(rows[0]);
  }
}

export default PgBookingRepository;
