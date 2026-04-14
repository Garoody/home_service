"use strict";
/**
 * @fileoverview Modele AppEvent - Gestion des evenements applicatifs
 */
class AppEventEntity {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_event || null;
    this.userId = data.user_id || null;
    this.eventCategory = data.event_category || null;
    this.eventType = data.event_type || null;
    this.severity = data.severity || null;
    this.message = data.message || null;
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new AppEventEntity(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new AppEventEntity(row));
  }

  /**
   * Filtre les données sensibles pour l'exposition en API
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      eventCategory: this.eventCategory,
      eventType: this.eventType,
      severity: this.severity,
      message: this.message,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }

  /**
   * Convertit l'objet AppEvent en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default AppEventEntity;
