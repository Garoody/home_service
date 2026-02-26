"use strict";

import db from "../config/database.js";

class ReviewService {
  static async create({ client_id, service_id, rating, comment }) {
    const result = await db.query(
      `
      INSERT INTO reviews (client_id, service_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [client_id, service_id, rating, comment]
    );

    return result.rows[0];
  }

  static async getByService(serviceId) {
    const result = await db.query(
      `
      SELECT r.*, u.name
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE service_id = $1
      ORDER BY created_at DESC
      `,
      [serviceId]
    );

    return result.rows;
  }
}

export default ReviewService;