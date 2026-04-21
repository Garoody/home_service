"use strict";

import db from "../config/database.js";
import Service from "../entities/Service.js";

class PgServiceRepository {
  static async search({ q, categoryId } = {}) {
    const values = [];
    const where = [];

    if (q) {
      values.push(`%${q}%`);
      where.push(`(s.title ILIKE $${values.length} OR s.description ILIKE $${values.length})`);
    }

    if (categoryId) {
      values.push(categoryId);
      where.push(`s.category_id = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const query = /*sql*/`
      SELECT s.id_service, s.provider_id, s.category_id, s.title,
       s.description, s.price, s.created_at, s.updated_at
      FROM public.services s
      ${whereSql}
      ORDER BY s.created_at DESC;
    `;

    const { rows } = await db.query(query, values);
    return Service.fromDatabaseList(rows);
  }

  static async findBySlug(slug) {
    const query = /*sql*/`
      SELECT s.id_service, s.provider_id, s.category_id, s.title, 
      s.description, s.price, s.created_at, s.updated_at
      FROM public.services s
      WHERE s.id_service::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [slug]);
    return Service.fromDatabase(rows[0]);
  }

  static async create({ provider_id, category_id, title, description, price }) {
    const query = /*sql*/`
      INSERT INTO public.services (provider_id, category_id, title, description, price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_service, provider_id, category_id, title, description, price, created_at, updated_at;
    `;

    const values = [provider_id, category_id, title, description, price];
    const { rows } = await db.query(query, values);
    return Service.fromDatabase(rows[0]);
  }

  static async updateBySlug(slug, { category_id, title, description, price }) {
    const query = /*sql*/`
      UPDATE public.services
      SET category_id = $1,
          title = $2,
          description = $3,
          price = $4,
          updated_at = NOW()
      WHERE id_service::text = $5
      RETURNING id_service, provider_id, category_id, title, description, price, created_at, updated_at;
    `;

    const values = [category_id, title, description, price, slug];
    const { rows } = await db.query(query, values);
    return Service.fromDatabase(rows[0]);
  }
}

export default PgServiceRepository;
