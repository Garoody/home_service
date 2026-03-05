"use strict";
/**
 * @fileoverview Modele User - Gestion des utilisateurs
 */
class User {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_user || data.id || null;
    this.fullName = data.full_name || data.name || "";
    this.email = data.email || "";
    this.role = data.role || data.role_name || "client";
    this.passwordHash = data.password_hash || data.password || null;
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.gdprConsent = data.gdpr_consent ?? null;
    this.gdprConsentDate = data.gdpr_consent_date || null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new User(row) : null;
  }

  /**
   * Alias legacy pour compatibilite avec le code existant
   */
  static fromPersistence(row) {
    return User.fromDatabase(row);
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new User(row));
  }

  /**
   * Donnees minimales pour session utilisateur
   */
  toSession() {
    return {
      id: this.id,
      name: this.fullName,
      role: this.role,
    };
  }

  /**
   * Filtre les donnees sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      phone: this.phone,
      address: this.address,
      gdprConsent: this.gdprConsent,
      gdprConsentDate: this.gdprConsentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet User en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default User;
