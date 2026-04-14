"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider une ligne de table pivot users_categories.
 *
 * Entree:
 * - id_user, id_category
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
const userCategorySchema = z.object({
  // Cle etrangere vers users.id_user.
  id_user: z.string().uuid("Utilisateur invalide."),
  // Cle etrangere vers catégories.id_category.
  id_category: z.string().uuid("Catégorie invalide."),
});

/**
 * Objectif:
 * Executer la validation et normaliser le format de retour.
 */
export function validateUserCategoryPayload(payload = {}) {
  const result = userCategorySchema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }
  return { success: true, data: result.data, message: null };
}
