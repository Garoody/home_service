"use strict";
/**
 * @fileoverview Modele Category - Gestion des categories
 */
class Category {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_category || data.id || null;
    this.name = data.name || "";
    this.description = data.description || null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new Category(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Category(row));
  }

  /**
   * Filtre les donnees sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet Category en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Category;
