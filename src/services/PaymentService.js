"use strict";

import db from "../config/database.js";

class PaymentService {
  static _hasPaymentMethodColumn = null;

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

  static async listForUser(clientId) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.booking_id::text AS booking_id,
        p.amount,
        ${hasPaymentMethodColumn ? "p.payment_method" : "'card'::text AS payment_method"},
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

  static async payBooking({ bookingId, clientId, payment_method }) {
    const hasPaymentMethodColumn = await this.hasPaymentMethodColumn();

    const context = await this.getPayContext(bookingId, clientId);

    const result = hasPaymentMethodColumn
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
          [bookingId, context.amount, payment_method]
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
