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

  // Reutilise une categorie existante par nom ou en cree une nouvelle au besoin.
  static async findOrCreateByName(name) {
    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      throw new Error("Le nom de la categorie est obligatoire.");
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
      description: `Categorie creee depuis la publication d'un service : ${normalizedName}.`,
    });
  }
}

export default CategoryService;
