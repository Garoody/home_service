"use strict";

// Comme j'ai déjà generateToken() et doubleCsrfProtection dans ton security.js, on fait simple :
import { generateToken, doubleCsrfProtection } from "../config/security.js";

/**
 * Protège les requêtes POST/PUT/PATCH/DELETE (formulaires).
 */
export const csrfProtectUnsafe = (req, res, next) => {
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"];
  if (!unsafe.includes(req.method)) return next();
  return doubleCsrfProtection(req, res, next);
};

/**
 * Rend csrfToken disponible dans toutes les vues EJS.
 * Dans ton form : <input type="hidden" name="_csrf" value="<%= csrfToken %>">
 */
export const csrfTokenToLocals = (req, res, next) => {
  try {
    res.locals.csrfToken = generateToken(req, res);
  } catch {
    res.locals.csrfToken = null;
  }
  next();
};
