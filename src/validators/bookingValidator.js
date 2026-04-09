"use strict";
import { z } from "zod";
import { validateBookingSlot } from "../utils/bookingSlot.js";
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
const bookingCreateSchema = z
  .object({
    service_id: z.string().uuid("Service invalide."),
    first_name: z.string().trim().min(2, "Le prenom est obligatoire.").max(120, "Le prenom est trop long."),
    last_name: z.string().trim().min(2, "Le nom est obligatoire.").max(120, "Le nom est trop long."),
    city: z.string().trim().min(2, "La ville est obligatoire.").max(120, "La ville est trop longue."),
    address: z.string().trim().min(5, "L'adresse est obligatoire.").max(255, "L'adresse est trop longue."),
    booking_date: bookingDate,
    booking_time: bookingTime,
  })
  .superRefine((data, ctx) => {
    const slotValidation = validateBookingSlot({
      bookingDate: data.booking_date,
      bookingTime: data.booking_time,
    });

    if (!slotValidation.valid) {
      ctx.addIssue({
        code: "custom",
        path: ["booking_time"],
        message: slotValidation.message,
      });
    }
  });

// Validation pour mise a jour du formulaire client complet.
const bookingUpdateSchema = z
  .object({
    first_name: z.string().trim().min(2, "Le prenom est obligatoire.").max(120, "Le prenom est trop long."),
    last_name: z.string().trim().min(2, "Le nom est obligatoire.").max(120, "Le nom est trop long."),
    city: z.string().trim().min(2, "La ville est obligatoire.").max(120, "La ville est trop longue."),
    address: z.string().trim().min(5, "L'adresse est obligatoire.").max(255, "L'adresse est trop longue."),
    booking_date: bookingDate,
    booking_time: bookingTime,
  })
  .superRefine((data, ctx) => {
    const slotValidation = validateBookingSlot({
      bookingDate: data.booking_date,
      bookingTime: data.booking_time,
    });

    if (!slotValidation.valid) {
      ctx.addIssue({
        code: "custom",
        path: ["booking_time"],
        message: slotValidation.message,
      });
    }
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
    return { success: true, data: result.data, issues: [], message: null };
  }

  return {
    success: false,
    data: null,
    issues: result.error.issues,
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
