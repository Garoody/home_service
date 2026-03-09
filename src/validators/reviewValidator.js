"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider un avis client avant insertion en base.
 *
 * Entree:
 * - booking_id, provider_id, rating, comment (optionnel)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
const reviewSchema = z.object({
  // Reservation ciblee par l'avis.
  booking_id: z.string().uuid("Reservation invalide."),
  // Prestataire evalue.
  provider_id: z.string().uuid("Prestataire invalide."),
  // Note de 1 a 5 conformement a la contrainte SQL.
  rating: z.number().int().min(1, "La note minimum est 1.").max(5, "La note maximum est 5."),
  // Commentaire optionnel.
  comment: z.string().trim().max(5000, "Le commentaire est trop long.").optional().or(z.literal("")),
});

/**
 * Objectif:
 * Normaliser les types entrants puis valider.
 *
 * Entree:
 * - payload brut (rating peut arriver en string)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
export function validateReviewPayload(payload = {}) {
  const normalized = {
    booking_id: payload.booking_id,
    provider_id: payload.provider_id,
    rating: Number(payload.rating),
    comment: payload.comment,
  };

  const result = reviewSchema.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }
  return { success: true, data: result.data, message: null };
}
