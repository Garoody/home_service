"use strict";

import db from "../config/database.js";

/**
 * PaymentService
 * Gere le paiement d'une reservation et les cartes enregistrees du client.
 * Les donnees sensibles de carte ne sont jamais persistees en clair.
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

  // Charge une carte enregistree appartenant bien au client connecte.
  static async getSavedMethodById({ clientId, savedMethodId }) {
    const hasTable = await this.hasSavedPaymentMethodsTable();
    if (!hasTable) {
      throw new Error("Les cartes enregistrees ne sont pas disponibles.");
    }

    const result = await db.query(
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

  // Enregistre uniquement des metadonnees non sensibles pour reutilisation future.
  static async saveCardForUser({ clientId, brand, last4, exp_month, exp_year, cardholder_name, is_default = false }) {
    const hasTable = await this.hasSavedPaymentMethodsTable();
    if (!hasTable) {
      return null;
    }

    if (is_default) {
      await db.query(
        `
        UPDATE public.saved_payment_methods
        SET is_default = false, updated_at = NOW()
        WHERE user_id::text = $1
        `,
        [clientId]
      );
    }

    const result = await db.query(
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
        s.title AS service_title
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
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

  // Verifie qu'une reservation appartient au client avant paiement.
  static async getPayContext(bookingId, clientId) {
    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        b.total_price AS amount,
        b.status AS booking_status,
        s.title AS service_title
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
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

  // Enregistre simplement le mode de paiement choisi lors de la reservation.
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
    const context = await this.getPayContext(bookingId, clientId);

    let finalPaymentMethod = payment_method;
    let finalPaymentDetails = payment_details;

    // Deux chemins possibles:
    // - utiliser une carte deja enregistree
    // - utiliser une nouvelle carte et, si demande, en memoriser les metadonnees
    if (payment_source === "saved") {
      const savedMethod = await this.getSavedMethodById({
        clientId,
        savedMethodId: saved_method_id,
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

    // Le paiement est marque comme regle dans la reservation cible.
    const result = hasPaymentMethodColumn && hasPaymentDetailsColumn
      ? await db.query(
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
      ? await db.query(
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
      : await db.query(
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

    return result.rows[0];
  }
}

export default PaymentService;
