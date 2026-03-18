"use strict";
import { z } from "zod";
/**
 * Objectif:
 * Encapsuler la validation de format de date pour les reservations.
 * Entree:
 * - string au format attendu YYYY-MM-DD
 * Sorti
 * - valeur validee ou erreur Zod
 */
const bookingDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD).");

/**
 * Objectif:
 * Encapsuler la validation de format d'heure pour les reservations.
 * Entree:
 * - string au format HH:MM ou HH:MM:SS
 * Sortie:
 * - valeur validee ou erreur Zod
 */
const bookingTime = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Heure invalide (HH:MM).");

// Validation complete pour creation (service + date + heure).
const bookingCreateSchema = z.object({
  service_id: z.string().uuid("Service invalide."),
  first_name: z.string().trim().min(2, "Le prenom est obligatoire.").max(120, "Le prenom est trop long."),
  last_name: z.string().trim().min(2, "Le nom est obligatoire.").max(120, "Le nom est trop long."),
  city: z.string().trim().min(2, "La ville est obligatoire.").max(120, "La ville est trop longue."),
  address: z.string().trim().min(5, "L'adresse est obligatoire.").max(255, "L'adresse est trop longue."),
  booking_date: bookingDate,
  booking_time: bookingTime,
  payment_method: z.enum(["cb", "paypal", "bank_transfer", "cash"], "Mode de paiement invalide."),
  cardholder_name: z.string().trim().max(120, "Nom du titulaire trop long.").optional().or(z.literal("")),
  card_number: z.string().trim().max(23, "Numero de carte invalide.").optional().or(z.literal("")),
  expiry: z.string().trim().max(5, "Date d'expiration invalide.").optional().or(z.literal("")),
  cvc: z.string().trim().max(4, "CVC invalide.").optional().or(z.literal("")),
  save_card: z.boolean().optional(),
  paypal_email: z.string().trim().max(255, "Email PayPal invalide.").optional().or(z.literal("")),
  bank_account_name: z.string().trim().max(120, "Nom du titulaire trop long.").optional().or(z.literal("")),
  iban: z.string().trim().max(34, "IBAN invalide.").optional().or(z.literal("")),
  cash_acknowledged: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.payment_method === "cb") {
    if (!data.cardholder_name || data.cardholder_name.trim().length < 2) {
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

    if (!/^\d{2}\/\d{2}$/.test(String(data.expiry || ""))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry"],
        message: "Date d'expiration invalide (MM/AA).",
      });
    }

    if (!/^\d{3,4}$/.test(String(data.cvc || ""))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cvc"],
        message: "CVC invalide.",
      });
    }

    return;
  }

  if (data.payment_method === "paypal") {
    const emailResult = z.string().email().safeParse(data.paypal_email);
    if (!emailResult.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paypal_email"],
        message: "L'email PayPal est obligatoire.",
      });
    }

    return;
  }

  if (data.payment_method === "bank_transfer") {
    if (!data.bank_account_name || data.bank_account_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bank_account_name"],
        message: "Le nom du titulaire du compte est obligatoire.",
      });
    }

    const iban = String(data.iban || "").replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["iban"],
        message: "IBAN invalide.",
      });
    }

    return;
  }

  if (data.payment_method === "cash" && !data.cash_acknowledged) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cash_acknowledged"],
      message: "Confirme le paiement en especes avant de reserver.",
    });
  }
});

// Validation pour mise a jour du formulaire client complet.
const bookingUpdateSchema = z.object({
  first_name: z.string().trim().min(2, "Le prenom est obligatoire.").max(120, "Le prenom est trop long."),
  last_name: z.string().trim().min(2, "Le nom est obligatoire.").max(120, "Le nom est trop long."),
  city: z.string().trim().min(2, "La ville est obligatoire.").max(120, "La ville est trop longue."),
  address: z.string().trim().min(5, "L'adresse est obligatoire.").max(255, "L'adresse est trop longue."),
  booking_date: bookingDate,
  booking_time: bookingTime,
});

/**
 * Objectif:
 * Uniformiser le resultat de safeParse pour les controllers.
 * Entree:
 * - result: retour de zod.safeParse(...)
 * Sortie:
 * - { success, data, message }
 */
function toResult(result) {
  if (result.success) {
    return { success: true, data: result.data, message: null };
  }

  return {
    success: false,
    data: null,
    message: result.error.issues.map((issue) => issue.message).join(" | "),
  };
}

/**
 * Objectif:
 * Valider le payload de creation de reservation.
 */
export function validateBookingCreatePayload(payload = {}) {
  const normalized = {
    service_id: payload.service_id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    city: payload.city,
    address: payload.address,
    booking_date: payload.booking_date,
    booking_time: payload.booking_time,
    payment_method: payload.payment_method,
    cardholder_name: payload.cardholder_name,
    card_number: payload.card_number,
    expiry: payload.expiry,
    cvc: payload.cvc,
    save_card:
      payload.save_card === true ||
      payload.save_card === "true" ||
      payload.save_card === "on",
    paypal_email: payload.paypal_email,
    bank_account_name: payload.bank_account_name,
    iban: payload.iban,
    cash_acknowledged:
      payload.cash_acknowledged === true ||
      payload.cash_acknowledged === "true" ||
      payload.cash_acknowledged === "on",
  };

  return toResult(bookingCreateSchema.safeParse(normalized));
}

/**
 * Objectif:
 * Valider le payload de mise a jour de reservation.
 */
export function validateBookingUpdatePayload(payload = {}) {
  return toResult(bookingUpdateSchema.safeParse(payload));
}
