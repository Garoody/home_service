"use strict";

import db from "../config/database.js";

class CategoryService {
  // Alias metier: liste des categories (utilise par les controllers).
  static async list() {
    return this.getAll();
  }

  // Recupere toutes les categories triees par nom.
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

  // Cree une nouvelle categorie.
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
