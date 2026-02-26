"use strict";

import db from "../config/database.js";

class AdminService {
  async getStats() {
    const [
      users,
      services,
      bookings,
      categories,
    ] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM users"),
      db.query("SELECT COUNT(*)::int AS count FROM services"),
      db.query("SELECT COUNT(*)::int AS count FROM bookings"),
      db.query("SELECT COUNT(*)::int AS count FROM categories"),
    ]);

    return {
      users: users.rows[0].count,
      services: services.rows[0].count,
      bookings: bookings.rows[0].count,
      categories: categories.rows[0].count,
    };
  }
}

export default new AdminService();