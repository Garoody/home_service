"use strict";

import { z } from "zod";

/**
 * Validation des signalements utilisateurs.
 * Ce validateur garde une structure simple pour la vue /reports/new
 * et pour les boutons "Signaler" repartis dans l'application.
 */
const reportSchema = z.object({
  target_type: z.enum(["service", "review", "user"], {
    errorMap: () => ({ message: "Cible de signalement invalide." }),
  }),
  target_id: z.string().uuid("Element signale invalide."),
  reason: z.string().trim().min(3, "Le motif de signalement est obligatoire.").max(100, "Le motif est trop long."),
  details: z.string().trim().max(2000, "Le detail du signalement est trop long.").optional().or(z.literal("")),
});

export function validateReportPayload(payload = {}) {
  const result = reportSchema.safeParse({
    target_type: payload.target_type,
    target_id: payload.target_id,
    reason: payload.reason,
    details: payload.details,
  });

  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  return { success: true, data: result.data, message: null };
}
