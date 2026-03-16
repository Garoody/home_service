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
  // Source du paiement: carte enregistree ou nouvelle carte.
  payment_source: z.enum(["saved", "new"]).default("new"),
  // Identifiant d'une carte deja enregistree.
  saved_method_id: z.string().uuid("Carte enregistree invalide.").optional().or(z.literal("")),
  // Mode de paiement choisi par le client.
  payment_method: z.enum(["cb", "visa", "mastercard", "other", "paypal", "bank_transfer", "cash"]),
  // Titulaire de la carte.
  cardholder_name: z.string().trim().min(2, "Nom du titulaire invalide.").max(120, "Nom du titulaire trop long.").optional().or(z.literal("")),
  // Numero de carte saisi par le client. Il ne sera jamais stocke en clair.
  card_number: z.string().regex(/^[0-9\s]{12,23}$/, "Numero de carte invalide.").optional().or(z.literal("")),
  // Date d'expiration.
  exp_month: z.number().int().min(1, "Mois d'expiration invalide.").max(12, "Mois d'expiration invalide.").optional(),
  exp_year: z.number().int().min(new Date().getFullYear(), "Annee d'expiration invalide.").max(new Date().getFullYear() + 20, "Annee d'expiration invalide.").optional(),
  // CVC utilise seulement a la soumission, jamais persiste.
  cvc: z.string().regex(/^[0-9]{3,4}$/, "CVC invalide.").optional().or(z.literal("")),
  // Memoriser la carte pour plus tard.
  save_card: z.boolean().optional(),
  // Statut autorise par le type enum metier.
  payment_status: z.enum(["pending", "paid"]).optional(),
}).superRefine((data, ctx) => {
  const isCardPayment = ["cb", "visa", "mastercard", "other"].includes(data.payment_method);

  if (!isCardPayment) {
    return;
  }

  if (data.payment_source === "saved") {
    if (!data.saved_method_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["saved_method_id"],
        message: "Selectionnez une carte enregistree.",
      });
    }
    return;
  }

  if (!data.cardholder_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cardholder_name"],
      message: "Le nom du titulaire est obligatoire.",
    });
  }

  const digits = String(data.card_number || "").replace(/\s+/g, "");
  if (digits.length < 12 || digits.length > 19) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["card_number"],
      message: "Numero de carte invalide.",
    });
  }

  if (!data.exp_month) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["exp_month"],
      message: "Le mois d'expiration est obligatoire.",
    });
  }

  if (!data.exp_year) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["exp_year"],
      message: "L'annee d'expiration est obligatoire.",
    });
  }

  if (!data.cvc) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cvc"],
      message: "Le CVC est obligatoire.",
    });
  }
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
    payment_source: payload.payment_source === "saved" ? "saved" : "new",
    saved_method_id: payload.saved_method_id || "",
    payment_method: payload.payment_method,
    cardholder_name: payload.cardholder_name,
    card_number: String(payload.card_number || "").replace(/\s+/g, ""),
    exp_month: payload.exp_month ? Number(payload.exp_month) : undefined,
    exp_year: payload.exp_year ? Number(payload.exp_year) : undefined,
    cvc: String(payload.cvc || ""),
    save_card:
      payload.save_card === true ||
      payload.save_card === "true" ||
      payload.save_card === "on",
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
