"use strict";

import db from "../config/database.js";

class ReviewService {
  // Recupere le contexte d'une reservation avant depot d'avis.
  static async getBookingReviewContext({ bookingId, clientId }) {
    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        b.client_id::text AS client_id,
        b.status,
        s.id_service::text AS service_id,
        s.title AS service_title,
        s.provider_id::text AS provider_id,
        u.full_name AS provider_name,
        r.id_review::text AS review_id
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = s.provider_id
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      WHERE b.id_booking::text = $1
        AND b.client_id::text = $2
      `,
      [bookingId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Reservation introuvable ou non autorisee.");
    }

    return result.rows[0];
  }

  // Cree un avis client sur un prestataire.
  static async create({ booking_id, client_id, provider_id, rating, comment }) {
    const context = await this.getBookingReviewContext({ bookingId: booking_id, clientId: client_id });

    if (context.status !== "completed") {
      throw new Error("Vous pouvez laisser un avis uniquement apres une reservation terminee.");
    }

    if (String(context.provider_id) !== String(provider_id)) {
      throw new Error("Prestataire invalide pour cette reservation.");
    }

    if (context.review_id) {
      throw new Error("Un avis existe deja pour cette reservation.");
    }

    const result = await db.query(
      `
      INSERT INTO public.reviews (booking_id, client_id, provider_id, rating, comment, created_at)
      VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, NOW())
      RETURNING id_review::text AS id
      `,
      [booking_id, client_id, provider_id, rating, comment || null]
    );

    return result.rows[0];
  }

  // Retourne les avis publics d'un service.
  static async getByService(serviceId) {
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.created_at,
        cu.full_name AS client_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.users cu ON cu.id_user = r.client_id
      WHERE b.service_id::text = $1
      ORDER BY r.created_at DESC
      `,
      [serviceId]
    );

    return result.rows;
  }
}

export default ReviewService;
