"use strict";

import db from "../config/database.js";
import Review from "../entities/Review.js";

class PgReviewRepository {
  static _hasProviderReplyColumns = null;

  static async hasProviderReplyColumns() {
    if (this._hasProviderReplyColumns === true) {
      return this._hasProviderReplyColumns;
    }

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'reviews'
        AND column_name IN (
          'provider_reply',
          'provider_reply_created_at',
          'provider_reply_updated_at'
        )
      `
    );

    this._hasProviderReplyColumns = result.rows[0]?.count === 3;
    return this._hasProviderReplyColumns;
  }

  static async getBookingReviewContext({ bookingId, clientId }) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        b.client_id::text AS client_id,
        b.status,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        s.id_service::text AS service_id,
        s.title AS service_title,
        s.provider_id::text AS provider_id,
        u.full_name AS provider_name,
        r.id_review::text AS review_id,
        r.rating,
        r.comment,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at"
        }
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = s.provider_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      WHERE b.id_booking::text = $1
        AND b.client_id::text = $2
      `,
      [bookingId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Réservation introuvable ou non autorisée.");
    }

    return result.rows[0];
  }

  static async getReviewByIdForClient({ reviewId, clientId }) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.booking_id::text AS booking_id,
        r.client_id::text AS client_id,
        r.provider_id::text AS provider_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at,"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at,"
        }
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        s.id_service::text AS service_id,
        s.title AS service_title,
        u.full_name AS provider_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = s.provider_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      WHERE r.id_review::text = $1
        AND r.client_id::text = $2
      LIMIT 1
      `,
      [reviewId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Avis introuvable ou non autorise.");
    }

    return Review.fromDatabase(result.rows[0]);
  }

  static async getReviewByIdForProvider({ reviewId, providerId }) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.booking_id::text AS booking_id,
        r.client_id::text AS client_id,
        r.provider_id::text AS provider_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at,"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at,"
        }
        s.id_service::text AS service_id,
        s.title AS service_title,
        u.full_name AS client_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = r.client_id
      WHERE r.id_review::text = $1
        AND r.provider_id::text = $2
      LIMIT 1
      `,
      [reviewId, providerId]
    );

    if (!result.rows[0]) {
      throw new Error("Avis introuvable ou non autorise.");
    }

    return Review.fromDatabase(result.rows[0]);
  }

  static async create({ booking_id, client_id, provider_id, rating, comment }) {
    const context = await this.getBookingReviewContext({
      bookingId: booking_id,
      clientId: client_id,
    });

    if (context.payment_status !== "paid") {
      throw new Error("Vous pouvez laisser un avis uniquement apres un paiement valide.");
    }

    if (String(context.provider_id) !== String(provider_id)) {
      throw new Error("Prestataire invalide pour cette réservation.");
    }

    if (context.review_id) {
      throw new Error("Un avis existe déjà pour cette réservation.");
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

  static async updateByClient({ reviewId, clientId, rating, comment }) {
    await this.getReviewByIdForClient({ reviewId, clientId });

    const result = await db.query(
      `
      UPDATE public.reviews
      SET
        rating = $1,
        comment = $2,
        updated_at = NOW()
      WHERE id_review::text = $3
        AND client_id::text = $4
      RETURNING id_review::text AS id
      `,
      [rating, comment || null, reviewId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Avis introuvable ou non autorise.");
    }

    return result.rows[0];
  }

  static async deleteByClient({ reviewId, clientId }) {
    const review = await this.getReviewByIdForClient({ reviewId, clientId });

    await db.query(
      `
      DELETE FROM public.reviews
      WHERE id_review::text = $1
        AND client_id::text = $2
      `,
      [reviewId, clientId]
    );

    return review;
  }

  static async replyByProvider({ reviewId, providerId, providerReply }) {
    if (!(await this.hasProviderReplyColumns())) {
      throw new Error("Les réponses aux avis ne sont pas encore disponibles.");
    }

    await this.getReviewByIdForProvider({ reviewId, providerId });

    const result = await db.query(
      `
      UPDATE public.reviews
      SET
        provider_reply = $1,
        provider_reply_created_at = COALESCE(provider_reply_created_at, NOW()),
        provider_reply_updated_at = NOW(),
        updated_at = NOW()
      WHERE id_review::text = $2
        AND provider_id::text = $3
      RETURNING id_review::text AS id
      `,
      [providerReply, reviewId, providerId]
    );

    if (!result.rows[0]) {
      throw new Error("Avis introuvable ou non autorise.");
    }

    return result.rows[0];
  }

  static async getByService(serviceId) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.created_at,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at,"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at,"
        }
        cu.full_name AS client_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.users cu ON cu.id_user = r.client_id
      WHERE b.service_id::text = $1
        AND COALESCE(r.hidden_by_admin, FALSE) = FALSE
        AND r.deleted_by_admin_at IS NULL
      ORDER BY r.created_at DESC
      `,
      [serviceId]
    );

    return Review.fromDatabaseList(result.rows);
  }

  static async listByClient(clientId) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.booking_id::text AS booking_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at,"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at,"
        }
        s.id_service::text AS service_slug,
        s.title AS service_title,
        u.full_name AS provider_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = r.provider_id
      WHERE r.client_id::text = $1
        AND COALESCE(r.hidden_by_admin, FALSE) = FALSE
        AND r.deleted_by_admin_at IS NULL
      ORDER BY r.created_at DESC
      `,
      [clientId]
    );

    return Review.fromDatabaseList(result.rows);
  }

  static async listByProvider(providerId) {
    const hasProviderReplyColumns = await this.hasProviderReplyColumns();
    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.booking_id::text AS booking_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        ${
          hasProviderReplyColumns
            ? "r.provider_reply, r.provider_reply_created_at, r.provider_reply_updated_at,"
            : "NULL::text AS provider_reply, NULL::timestamptz AS provider_reply_created_at, NULL::timestamptz AS provider_reply_updated_at,"
        }
        s.id_service::text AS service_slug,
        s.title AS service_title,
        u.full_name AS client_name
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = r.client_id
      WHERE r.provider_id::text = $1
        AND COALESCE(r.hidden_by_admin, FALSE) = FALSE
        AND r.deleted_by_admin_at IS NULL
      ORDER BY r.created_at DESC
      `,
      [providerId]
    );

    return Review.fromDatabaseList(result.rows);
  }
}

export default PgReviewRepository;
