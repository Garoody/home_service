"use strict";

import db from "../config/database.js";

class BookingService {
  static _hasContactColumns = null;

  // Detecte si les colonnes contact existent sans modifier le schema.
  static async hasContactColumns() {
    if (this._hasContactColumns !== null) return this._hasContactColumns;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'bookings'
        AND column_name IN ('first_name', 'last_name', 'city', 'address')
      `
    );

    this._hasContactColumns = result.rows[0]?.count === 4;
    return this._hasContactColumns;
  }

  // Recupere l'id du client proprietaire d'une reservation.
  static async getOwnerIdByBookingId(bookingId) {
    const result = await db.query(
      `
      SELECT client_id::text AS client_id
      FROM public.bookings
      WHERE id_booking::text = $1
      `,
      [bookingId]
    );

    return result.rows[0]?.client_id || null;
  }

  // Verifie qu'une reservation appartient bien au client connecte.
  static async assertOwnership(bookingId, clientId) {
    const ownerId = await this.getOwnerIdByBookingId(bookingId);
    if (!ownerId) {
      throw new Error("Reservation introuvable.");
    }
    if (String(ownerId) !== String(clientId)) {
      throw new Error("Action non autorisee sur cette reservation.");
    }
  }

  // Retourne uniquement les reservations du client connecte.
  static async listForUser(clientId) {
    if (!clientId) {
      throw new Error("Utilisateur non connecte.");
    }

    const hasContactColumns = await this.hasContactColumns();

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.client_id,
        b.service_id,
        s.provider_id::text AS provider_id,
        ${hasContactColumns ? "b.first_name" : "''::text AS first_name"},
        ${hasContactColumns ? "b.last_name" : "''::text AS last_name"},
        ${hasContactColumns ? "b.city" : "''::text AS city"},
        ${hasContactColumns ? "b.address" : "''::text AS address"},
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_price,
        b.created_at,
        b.updated_at,
        s.title AS service_title,
        s.id_service::text AS service_slug,
        (r.id_review IS NOT NULL) AS has_review
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      WHERE b.client_id = $1
      ORDER BY b.created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  // Charge une reservation precise du client pour l'ecran d'edition.
  static async getByIdForUser({ bookingId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecte.");
    }

    const hasContactColumns = await this.hasContactColumns();

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.client_id::text AS client_id,
        b.service_id::text AS service_id,
        ${hasContactColumns ? "b.first_name" : "''::text AS first_name"},
        ${hasContactColumns ? "b.last_name" : "''::text AS last_name"},
        ${hasContactColumns ? "b.city" : "''::text AS city"},
        ${hasContactColumns ? "b.address" : "''::text AS address"},
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_price,
        s.title AS service_title
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      WHERE b.id_booking::text = $1
        AND b.client_id::text = $2
      LIMIT 1
      `,
      [bookingId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Reservation introuvable.");
    }

    return result.rows[0];
  }

  // Cree une reservation avec le prix recopie depuis le service.
  static async create({ client_id, service_id, first_name, last_name, city, address, booking_date, booking_time }) {
    if (!client_id) {
      throw new Error("Utilisateur non connecte.");
    }
    if (!service_id || !booking_date || !booking_time) {
      throw new Error("Champs manquants pour la reservation.");
    }

    const hasContactColumns = await this.hasContactColumns();

    // On lit le service pour recuperer le prix officiel en base.
    const serviceResult = await db.query(
      `
      SELECT id_service, price
      FROM public.services
      WHERE id_service::text = $1
      `,
      [service_id]
    );

    const service = serviceResult.rows[0];
    if (!service) {
      throw new Error("Service introuvable.");
    }

    const result = hasContactColumns
      ? await db.query(
          `
          INSERT INTO public.bookings
          (client_id, service_id, first_name, last_name, city, address, booking_date, booking_time, status, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
          RETURNING id_booking::text AS id
          `,
          [client_id, service.id_service, first_name, last_name, city, address, booking_date, booking_time, service.price]
        )
      : await db.query(
          `
          INSERT INTO public.bookings
          (client_id, service_id, booking_date, booking_time, status, total_price)
          VALUES ($1, $2, $3, $4, 'pending', $5)
          RETURNING id_booking::text AS id
          `,
          [client_id, service.id_service, booking_date, booking_time, service.price]
        );

    return result.rows[0];
  }

  // Met a jour les informations principales d'une reservation appartenant au client.
  static async updateByClient({
    bookingId,
    clientId,
    first_name,
    last_name,
    city,
    address,
    booking_date,
    booking_time,
  }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecte.");
    }
    if (!first_name || !last_name || !city || !address || !booking_date || !booking_time) {
      throw new Error("Tous les champs du formulaire sont obligatoires.");
    }

    // Double controle: verification de proprietaire avant l'UPDATE.
    await this.assertOwnership(bookingId, clientId);

    const hasContactColumns = await this.hasContactColumns();

    const result = hasContactColumns
      ? await db.query(
          `
          UPDATE public.bookings
          SET
            first_name = $1,
            last_name = $2,
            city = $3,
            address = $4,
            booking_date = $5,
            booking_time = $6,
            updated_at = NOW()
          WHERE id_booking::text = $7
          RETURNING id_booking::text AS id
          `,
          [first_name, last_name, city, address, booking_date, booking_time, bookingId]
        )
      : await db.query(
          `
          UPDATE public.bookings
          SET
            booking_date = $1,
            booking_time = $2,
            updated_at = NOW()
          WHERE id_booking::text = $3
          RETURNING id_booking::text AS id
          `,
          [booking_date, booking_time, bookingId]
        );

    if (!result.rows[0]) {
      throw new Error("Reservation introuvable.");
    }

    return result.rows[0];
  }

  // Supprime une reservation uniquement si elle appartient au client.
  static async deleteByClient({ bookingId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecte.");
    }

    // Le WHERE protege contre la suppression d'une reservation d'un autre client.
    const result = await db.query(
      `
      DELETE FROM public.bookings
      WHERE id_booking::text = $1
        AND client_id::text = $2
      RETURNING id_booking::text AS id
      `,
      [bookingId, clientId]
    );

    if (!result.rows[0]) {
      // Si la reservation existe mais n'appartient pas au client, on renvoie une erreur explicite.
      const ownerId = await this.getOwnerIdByBookingId(bookingId);
      if (!ownerId) {
        throw new Error("Reservation introuvable.");
      }
      throw new Error("Vous ne pouvez supprimer que votre reservation.");
    }

    return result.rows[0];
  }
}

export default BookingService;
