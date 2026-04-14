"use strict";

import db from "../config/database.js";
import BookingService from "./BookingService.js";
import ConversationService from "./ConversationService.js";

/**
 * PaymentService
 * Gère le paiement d'une réservation et les cartes enregistrees du client.
 * Les données sensibles de carte ne sont jamais persistees en clair.
 */
class PaymentService {
  static _hasPaymentMethodColumn = null;
  static _hasPaymentDetailsColumn = null;
  static _hasSavedPaymentMethodsTable = null;

  static async hasPaymentMethodColumn() {
    if (this._hasPaymentMethodColumn !== null) return this._hasPaymentMethodColumn;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'payment_method'
      `
    );

    this._hasPaymentMethodColumn = result.rows[0]?.count === 1;
    return this._hasPaymentMethodColumn;
  }

  static async hasSavedPaymentMethodsTable() {
    if (this._hasSavedPaymentMethodsTable !== null) return this._hasSavedPaymentMethodsTable;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'saved_payment_methods'
      `
    );

    this._hasSavedPaymentMethodsTable = result.rows[0]?.count === 1;
    return this._hasSavedPaymentMethodsTable;
  }

  static async hasPaymentDetailsColumn() {
    if (this._hasPaymentDetailsColumn !== null) return this._hasPaymentDetailsColumn;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'payment_details'
      `
    );

    this._hasPaymentDetailsColumn = result.rows[0]?.count === 1;
    return this._hasPaymentDetailsColumn;
  }

  static async listSavedMethodsForUser(clientId) {
    const hasTable = await this.hasSavedPaymentMethodsTable();
    if (!hasTable) return [];

    const result = await db.query(
      `
      SELECT
        id_saved_payment_method::text AS id,
        brand,
        last4,
        exp_month,
        exp_year,
        cardholder_name,
        is_default,
        created_at
      FROM public.saved_payment_methods
      WHERE user_id::text = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  // Charge une carte enregistree appartenant bien au client connecté.
  static async getSavedMethodById({ clientId, savedMethodId, dbClient = db }) {
    const hasTable = await this.hasSavedPaymentMethodsTable();
    if (!hasTable) {
      throw new Error("Les cartes enregistrees ne sont pas disponibles.");
    }

    const result = await dbClient.query(
      `
      SELECT
        id_saved_payment_method::text AS id,
        brand,
        last4,
        exp_month,
        exp_year,
        cardholder_name,
        is_default
      FROM public.saved_payment_methods
      WHERE id_saved_payment_method::text = $1
        AND user_id::text = $2
      LIMIT 1
      `,
      [savedMethodId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Carte enregistree introuvable.");
    }

    return result.rows[0];
  }

  // Enregistre uniquement des métadonnées non sensibles pour reutilisation future.
  static async saveCardForUser({ clientId, brand, last4, exp_month, exp_year, cardholder_name, is_default = false, dbClient = db }) {
    const hasTable = await this.hasSavedPaymentMethodsTable();
    if (!hasTable) {
      return null;
    }

    if (is_default) {
      await dbClient.query(
        `
        UPDATE public.saved_payment_methods
        SET is_default = false, updated_at = NOW()
        WHERE user_id::text = $1
        `,
        [clientId]
      );
    }

    const result = await dbClient.query(
      `
      INSERT INTO public.saved_payment_methods (
        user_id,
        brand,
        last4,
        exp_month,
        exp_year,
        cardholder_name,
        is_default
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING id_saved_payment_method::text AS id
      `,
      [clientId, brand, last4, exp_month, exp_year, cardholder_name, is_default]
    );

    return result.rows[0];
  }

  // Retourne l'historique des paiements du client.
  static async listForUser(clientId) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();
    const hasConversationTables = await ConversationService.hasConversationTables();

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.booking_id::text AS booking_id,
        p.amount,
        ${hasPaymentMethodColumn ? "p.payment_method" : "'card'::text AS payment_method"},
        ${hasPaymentDetailsColumn ? "p.payment_details" : "NULL::jsonb AS payment_details"},
        ${
          hasConversationTables
            ? "CASE WHEN cp.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        },
        p.payment_status,
        p.payment_date,
        p.created_at,
        s.id_service::text AS service_slug,
        s.title AS service_title
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp ON cp.conversation_id = bc.id_conversation AND cp.user_id = b.client_id"
          : ""
      }
      WHERE b.client_id::text = $1
      ORDER BY p.created_at DESC
      `,
      [clientId]
    );

    return result.rows;
  }

  // Retourne les paiements regles sur les services d'un prestataire.
  static async listForProvider(providerId) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.booking_id::text AS booking_id,
        p.amount,
        ${hasPaymentMethodColumn ? "p.payment_method" : "'card'::text AS payment_method"},
        ${hasPaymentDetailsColumn ? "p.payment_details" : "NULL::jsonb AS payment_details"},
        p.payment_status,
        p.payment_date,
        p.created_at,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        u.full_name AS client_name
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = b.client_id
      WHERE s.provider_id::text = $1
        AND p.payment_status = 'paid'
      ORDER BY COALESCE(p.payment_date, p.created_at) DESC
      `,
      [providerId]
    );

    return result.rows;
  }

  static async getByIdForUser({ paymentId, clientId }) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();
    const hasConversationTables = await ConversationService.hasConversationTables();

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.booking_id::text AS booking_id,
        p.amount,
        ${hasPaymentMethodColumn ? "p.payment_method" : "'card'::text AS payment_method"},
        ${hasPaymentDetailsColumn ? "p.payment_details" : "NULL::jsonb AS payment_details"},
        p.payment_status,
        p.payment_date,
        p.created_at,
        b.status AS booking_status,
        b.booking_date,
        b.booking_time,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        s.description AS service_description,
        u.full_name AS provider_name,
        u.email AS provider_email,
        ${
          hasConversationTables
            ? "CASE WHEN cp.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        }
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = s.provider_id
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp ON cp.conversation_id = bc.id_conversation AND cp.user_id = b.client_id"
          : ""
      }
      WHERE p.id_payment::text = $1
        AND b.client_id::text = $2
      LIMIT 1
      `,
      [paymentId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Paiement introuvable.");
    }

    return result.rows[0];
  }

  static async getByIdForProvider({ paymentId, providerId }) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();
    const hasConversationTables = await ConversationService.hasConversationTables();

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.booking_id::text AS booking_id,
        p.amount,
        ${hasPaymentMethodColumn ? "p.payment_method" : "'card'::text AS payment_method"},
        ${hasPaymentDetailsColumn ? "p.payment_details" : "NULL::jsonb AS payment_details"},
        p.payment_status,
        p.payment_date,
        p.created_at,
        b.status AS booking_status,
        b.booking_date,
        b.booking_time,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        s.description AS service_description,
        u.full_name AS client_name,
        u.email AS client_email,
        ${
          hasConversationTables
            ? "CASE WHEN cp.deleted_at IS NULL THEN bc.id_conversation::text ELSE NULL::text END AS conversation_id"
            : "NULL::text AS conversation_id"
        }
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = b.client_id
      ${
        hasConversationTables
          ? "LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking LEFT JOIN public.conversation_participants cp ON cp.conversation_id = bc.id_conversation AND cp.user_id = s.provider_id"
          : ""
      }
      WHERE p.id_payment::text = $1
        AND s.provider_id::text = $2
      LIMIT 1
      `,
      [paymentId, providerId]
    );

    if (!result.rows[0]) {
      throw new Error("Paiement introuvable.");
    }

    return result.rows[0];
  }

  // Verifie qu'une réservation appartient au client avant paiement.
  static async getPayContext(bookingId, clientId, dbClient = db) {
    const hasAdminStatusColumn = await BookingService.hasAdminStatusColumn();
    const result = await dbClient.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        b.total_price AS amount,
        b.status AS booking_status,
        b.booking_date,
        b.booking_time,
        s.provider_id::text AS provider_id,
        s.title AS service_title,
        ${hasAdminStatusColumn ? "COALESCE(s.admin_status, 'active') AS service_admin_status," : "'active'::varchar AS service_admin_status,"}
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      WHERE b.id_booking::text = $1
        AND b.client_id::text = $2
      `,
      [bookingId, clientId]
    );

    if (!result.rows[0]) {
      throw new Error("Réservation introuvable ou non autorisée.");
    }

    const context = result.rows[0];

    if (context.booking_status !== "confirmed") {
      throw new Error("Le paiement est disponible uniquement apres confirmation du prestataire.");
    }

    if (context.service_admin_status !== "active") {
      throw new Error("Ce service n'est plus disponible suite a une modération admin.");
    }

    if (context.payment_status === "paid") {
      throw new Error("Cette réservation a déjà été payée.");
    }

    const conflict = await BookingService.findPaidConflictForSlot({
      providerId: context.provider_id,
      bookingDate: context.booking_date,
      bookingTime: context.booking_time,
      excludeBookingId: bookingId,
      dbClient,
    });

    if (conflict) {
      throw new Error("Ce creneau n'est plus disponible. Une autre réservation a déjà été payée a cette heure.");
    }

    return context;
  }

  // Enregistre simplement le mode de paiement choisi lors de la réservation.
  static async registerBookingPaymentSelection({
    bookingId,
    clientId,
    payment_method,
    payment_details = null,
  }) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();
    const context = await this.getPayContext(bookingId, clientId);
    const detailsJson = payment_details ? JSON.stringify(payment_details) : null;

    const result = hasPaymentMethodColumn && hasPaymentDetailsColumn
      ? await db.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_method, payment_status, payment_date, payment_details)
          VALUES ($1::uuid, $2, $3, 'pending', NULL, $4::jsonb)
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_method = EXCLUDED.payment_method,
            payment_status = 'pending',
            payment_date = NULL,
            payment_details = EXCLUDED.payment_details,
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount, payment_method, detailsJson]
        )
      : hasPaymentMethodColumn
      ? await db.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_method, payment_status, payment_date)
          VALUES ($1::uuid, $2, $3, 'pending', NULL)
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_method = EXCLUDED.payment_method,
            payment_status = 'pending',
            payment_date = NULL,
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount, payment_method]
        )
      : await db.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_status, payment_date)
          VALUES ($1::uuid, $2, 'pending', NULL)
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_status = 'pending',
            payment_date = NULL,
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount]
        );

    return result.rows[0];
  }

  static async payBooking({
    bookingId,
    clientId,
    payment_method,
    payment_source,
    saved_method_id,
    save_card,
    cardholder_name,
    card_number,
    exp_month,
    exp_year,
    payment_details = null,
  }) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();
    const hasPaymentDetailsColumn = await this.hasPaymentDetailsColumn();
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const context = await this.getPayContext(bookingId, clientId, client);
      const slotLockKey = `booking-slot:${context.provider_id}:${context.booking_date}:${context.booking_time}`;

      await client.query(
        `
        SELECT pg_advisory_xact_lock(hashtext($1))
        `,
        [slotLockKey]
      );

      const conflict = await BookingService.findPaidConflictForSlot({
        providerId: context.provider_id,
        bookingDate: context.booking_date,
        bookingTime: context.booking_time,
        excludeBookingId: bookingId,
        dbClient: client,
      });

      if (conflict) {
        throw new Error("Ce creneau n'est plus disponible. Une autre réservation a déjà été payée a cette heure.");
      }

      let finalPaymentMethod = payment_method;
      let finalPaymentDetails = payment_details;

      if (payment_source === "saved") {
        const savedMethod = await this.getSavedMethodById({
          clientId,
          savedMethodId: saved_method_id,
          dbClient: client,
        });
        finalPaymentMethod = savedMethod.brand;
      } else if (save_card) {
        const digits = String(card_number || "").replace(/\s+/g, "");
        await this.saveCardForUser({
          clientId,
          brand: payment_method,
          last4: digits.slice(-4),
          exp_month,
          exp_year,
          cardholder_name,
          dbClient: client,
        });
      }

      if (!finalPaymentDetails && ["cb", "visa", "mastercard", "other"].includes(payment_method)) {
        const digits = String(card_number || "").replace(/\s+/g, "");
        finalPaymentDetails = {
          cardholder_name,
          last4: digits.slice(-4),
          exp_month,
          exp_year,
        };
      }

      const detailsJson = finalPaymentDetails ? JSON.stringify(finalPaymentDetails) : null;

      const result = hasPaymentMethodColumn && hasPaymentDetailsColumn
        ? await client.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_method, payment_status, payment_date, payment_details)
          VALUES ($1::uuid, $2, $3, 'paid', NOW(), $4::jsonb)
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_method = EXCLUDED.payment_method,
            payment_status = 'paid',
            payment_date = NOW(),
            payment_details = EXCLUDED.payment_details,
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount, finalPaymentMethod, detailsJson]
        )
        : hasPaymentMethodColumn
        ? await client.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_method, payment_status, payment_date)
          VALUES ($1::uuid, $2, $3, 'paid', NOW())
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_method = EXCLUDED.payment_method,
            payment_status = 'paid',
            payment_date = NOW(),
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount, finalPaymentMethod]
        )
        : await client.query(
          `
          INSERT INTO public.payments (booking_id, amount, payment_status, payment_date)
          VALUES ($1::uuid, $2, 'paid', NOW())
          ON CONFLICT (booking_id)
          DO UPDATE SET
            amount = EXCLUDED.amount,
            payment_status = 'paid',
            payment_date = NOW(),
            updated_at = NOW()
          RETURNING id_payment::text AS id
          `,
          [bookingId, context.amount]
        );

      const conversation = await ConversationService.ensureBookingConversation({
        bookingId,
        dbClient: client,
      });

      await client.query("COMMIT");

      return {
        ...result.rows[0],
        conversationId: conversation?.id || null,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default PaymentService;
