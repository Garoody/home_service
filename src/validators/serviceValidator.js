"use strict";

import { z } from "zod";
import { PROVIDER_STATUS_VALUES } from "../constants/providerStatuses.js";

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
  // Cle etrangere vers catégories.id_category ou option "other".
  category_id: z.string().trim().min(1, "La catégorie est obligatoire."),
  custom_category_name: z.string().trim().max(100, "Le nom de la catégorie est trop long.").optional().default(""),
  // Limite SQL: varchar(150).
  title: z
      .string()
      .trim()
      .min(2, "Le titre est obligatoire.")
      .max(150, "Le titre est trop long."),
  // Champ texte obligatoire pour expliquer le service.
  description: z.string().trim().min(5, "La description est obligatoire."),
  // Prix numérique >= 0.
  price: z.number().min(0, "Le prix doit être positif."),
  // Informations professionnelles ajoutées au service.
  provider_status: z
    .string()
    .trim()
    .refine(
      (value) => PROVIDER_STATUS_VALUES.includes(value),
      "Le statut du prestataire est obligatoire."
    ),
  experience_years: z.number().int().min(0, "L'annee d'expérience est invalide.").max(60, "L'annee d'expérience est invalide."),
  trainings: z.string().trim().max(500, "Les formations sont trop longues.").optional(),
  has_driving_license: z.boolean(),
  service_area: z.string().trim().min(2, "La zone d'intervention est obligatoire.").max(255, "La zone d'intervention est trop longue."),
}).superRefine((data, ctx) => {
  if (data.category_id === "other") {
    if (!data.custom_category_name || data.custom_category_name.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["custom_category_name"],
        message: "Precise le type de service si la catégorie n'existe pas.",
      });
    }
    return;
  }

  if (!z.string().uuid().safeParse(data.category_id).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["category_id"],
      message: "Catégorie invalide.",
    });
  }
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
    custom_category_name: payload.custom_category_name,
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    provider_status: payload.provider_status,
    experience_years: Number(payload.experience_years),
    trainings: payload.trainings || "",
    has_driving_license:
      payload.has_driving_license === true ||
      payload.has_driving_license === "true" ||
      payload.has_driving_license === "on",
    service_area: payload.service_area,
  };

  const result = serviceSchema.safeParse(normalized);
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
