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
  booking_id: z.string().uuid("Réservation invalide."),
  // Montant non negatif.
  amount: z.number().min(0, "Le montant doit être positif."),
  // Source du paiement: carte enregistree ou nouvelle carte.
  payment_source: z.enum(["saved", "new"]).default("new"),
  // Identifiant d'une carte déjà enregistree.
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
  // Coordonnées PayPal.
  paypal_full_name: z.string().trim().min(2, "Nom PayPal invalide.").max(120, "Nom PayPal trop long.").optional().or(z.literal("")),
  paypal_email: z.string().trim().max(160, "Adresse PayPal trop longue.").optional().or(z.literal("")),
  paypal_reference: z.string().trim().max(80, "Reference PayPal trop longue.").optional().or(z.literal("")),
  // Coordonnées de virement.
  bank_account_name: z.string().trim().min(2, "Nom du titulaire du compte invalide.").max(120, "Nom du titulaire du compte trop long.").optional().or(z.literal("")),
  bank_name: z.string().trim().min(2, "Nom de la banque invalide.").max(120, "Nom de la banque trop long.").optional().or(z.literal("")),
  iban: z.string().trim().regex(/^[A-Za-z0-9\s]{14,34}$/, "IBAN invalide.").optional().or(z.literal("")),
  bic: z.string().trim().regex(/^[A-Za-z0-9]{8,11}$/, "BIC / SWIFT invalide.").optional().or(z.literal("")),
  transfer_reference: z.string().trim().max(80, "Reference de virement trop longue.").optional().or(z.literal("")),
  // Memoriser la carte pour plus tard.
  save_card: z.boolean().optional(),
  // Statut autorise par le type enum metier.
  payment_status: z.enum(["pending", "paid"]).optional(),
}).superRefine((data, ctx) => {
  const isCardPayment = ["cb", "visa", "mastercard", "other"].includes(data.payment_method);

  if (isCardPayment) {
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

    return;
  }

  if (data.payment_method === "paypal") {
    if (!data.paypal_full_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paypal_full_name"],
        message: "Le nom du titulaire PayPal est obligatoire.",
      });
    }
    if (!String(data.paypal_email || "").includes("@")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paypal_email"],
        message: "L'adresse PayPal est obligatoire.",
      });
    }

    return;
  }

  if (data.payment_method === "bank_transfer") {
    if (!data.bank_account_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank_account_name"],
        message: "Le nom du titulaire du compte est obligatoire.",
      });
    }
    if (!data.bank_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank_name"],
        message: "Le nom de la banque est obligatoire.",
      });
    }
    if (!data.iban) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["iban"],
        message: "L'IBAN est obligatoire.",
      });
    }
    if (!data.bic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bic"],
        message: "Le BIC / SWIFT est obligatoire.",
      });
    }
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
    paypal_full_name: payload.paypal_full_name,
    paypal_email: String(payload.paypal_email || "").trim(),
    paypal_reference: payload.paypal_reference,
    bank_account_name: payload.bank_account_name,
    bank_name: payload.bank_name,
    iban: String(payload.iban || "").replace(/\s+/g, "").toUpperCase(),
    bic: String(payload.bic || "").replace(/\s+/g, "").toUpperCase(),
    transfer_reference: payload.transfer_reference,
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
      issues: result.error.issues,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  const paymentDetails =
    result.data.payment_method === "paypal"
      ? {
          paypal_full_name: result.data.paypal_full_name,
          paypal_email: result.data.paypal_email,
          paypal_reference: result.data.paypal_reference || null,
        }
      : result.data.payment_method === "bank_transfer"
      ? {
          bank_account_name: result.data.bank_account_name,
          bank_name: result.data.bank_name,
          bic: result.data.bic,
          iban_last4: result.data.iban ? result.data.iban.slice(-4) : null,
          transfer_reference: result.data.transfer_reference || null,
        }
      : null;

  return {
    success: true,
    data: {
      ...result.data,
      payment_details: paymentDetails,
    },
    issues: [],
    message: null,
  };
}
