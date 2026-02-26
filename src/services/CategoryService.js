"use strict";

import db from "../config/database.js";

class CategoryService {
  static async list() {
    return this.getAll();
  }

  static async getAll() {
    const result = await db.query(
      `
      SELECT
        id_category AS id,
        id_category,
        name,
        description,
        created_at,
        updated_at
      FROM categories
      ORDER BY name ASC
      `
    );
    return result.rows;
  }

  static async create({ name, description }) {
    const result = await db.query(
      `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, description]
    );

    return result.rows[0];
  }
}

export default CategoryService;
