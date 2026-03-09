"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider un service avant insertion/mise a jour.
 *
 * Entree:
 * - payload: objet brut (category_id, title, description, price)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
const serviceSchema = z.object({
  // Cle etrangere vers categories.id_category.
  category_id: z.string().uuid("Categorie invalide."),
  // Limite SQL: varchar(150).
  title: z.string().trim().min(2, "Le titre est obligatoire.").max(150, "Le titre est trop long."),
  // Champ texte obligatoire pour expliquer le service.
  description: z.string().trim().min(5, "La description est obligatoire."),
  // Prix numerique >= 0.
  price: z.number().min(0, "Le prix doit etre positif."),
});

/**
 * Objectif:
 * Normaliser les types entrants (price en nombre) puis valider.
 *
 * Entree:
 * - payload brut (souvent price en string depuis formulaire HTML)
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
export function validateServicePayload(payload = {}) {
  const normalized = {
    category_id: payload.category_id,
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
  };

  const result = serviceSchema.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  return { success: true, data: result.data, message: null };
}
