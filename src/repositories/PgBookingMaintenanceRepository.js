"use strict";

import db from "../config/database.js";
import { getBookingReferenceForComparison } from "../utils/bookingSlot.js";

class PgBookingMaintenanceRepository {
  static async expirePendingBookings({ dbClient = db } = {}) {
    const { currentDate, currentTime } = getBookingReferenceForComparison();

    const result = await dbClient.query(
      `
      UPDATE public.bookings
      SET
        status = 'cancelled',
        updated_at = NOW()
      WHERE status = 'pending'
        AND booking_date IS NOT NULL
        AND booking_time IS NOT NULL
        AND (
          booking_date < $1::date
          OR (booking_date = $1::date AND booking_time <= $2::time)
        )
      RETURNING id_booking::text AS id
      `,
      [currentDate, currentTime]
    );

    return result.rows;
  }
}

export default PgBookingMaintenanceRepository;
