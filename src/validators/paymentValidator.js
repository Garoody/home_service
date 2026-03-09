"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider un paiement conforme au schema SQL.
 *
 * Entree:
 * - booking_id, amount, payment_status (optionnel)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
const paymentSchema = z.object({
  // Cle etrangere vers bookings.id_booking.
  booking_id: z.string().uuid("Reservation invalide."),
  // Montant non negatif.
  amount: z.number().min(0, "Le montant doit etre positif."),
  // Mode de paiement choisi par le client.
  payment_method: z.enum(["card", "cash", "bank_transfer"]),
  // Statut autorise par le type enum metier.
  payment_status: z.enum(["pending", "paid"]).optional(),
});

/**
 * Objectif:
 * Normaliser les types entrants puis valider.
 *
 * Entree:
 * - payload brut (amount peut arriver en string)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
export function validatePaymentPayload(payload = {}) {
  const normalized = {
    booking_id: payload.booking_id,
    amount: Number(payload.amount),
    payment_method: payload.payment_method,
    payment_status: payload.payment_status,
  };

  const result = paymentSchema.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }
  return { success: true, data: result.data, message: null };
}
