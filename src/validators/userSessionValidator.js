"use strict";

import { z } from "zod";

/**
 * Objectif:
 * Valider la structure des sessions stockees dans user_sessions.
 *
 * Entree:
 * - sid, sess, expire
 *
 * Sortie:
 * - contrat uniforme { success, data, message }
 */
const userSessionSchema = z.object({
  // Identifiant de session (PRIMARY KEY).
  sid: z.string().min(1, "SID obligatoire."),
  // Donnees de session (JSON libre).
  sess: z.record(z.any(), { invalid_type_error: "Session invalide." }),
  // Date d'expiration ISO.
  expire: z.string().datetime("Date d'expiration invalide."),
});

/**
 * Objectif:
 * Executer la validation Zod et renvoyer un format standard.
 */
export function validateUserSessionPayload(payload = {}) {
  const result = userSessionSchema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }
  return { success: true, data: result.data, message: null };
}
