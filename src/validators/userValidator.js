"use strict";

import { z } from "zod";

/**
 * Schéma de validation pour la connexion.
 *
 * Règles:
 * - email doit être valide
 * - password non vide
 */
const loginSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

/**
 * Schéma de validation pour l'inscription.
 *
 * Règles:
 * - full_name entre 2 et 150 caractères
 * - phone optionnel (max 50)
 * - email valide
 * - password minimum 8 caractères
 * - role limité à client/provider
 * - gdpr_consent booléen
 */
const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Le nom complet est obligatoire.")
    .max(150, "Le nom complet est trop long."),
  phone: z.string().trim().max(50, "Le telephone est trop long.").optional(),
  email: z.string().trim().email("Email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  role: z.enum(["client", "provider"]).default("client"),
  gdpr_consent: z.boolean(),
});

/**
 * Valide les données de login.
 *
 * Contrat de retour (uniforme):
 * - success: boolean
 * - data: payload validé (si success=true)
 * - message: message concaténé lisible UI (si success=false)
 */
export function validateLoginPayload(payload = {}) {
  const result = loginSchema.safeParse(payload);

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
 * Normalise puis valide les données d'inscription.
 *
 * Normalisation nécessaire:
 * - gdpr_consent arrive souvent depuis HTML sous forme "on"/"true".
 */
export function validateRegisterPayload(payload = {}) {
  const normalized = {
    full_name: payload.full_name,
    phone: payload.phone,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    gdpr_consent:
      payload.gdpr_consent === true ||
      payload.gdpr_consent === "true" ||
      payload.gdpr_consent === "on",
  };

  const result = registerSchema.safeParse(normalized);

  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  // Règle métier complémentaire explicite: consentement RGPD obligatoire.
  if (!result.data.gdpr_consent) {
    return {
      success: false,
      data: null,
      message: "Le consentement RGPD est obligatoire.",
    };
  }

  return { success: true, data: result.data, message: null };
}
