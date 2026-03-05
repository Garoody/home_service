"use strict";

import db from "../config/database.js";
import Category from "../entities/Category.js";

class PgCategoryRepository {
  static async findAll() {
    const query = /*sql*/ `
      SELECT id_category, name, description, created_at, updated_at
      FROM public.categories
      ORDER BY name ASC;
    `;

    const { rows } = await db.query(query);
    return Category.fromDatabaseList(rows);
  }

  static async findById(categoryId) {
    const query = /*sql*/`
      SELECT id_category, name, description, created_at, updated_at
      FROM public.categories
      WHERE id_category = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [categoryId]);
    return Category.fromDatabase(rows[0]);
  }

  static async create({ name, description = null }) {
    const query = /*sql*/`
      INSERT INTO public.categories (name, description)
      VALUES ($1, $2)
      RETURNING id_category, name, description, created_at, updated_at;
    `;

    const { rows } = await db.query(query, [name, description]);
    return Category.fromDatabase(rows[0]);
  }
}

export default PgCategoryRepository;
