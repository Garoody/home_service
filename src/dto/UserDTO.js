"use strict";

/**
 * UserDTO : format expose aux vues / API publiques.
 *
 * - Ne contient jamais password, password_hash, token, ou champs internes.
 * - N'effectué pas de validation Zod ; il suppose une donnee déjà validee.
 */

/**
 * @typedef {Object} UserEntityLike
 * @property {string} id
 * @property {string} [email]
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {string} [full_name]
 * @property {string} [pseudo]
 * @property {string} [role]
 * @property {string} [role_name]
 * @property {Object|null} [preferences]
 * @property {boolean|null} [gdpr_consent]
 * @property {string|null} [created_at]
 */

/**
 * DTO pour login (utilise par AuthController).
 * @param {Object} payload
 * @returns {{ email: string, password: string }}
 */
export function toLoginDTO(payload = {}) {
  return {
    email: String(payload.email || "").trim().toLowerCase(),
    password: String(payload.password || ""),
  };
}

/**
 * DTO pour register (utilise par AuthController).
 * @param {Object} payload
 * @returns {{ first_name: string, last_name: string, full_name: string, phone: string|null, email: string, password: string, role: string, gdpr_consent: boolean }}
 */
export function toRegisterDTO(payload = {}) {
  const first_name = String(payload.first_name || "").trim();
  const last_name = String(payload.last_name || "").trim();

  return {
    first_name,
    last_name,
    // full_name reste disponible pour les affichages et requetes existants.
    full_name: `${first_name} ${last_name}`.trim(),
    phone: String(payload.phone || "").trim() || null,
    email: String(payload.email || "").trim().toLowerCase(),
    password: String(payload.password || ""),
    // Valeur technique par defaut pour un compte utilisateur standard.
    // Le même compte pourra ensuite réserver et publier des services.
    role: "client",
    gdpr_consent: payload.gdpr_consent === true,
  };
}

/**
 * Retour complet pour page profil.
 * @param {UserEntityLike} user
 * @returns {{ id: string, firstName: string, lastName: string, email: string|null, pseudo: string, role: string, preferences: Object, gdprConsent: boolean, createdAt: string|null }}
 */
export function profileDTO(user) {
  return {
    id: user.id,
    firstName: user.first_name || user.firstName || "",
    lastName: user.last_name || user.lastName || "",
    email: user.email ?? null,
    pseudo: user.pseudo || user.full_name || user.fullName || "",
    role: user.role_name || user.role || "client",
    preferences: user.preferences ?? {},
    gdprConsent: Boolean(user.gdpr_consent ?? user.gdprConsent),
    createdAt: user.created_at ?? user.createdAt ?? null,
  };
}

/**
 * Version minimale (ex: navbar).
 * @param {UserEntityLike} user
 * @returns {{ id: string, pseudo: string, role: string }}
 */
export function minimalDTO(user) {
  return {
    id: user.id,
    pseudo: user.pseudo || user.full_name || user.fullName || "",
    role: user.role_name || user.role || "client",
  };
}

/**
 * Export objet unique, style "model".
 */
export const UserDTO = {
  toLoginDTO,
  toRegisterDTO,
  profile: profileDTO,
  minimal: minimalDTO,
};

export default UserDTO;
