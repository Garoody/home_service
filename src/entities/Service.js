"use strict";
/**
 * @fileoverview Modele Service - Gestion des services
 */
class Service {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_service || data.id || null;
    this.providerId = data.provider_id || null;
    this.categoryId = data.category_id || null;
    this.title = data.title || "";
    this.description = data.description || "";
    this.price = data.price ?? null;
    this.slug = data.slug || null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new Service(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Service(row));
  }

  /**
   * Filtre les donnees sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      categoryId: this.categoryId,
      title: this.title,
      description: this.description,
      price: this.price,
      slug: this.slug,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet Service en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Service;
