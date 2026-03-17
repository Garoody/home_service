"use strict";

import { z } from "zod";

// Validation des champs de connexion.

/**
 * Schema de validation pour la connexion.
 *
 * Regles:
 * - email doit �tre valide
 * - password non vide
 */
const loginSchema = z.object({
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

/**
 * Sch�ma de validation pour l'inscription.
 *
 * Regles:
 * - full_name entre 2 et 150 caract�res
 * - phone optionnel (max 50)
 * - email valide
 * - password minimum 8 caract�res
 * - role limit� � client/provider
 * - gdpr_consent bool�en
 */
// Validation des champs d'inscription.
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

// Validation du profil prestataire.
const providerProfileSchema = z.object({
  experience_years: z.number().int().min(0, "L'annee d'experience est invalide.").max(60, "L'annee d'experience est invalide."),
  trainings: z.string().trim().min(2, "La formation est obligatoire.").max(500, "Les formations sont trop longues."),
  has_driving_license: z.boolean(),
  service_area: z.string().trim().min(2, "La zone d'intervention est obligatoire.").max(255, "La zone d'intervention est trop longue."),
});

/**
 * Valide les donnees de login.
 *
 * Contrat de retour (uniforme):
 * - success: boolean
 * - data: payload valid� (si success=true)
 * - message: message concat�n� lisible UI (si success=false)
 */
// Valide le payload de connexion et retourne un format uniforme.
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
 * Normalise puis valide les donn�es d'inscription.
 *
 * Normalisation n�cessaire:
 * - gdpr_consent arrive souvent depuis HTML sous forme "on"/"true".
 */
// Normalise (notamment RGPD) puis valide le payload d'inscription.
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

  // Regle metier complementaire explicite: consentement RGPD obligatoire.
  if (!result.data.gdpr_consent) {
    return {
      success: false,
      data: null,
      message: "Le consentement RGPD est obligatoire.",
    };
  }

  return { success: true, data: result.data, message: null };
}

export function validateProviderProfilePayload(payload = {}) {
  const normalized = {
    experience_years: Number(payload.experience_years),
    trainings: payload.trainings,
    has_driving_license:
      payload.has_driving_license === true ||
      payload.has_driving_license === "true" ||
      payload.has_driving_license === "on",
    service_area: payload.service_area,
  };

  const result = providerProfileSchema.safeParse(normalized);

  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  return { success: true, data: result.data, message: null };
}
