"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider le payload de création/mise a jour d'une catégorie.
 * Entree:
 * - payload: objet brut (souvent req.body)
 * Sortie:
 * - { success: true, data, message: null } si valide
 * - { success: false, data: null, message } sinon
 */
const categorySchema = z.object({
  // Nom unique de catégorie (limite SQL: varchar(100)).
  name: z.string().trim().min(2, "Le nom est obligatoire.").max(100, "Le nom est trop long."),
  // Description optionnelle (alignement avec type text en base).
  description: z
    .string()
    .trim()
    .max(2000, "La description est trop longue.")
    .optional()
    .or(z.literal("")),
});

/**
 * Objectif:
 * Executer la validation Zod et normaliser le format de retour.
 * Entree:
 * - payload: objet catégorie
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
export function validateCategoryPayload(payload = {}) {
  const result = categorySchema.safeParse(payload);

  if (!result.success) {
    return {
      success: false,
      data: null,
      issues: result.error.issues,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }
  return { success: true, data: result.data, issues: [], message: null };
}
