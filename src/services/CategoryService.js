"use strict";

import db from "../config/database.js";

class CategoryService {
  static _hasAdminStatusColumn = null;

  static async hasAdminStatusColumn() {
    if (this._hasAdminStatusColumn !== null) {
      return this._hasAdminStatusColumn;
    }

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'admin_status'
      ) AS exists
      `
    );

    this._hasAdminStatusColumn = result.rows[0]?.exists === true;
    return this._hasAdminStatusColumn;
  }

  // Alias metier: liste des catégories (utilise par les controllers).
  static async list() {
    return this.getAll();
  }

  // Recupere toutes les catégories triees par nom.
  static async getAll() {
    const hasAdminStatusColumn = await this.hasAdminStatusColumn();
    const result = await db.query(
      `
      SELECT
        c.id_category AS id,
        c.id_category,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(s.id_service)::int AS total_services
      FROM categories c
      LEFT JOIN services s
        ON s.category_id = c.id_category
       ${hasAdminStatusColumn ? "AND COALESCE(s.admin_status, 'active') = 'active'" : ""}
      GROUP BY
        c.id_category,
        c.name,
        c.description,
        c.created_at,
        c.updated_at
      ORDER BY c.name ASC
      `
    );
    return result.rows;
  }

  // Cree une nouvelle catégorie.
  static async create({ name, description }) {
    const result = await db.query(
      `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING
        id_category AS id,
        id_category,
        name,
        description,
        created_at,
        updated_at
      `,
      [name, description]
    );

    return result.rows[0];
  }

  // Reutilise une catégorie existante par nom ou en cree une nouvelle au besoin.
  static async findOrCreateByName(name) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("Le nom de la catégorie est obligatoire.");
    }

    const existing = await db.query(
      `
      SELECT
        id_category AS id,
        id_category,
        name,
        description,
        created_at,
        updated_at
      FROM categories
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [normalizedName]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    return this.create({
      name: normalizedName,
      description: `Catégorie creee depuis la publication d'un service : ${normalizedName}.`,
    });
  }
}

export default CategoryService;
