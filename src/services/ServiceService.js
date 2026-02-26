"use strict";

import db from "../config/database.js";

class ServiceService {
  static async search({ q, category_id } = {}) {
    const values = [];
    const where = [];

    if (q) {
      values.push(`%${q}%`);
      where.push(
        `(s.title ILIKE $${values.length} OR s.description ILIKE $${values.length})`
      );
    }

    if (category_id) {
      values.push(category_id);
      where.push(`s.category_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await db.query(
      `
      SELECT
        s.id_service AS id,
        s.id_service::text AS slug,
        s.title,
        s.description,
        s.price,
        s.category_id,
        s.provider_id,
        s.created_at,
        u.full_name AS provider_name,
        c.name AS category_name
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      ${whereSql}
      ORDER BY s.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  static async getBySlug(slug) {
    // The route uses `:slug`, but the current DB schema has no `slug` column.
    // We use `id_service` (UUID) as URL identifier for now.
    const result = await db.query(
      `
      SELECT
        s.id_service AS id,
        s.id_service::text AS slug,
        s.provider_id,
        s.category_id,
        s.title,
        s.description,
        s.price,
        s.created_at,
        s.updated_at,
        u.full_name AS provider_name,
        c.name AS category_name
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      WHERE s.id_service::text = $1
      `,
      [slug]
    );

    if (!result.rows[0]) {
      throw new Error("Service introuvable.");
    }

    return result.rows[0];
  }

  static async create({ provider_id, category_id, title, description, price }) {
    const result = await db.query(
      `
      INSERT INTO services (provider_id, category_id, title, description, price, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
      `,
      [provider_id, category_id, title, description, price]
    );

    return result.rows[0];
  }

  static async updateBySlug(slug, { category_id, title, description, price }) {
    const result = await db.query(
      `
      UPDATE public.services
      SET
        category_id = $1,
        title = $2,
        description = $3,
        price = $4,
        updated_at = NOW()
      WHERE id_service::text = $5
      RETURNING id_service
      `,
      [category_id, title, description, price, slug]
    );

    if (!result.rows[0]) {
      throw new Error("Service introuvable.");
    }

    return result.rows[0];
  }
}

export default ServiceService;
