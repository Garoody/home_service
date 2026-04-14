"use strict";
/**
 * @fileoverview Modele Payment - Gestion des paiements
 */
class Payment {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_payment || data.id || null;
    this.bookingId = data.booking_id || null;
    this.amount = data.amount ?? null;
    this.paymentStatus = data.payment_status || "pending";
    this.paymentDate = data.payment_date || null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new Payment(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Payment(row));
  }

  /**
   * Filtre les données sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      amount: this.amount,
      paymentStatus: this.paymentStatus,
      paymentDate: this.paymentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet Payment en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Payment;
