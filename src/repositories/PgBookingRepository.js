"use strict";

import db from "../config/database.js";

class PgBookingRepository {
  static _hasContactColumns = null;
  static _hasAdminStatusColumn = null;

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

  static async hasAdminStatusColumn() {
    if (this._hasAdminStatusColumn !== null) return this._hasAdminStatusColumn;

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'admin_status'
      ) AS exists
      `
    );

    this._hasAdminStatusColumn = result.rows[0]?.exists === true;
    return this._hasAdminStatusColumn;
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

  static async getServiceForBooking(serviceId) {
    const hasAdminStatusColumn = await this.hasAdminStatusColumn();
    const result = await db.query(
      `
      SELECT
        id_service,
        id_service::text AS slug,
        provider_id::text AS provider_id,
        title,
        price
      FROM public.services
      WHERE id_service::text = $1
        ${hasAdminStatusColumn ? "AND COALESCE(admin_status, 'active') = 'active'" : ""}
      LIMIT 1
      `,
      [serviceId]
    );

    return result.rows[0] || null;
  }

  static async getBookingContext(bookingId, dbClient = db) {
    const result = await dbClient.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.client_id::text AS client_id,
        b.status,
        b.booking_date,
        b.booking_time,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        s.id_service::text AS service_id,
        s.title AS service_title,
        s.provider_id::text AS provider_id
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      WHERE b.id_booking::text = $1
      LIMIT 1
      `,
      [bookingId]
    );
    return result.rows[0] || null;
  }

  static async findPaidConflictForSlot({
    providerId,
    bookingDate,
    bookingTime,
    excludeBookingId = null,
    dbClient = db,
  }) {
    const result = await dbClient.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        s.title AS service_title
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.payments p
        ON p.booking_id = b.id_booking
       AND p.payment_status = 'paid'
      WHERE s.provider_id::text = $1
        AND b.booking_date = $2
        AND b.booking_time = $3
        AND ($4::text IS NULL OR b.id_booking::text <> $4)
      LIMIT 1
      `,
      [providerId, bookingDate, bookingTime, excludeBookingId]
    );

    return result.rows[0] || null;
  }

  // Retourne uniquement les reservations du client connecte.
  static async listForUser(clientId, { hasConversationTables = false } = {}) {
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
        p.payment_status,
        ${
          hasConversationTables
            ? "CASE WHEN cp_conversation.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        },
        b.created_at,
        b.updated_at,
        s.title AS service_title,
        s.id_service::text AS service_slug,
        r.id_review::text AS review_id,
        (r.id_review IS NOT NULL) AS has_review
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp_conversation ON cp_conversation.conversation_id = bc.id_conversation AND cp_conversation.user_id = b.client_id"
          : ""
      }
      WHERE b.client_id = $1
      ORDER BY b.created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  // Charge une reservation precise du client pour l'ecran d'edition.
  static async getByIdForUser({ bookingId, clientId }) {
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

    return result.rows[0] || null;
  }

  static async getDetailForUser({
    bookingId,
    clientId,
    hasConversationTables = false,
  }) {
    const hasContactColumns = await this.hasContactColumns();

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.client_id::text AS client_id,
        b.service_id::text AS service_id,
        s.provider_id::text AS provider_id,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        s.description AS service_description,
        b.total_price,
        b.status,
        b.booking_date,
        b.booking_time,
        ${hasContactColumns ? "b.first_name" : "''::text AS first_name"},
        ${hasContactColumns ? "b.last_name" : "''::text AS last_name"},
        ${hasContactColumns ? "b.city" : "''::text AS city"},
        ${hasContactColumns ? "b.address" : "''::text AS address"},
        u.full_name AS provider_name,
        u.email AS provider_email,
        COALESCE(p.id_payment::text, NULL::text) AS payment_id,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        COALESCE(p.payment_method::text, NULL::text) AS payment_method,
        p.payment_date,
        r.id_review::text AS review_id,
        (r.id_review IS NOT NULL) AS has_review,
        ${
          hasConversationTables
            ? "CASE WHEN cp_conversation.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        },
        b.created_at,
        b.updated_at
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = s.provider_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp_conversation ON cp_conversation.conversation_id = bc.id_conversation AND cp_conversation.user_id = b.client_id"
          : ""
      }
      WHERE b.id_booking::text = $1
        AND b.client_id::text = $2
      LIMIT 1
      `,
      [bookingId, clientId]
    );

    return result.rows[0] || null;
  }

  static async listServiceViewerBookingsForUser({
    clientId,
    serviceIds = [],
    hasConversationTables = false,
  }) {
    if (!clientId || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return [];
    }

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.service_id::text AS service_id,
        b.status,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        b.created_at,
        ${
          hasConversationTables
            ? "CASE WHEN cp_conversation.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        }
      FROM public.bookings b
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp_conversation ON cp_conversation.conversation_id = bc.id_conversation AND cp_conversation.user_id = b.client_id"
          : ""
      }
      WHERE b.client_id::text = $1
        AND b.service_id = ANY($2::uuid[])
      ORDER BY b.created_at DESC
      `,
      [String(clientId), serviceIds]
    );

    return result.rows;
  }

  // Retourne les demandes recues par un prestataire sur ses services.
  static async listForProvider(
    providerId,
    { status, hasConversationTables = false } = {}
  ) {
    const values = [providerId];
    let statusSql = "";

    if (status) {
      values.push(status);
      statusSql = ` AND b.status = $${values.length}`;
    }

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.status,
        b.booking_date,
        b.booking_time,
        b.total_price,
        p.payment_status,
        ${
          hasConversationTables
            ? "CASE WHEN cp_conversation.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        },
        s.id_service::text AS service_slug,
        s.title AS service_title,
        u.full_name AS client_name
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = b.client_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp_conversation ON cp_conversation.conversation_id = bc.id_conversation AND cp_conversation.user_id = s.provider_id"
          : ""
      }
      WHERE s.provider_id::text = $1
      ${statusSql}
      ORDER BY b.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  static async getDetailForProvider({
    bookingId,
    providerId,
    hasConversationTables = false,
  }) {
    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.client_id::text AS client_id,
        s.provider_id::text AS provider_id,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        s.description AS service_description,
        b.total_price,
        b.status,
        b.booking_date,
        b.booking_time,
        b.first_name,
        b.last_name,
        b.city,
        b.address,
        u.full_name AS client_name,
        u.email AS client_email,
        COALESCE(p.id_payment::text, NULL::text) AS payment_id,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        COALESCE(p.payment_method::text, NULL::text) AS payment_method,
        p.payment_date,
        ${
          hasConversationTables
            ? "CASE WHEN cp_conversation.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        },
        b.created_at,
        b.updated_at
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = b.client_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp_conversation ON cp_conversation.conversation_id = bc.id_conversation AND cp_conversation.user_id = s.provider_id"
          : ""
      }
      WHERE b.id_booking::text = $1
        AND s.provider_id::text = $2
      LIMIT 1
      `,
      [bookingId, providerId]
    );

    return result.rows[0] || null;
  }

  // Cree une reservation avec le prix recopie depuis le service.
  static async create({
    client_id,
    service_id,
    first_name,
    last_name,
    city,
    address,
    booking_date,
    booking_time,
    total_price,
    dbClient = db,
  }) {
    const hasContactColumns = await this.hasContactColumns();

    const result = hasContactColumns
      ? await dbClient.query(
          `
          INSERT INTO public.bookings
          (client_id, service_id, first_name, last_name, city, address, booking_date, booking_time, status, total_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
          RETURNING id_booking::text AS id
          `,
          [
            client_id,
            service_id,
            first_name,
            last_name,
            city,
            address,
            booking_date,
            booking_time,
            total_price,
          ]
        )
      : await dbClient.query(
          `
          INSERT INTO public.bookings
          (client_id, service_id, booking_date, booking_time, status, total_price)
          VALUES ($1, $2, $3, $4, 'pending', $5)
          RETURNING id_booking::text AS id
          `,
          [client_id, service_id, booking_date, booking_time, total_price]
        );

    return result.rows[0] || null;
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
    dbClient = db,
  }) {
    const hasContactColumns = await this.hasContactColumns();

    const result = hasContactColumns
      ? await dbClient.query(
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
      : await dbClient.query(
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

    return result.rows[0] || null;
  }

  // Annule une reservation tant qu'elle n'est pas encore payee.
  static async deleteByClient({ bookingId, clientId, dbClient = db }) {
    const result = await dbClient.query(
      `
      UPDATE public.bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE id_booking::text = $1
        AND client_id::text = $2
        AND status IN ('pending', 'confirmed')
      RETURNING id_booking::text AS id, status
      `,
      [bookingId, clientId]
    );

    return result.rows[0] || null;
  }

  static async confirmByProvider({ bookingId, dbClient = db }) {
    const result = await dbClient.query(
      `
      UPDATE public.bookings
      SET status = 'confirmed', updated_at = NOW()
      WHERE id_booking::text = $1
      RETURNING id_booking::text AS id, status
      `,
      [bookingId]
    );

    return result.rows[0] || null;
  }

  static async refuseByProvider({ bookingId, dbClient = db }) {
    const result = await dbClient.query(
      `
      UPDATE public.bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE id_booking::text = $1
      RETURNING id_booking::text AS id, status
      `,
      [bookingId]
    );

    return result.rows[0] || null;
  }
}

export default PgBookingRepository;
