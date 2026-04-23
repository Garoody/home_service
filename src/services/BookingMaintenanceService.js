"use strict";

import PgBookingMaintenanceRepository from "../repositories/PgBookingMaintenanceRepository.js";

class BookingMaintenanceService {
  static async expirePendingBookings(...args) {
    return PgBookingMaintenanceRepository.expirePendingBookings(...args);
  }
}

export default BookingMaintenanceService;
