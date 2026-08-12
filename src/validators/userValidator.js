"use strict";

import { z } from "zod";
import { PROVIDER_STATUS_VALUES } from "../constants/providerStatuses.js";

const EMAIL_FORMAT_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/u;
const PHONE_DIGITS_REGEX = /^\d+$/;
const PHONE_FRENCH_FORMAT_REGEX = /^0\d{9}$/;

const unicodeEmailSchema = z
  .string()
  .trim()
  .min(3, "L'email est obligatoire.")
  .max(255, "L'email est trop long.")
  .refine((value) => EMAIL_FORMAT_REGEX.test(value), "Email invalide.");

const phoneSchema = z
  .string()
  .trim()
  .max(50, "Le téléphone est trop long.")
  .superRefine((value, context) => {
    if (value === "") {
      return;
    }

    if (!PHONE_DIGITS_REGEX.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seuls les chiffres sont autorises pour le téléphone.",
      });
      return;
    }

    if (!PHONE_FRENCH_FORMAT_REGEX.test(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le téléphone doit contenir exactement 10 chiffres et commencer par 0.",
      });
    }
  });

const loginSchema = z.object({
  email: unicodeEmailSchema,
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

const personNameSchema = (label) =>
  z
    .string()
    .trim()
    .min(2, `Le ${label} est obligatoire.`)
    .max(75, `Le ${label} est trop long.`);

const registerSchema = z.object({
  first_name: personNameSchema("prénom"),
  last_name: personNameSchema("nom"),
  phone: phoneSchema.optional(),
  email: unicodeEmailSchema,
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
  gdpr_consent: z.boolean(),
});

// Ces informations servent uniquement quand l'utilisateur souhaite
// publier des services. Elles restent facultatives pour le compte normal.
const serviceProfileSchema = z.object({
  provider_status: z
    .string()
    .trim()
    .nullable()
    .refine(
      (value) => value === null || PROVIDER_STATUS_VALUES.includes(value),
      "Le statut du prestataire est invalide."
    ),
  experience_years: z
    .number()
    .int()
    .min(0, "L'annee d'expérience est invalide.")
    .max(60, "L'annee d'expérience est invalide.")
    .nullable(),
  trainings: z.string().trim().max(500, "Les formations sont trop longues."),
  has_driving_license: z.boolean(),
  service_area: z.string().trim().max(255, "La zone d'intervention est trop longue."),
});

const userProfileSchema = z.object({
  first_name: personNameSchema("prénom"),
  last_name: personNameSchema("nom"),
  phone: phoneSchema.optional(),
  address: z.string().trim().max(255, "L'adresse est trop longue.").optional(),
});

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

export function validateLoginPayload(payload = {}) {
  return toResult(loginSchema.safeParse(payload));
}

export function validateRegisterPayload(payload = {}) {
  const normalized = {
    first_name: String(payload.first_name || ""),
    last_name: String(payload.last_name || ""),
    phone: payload.phone,
    email: payload.email,
    password: payload.password,
    gdpr_consent:
      payload.gdpr_consent === true ||
      payload.gdpr_consent === "true" ||
      payload.gdpr_consent === "on",
  };

  const result = registerSchema.safeParse(normalized);

  if (!result.success) {
    return toResult(result);
  }

  if (!result.data.gdpr_consent) {
    return {
      success: false,
      data: null,
      issues: [{ message: "Le consentement RGPD est obligatoire." }],
      message: "Le consentement RGPD est obligatoire.",
    };
  }

  return { success: true, data: result.data, issues: [], message: null };
}

export function validateServiceProfilePayload(payload = {}) {
  const normalized = {
    provider_status: payload.provider_status ? String(payload.provider_status).trim() : null,
    experience_years:
      payload.experience_years === "" ||
      payload.experience_years === undefined ||
      payload.experience_years === null
        ? null
        : Number(payload.experience_years),
    trainings: String(payload.trainings || ""),
    has_driving_license:
      payload.has_driving_license === true ||
      payload.has_driving_license === "true" ||
      payload.has_driving_license === "on",
    service_area: String(payload.service_area || "").trim(),
  };

  const result = serviceProfileSchema.safeParse(normalized);

  if (!result.success) {
    return toResult(result);
  }

  if (
    result.data.service_area &&
    result.data.service_area.length > 0 &&
    result.data.service_area.length < 2
  ) {
    return {
      success: false,
      data: null,
      issues: [{ message: "La zone d'intervention est trop courte." }],
      message: "La zone d'intervention est trop courte.",
    };
  }

  return {
    success: true,
    data: {
      ...result.data,
      provider_status: result.data.provider_status || null,
      trainings: result.data.trainings || null,
      service_area: result.data.service_area || null,
    },
    issues: [],
    message: null,
  };
}

export function validateUserProfilePayload(payload = {}) {
  const normalized = {
    first_name: String(payload.first_name || ""),
    last_name: String(payload.last_name || ""),
    phone: payload.phone || "",
    address: payload.address || "",
  };

  return toResult(userProfileSchema.safeParse(normalized));
}
