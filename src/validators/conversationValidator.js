"use strict";

import { z } from "zod";

const conversationMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Le message est vide.")
    .max(5000, "Le message est trop long."),
});

export function validateConversationMessagePayload(payload = {}) {
  const result = conversationMessageSchema.safeParse({
    message: payload.message,
  });

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
