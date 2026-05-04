"use strict";

import { randomBytes } from "crypto";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";
import logger from "./logger.js";

const isTestEnv = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";

// ═══════════════════════════════════════════════════════════════
// FAIL FAST — CSRF SECRET OBLIGATOIRE (sauf en test)
// ═══════════════════════════════════════════════════════════════

if (!isTestEnv && !process.env.CSRF_SECRET) {
  const msg = "❌ CSRF_SECRET manquant. Ajoute-le dans ton fichier .env (HomeService)";
  logger.fatal({ error: msg }, "Security configuration error");
  throw new Error(msg);
}

// ═══════════════════════════════════════════════════════════════
// HEADERS DE SÉCURITÉ (Helmet)
// ═══════════════════════════════════════════════════════════════

function buildContentSecurityPolicy(nonce) {
  return {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `'nonce-${nonce}'`, "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  };
}

export const securityHeaders = (req, res, next) => {
  const nonce =
    res.locals.cspNonce ||
    randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  
  return helmet({
    contentSecurityPolicy: buildContentSecurityPolicy(nonce),
    referrerPolicy: { policy: "no-referrer" },
    hidePoweredBy: true,
  })(req, res, next);
};

// ═══════════════════════════════════════════════════════════════
// CORS
// (utile surtout si front séparé ; sinon tu peux limiter / désactiver)
// ═══════════════════════════════════════════════════════════════

export const corsConfig = cors({
  origin: process.env.APP_FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  // localhost IPv4 + IPv6
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// ═══════════════════════════════════════════════════════════════
// COOKIES
// À utiliser AVANT session & CSRF dans app.js
// ═══════════════════════════════════════════════════════════════

export const cookieParserMiddleware = cookieParser();

// ═══════════════════════════════════════════════════════════════
// CSRF (Double Submit Cookie)
// Désactivé en environnement test
// ═══════════════════════════════════════════════════════════════

let generateCsrfToken;
let doubleCsrfProtection;
let validateCsrfRequest;

if (!isTestEnv) {
  const isMultipartRequest = (req) =>
    req.headers["content-type"]?.startsWith("multipart/form-data");

  const isMultipartRouteHandledManually = (req) =>
    req.method === "POST" &&
    isMultipartRequest(req) &&
    (
      req.originalUrl?.startsWith("/users/profile") ||
      req.originalUrl === "/services" ||
      /^\/services\/[^/]+\/update$/.test(req.originalUrl || "")
    );

  const csrf = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET,
    // Read CSRF token from classic HTML form hidden input (`_csrf`) and headers.
    getCsrfTokenFromRequest: (req) =>
      req.body?._csrf ||
      req.headers["x-csrf-token"] ||
      req.headers["csrf-token"],

    /**
     * IMPORTANT :
     * Si tu utilises express-session → utilise req.sessionID
     * Ça évite beaucoup de "invalid csrf token".
     */
    getSessionIdentifier: (req) =>
      req.session?.csrfSessionId || req.sessionID || "homeservice-session",

    cookieName: isProd ? "__Host-csrf" : "csrf",

    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/", // important (surtout pour __Host-)
    },
    skipCsrfProtection: (req) =>
      isMultipartRouteHandledManually(req),

    onError: (req, res) => {
      logger.warn(
        { ip: req.ip, url: req.originalUrl, method: req.method },
        "❌ CSRF invalid token (HomeService)"
      );

      // Si tu n’as pas encore la vue 403, change vers res.status(403).send(...)
      return res.status(403).render("pages/errors/403", {
        title: "Action non autorisée",
        message: "Votre session a expiré ou le formulaire est invalide.",
      });
    },
  });

  generateCsrfToken = csrf.generateCsrfToken;
  doubleCsrfProtection = csrf.doubleCsrfProtection;
  validateCsrfRequest = csrf.validateRequest;
} else {
  // ✅ En test → bypass complet
  generateCsrfToken = () => "test-token";
  doubleCsrfProtection = (req, res, next) => next();
  validateCsrfRequest = () => true;
}

/**
 * Génère un token CSRF pour les vues SSR
 * Exemple controller :
 *  res.render("...", { csrfToken: req.csrfToken() })
 * ou :
 *  res.render("...", { csrfToken: generateToken(req, res) })
 */
export function generateToken(req, res) {
  return generateCsrfToken(req, res);
}

export { doubleCsrfProtection, validateCsrfRequest };

