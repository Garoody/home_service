"use strict";
/**
 * @fileoverview Modele Booking - Gestion des reservations
 */
class Booking {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_booking || data.id || null;
    this.clientId = data.client_id || null;
    this.serviceId = data.service_id || null;
    this.bookingDate = data.booking_date || null;
    this.bookingTime = data.booking_time || null;
    this.status = data.status || "pending";
    this.totalPrice = data.total_price ?? null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new Booking(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Booking(row));
  }

  /**
   * Filtre les donnees sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      serviceId: this.serviceId,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      status: this.status,
      totalPrice: this.totalPrice,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet Booking en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Booking;
