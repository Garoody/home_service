"use strict";

import { z } from "zod";

/**
 * Validations admin pour la moderation post-publication.
 * On se limite ici aux actions sensibles exposees depuis le dashboard.
 */
const userStatusSchema = z.object({
  status: z.enum(["active", "suspended", "banned"], {
    errorMap: () => ({ message: "Statut utilisateur invalide." }),
  }),
  reason: z.string().trim().max(2000, "Le motif est trop long.").optional().or(z.literal("")),
  report_id: z.string().uuid("Signalement invalide.").optional().or(z.literal("")),
});

const warningSchema = z.object({
  message: z.string().trim().min(5, "Le message d'avertissement est obligatoire.").max(2000, "Le message est trop long."),
  report_id: z.string().uuid("Signalement invalide.").optional().or(z.literal("")),
});

const reportReviewSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"], {
    errorMap: () => ({ message: "Statut du signalement invalide." }),
  }),
  resolution_note: z.string().trim().max(2000, "La note de resolution est trop longue.").optional().or(z.literal("")),
});

function toContract(result) {
  if (!result.success) {
    return {
      success: false,
      data: null,
      message: result.error.issues.map((issue) => issue.message).join(" | "),
    };
  }

  return { success: true, data: result.data, message: null };
}

export function validateAdminUserStatusPayload(payload = {}) {
  return toContract(
    userStatusSchema.safeParse({
      status: payload.status,
      reason: payload.reason,
      report_id: payload.report_id,
    })
  );
}

export function validateAdminWarningPayload(payload = {}) {
  return toContract(
    warningSchema.safeParse({
      message: payload.message,
      report_id: payload.report_id,
    })
  );
}

export function validateAdminReportReviewPayload(payload = {}) {
  return toContract(
    reportReviewSchema.safeParse({
      status: payload.status,
      resolution_note: payload.resolution_note,
    })
  );
}
