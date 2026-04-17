// "use strict";

// import helmet from "helmet";
// import cors from "cors";
// import rateLimit from "express-rate-limit";
// import cookieParser from "cookie-parser";
// import { doubleCsrf } from "csrf-csrf";
// import logger from "./config/logger.js";

// const isTestEnv = process.env.NODE_ENV === "test";
// const isProd = process.env.NODE_ENV === "production";

// // ═══════════════════════════════════════════════════════════════
// // FAIL FAST — CSRF SECRET OBLIGATOIRE (sauf en test)
// // ═══════════════════════════════════════════════════════════════
// //
// if (!isTestEnv && !process.env.CSRF_SECRET) {
//   const msg = "❌ CSRF_SECRET manquant. Ajoute-le dans ton fichier .env (HomeService)";
//   logger.fatal({ error: msg }, "Security configuration error");
//   throw new Error(msg);
// }

// // ═══════════════════════════════════════════════════════════════
// // HEADERS DE SÉCURITÉ (Helmet)
// // ═══════════════════════════════════════════════════════════════

// export const securityHeaders = helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
//       styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
//       fontSrc: ["'self'", "https://fonts.gstatic.com"],
//       imgSrc: ["'self'", "data:", "https:"],
//       connectSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       baseUri: ["'self'"],
//       frameAncestors: ["'none'"],
//     },
//   },
//   referrerPolicy: { policy: "no-referrer" },
//   hidePoweredBy: true,
// });

// // ═══════════════════════════════════════════════════════════════
// // CORS
// // (utile surtout si front séparé ; sinon tu peux limiter / désactiver)
// // ═══════════════════════════════════════════════════════════════

// export const corsConfig = cors({
//   origin: process.env.APP_FRONTEND_URL || "http://localhost:3000",
//   credentials: true,
// });

// // ═══════════════════════════════════════════════════════════════
// // RATE LIMITING
// // ═══════════════════════════════════════════════════════════════

// export const globalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000,
//   standardHeaders: true,
//   legacyHeaders: false,
//   // localhost IPv4 + IPv6
//   skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
// });

// export const authLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000,
//   max: 10,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// // ═══════════════════════════════════════════════════════════════
// // COOKIES
// // À utiliser AVANT session & CSRF dans app.js
// // ═══════════════════════════════════════════════════════════════

// export const cookieParserMiddleware = cookieParser();

// // ═══════════════════════════════════════════════════════════════
// // CSRF (Double Submit Cookie)
// // Désactivé en environnement test
// // ═══════════════════════════════════════════════════════════════

// let generateCsrfToken;
// let doubleCsrfProtection;

// if (!isTestEnv) {
//   const csrf = doubleCsrf({
//     getSecret: () => process.env.CSRF_SECRET,

//     /**
//      * IMPORTANT :
//      * Si tu utilises express-session → utilise req.sessionID
//      * Ça évite beaucoup de "invalid csrf token".
//      */
//     getSessionIdentifier: (req) => req.sessionID || "homeservice-session",

//     cookieName: isProd ? "__Host-csrf" : "csrf",

//     cookieOptions: {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: isProd,
//       path: "/", // important (surtout pour __Host-)
//     },

//     onError: (req, res) => {
//       logger.warn(
//         { ip: req.ip, url: req.originalUrl, method: req.method },
//         "❌ CSRF invalid token (HomeService)"
//       );

//       // Si tu n’as pas encore la vue 403, change vers res.status(403).send(...)
//       return res.status(403).render("pages/errors/403", {
//         title: "Action non autorisée",
//       });
//     },
//   });

//   generateCsrfToken = csrf.generateCsrfToken;
//   doubleCsrfProtection = csrf.doubleCsrfProtection;
// } else {
//   // ✅ En test → bypass complet
//   generateCsrfToken = () => "test-token";
//   doubleCsrfProtection = (req, res, next) => next();
// }

// /**
//  * Génère un token CSRF pour les vues SSR
//  * Exemple controller :
//  *  res.render("...", { csrfToken: req.csrfToken() })
//  * ou :
//  *  res.render("...", { csrfToken: generateToken(req, res) })
//  */
// export function generateToken(req, res) {
//   return generateCsrfToken(req, res);
// }

// export { doubleCsrfProtection };









"use strict";

/**
 * @fileoverview Point d'entrée principal de l'application HomeServices
 */

import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import expressLayouts from "express-ejs-layouts";

// Routes
import routes from "./routes/index.js";

// Sécurité
import {
  securityHeaders,
  corsConfig,
  globalLimiter,
  cookieParserMiddleware,
  authLimiter,
  doubleCsrfProtection,
  generateToken,
} from "./config/security.js";

// Session
import { sessionMiddleware } from "./config/sessions.js";
import { configurePassport, passport } from "./config/passport.js";

// Middlewares métier
import { flashMiddleware } from "./middlewares/flashMiddleware.js";
import { injectUserToLocals } from "./middlewares/authMiddleware.js";
import {
  notFound,
  errorHandler,
} from "./middlewares/errorMiddleware.js";

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

// Initialise les strategies Passport (Google OAuth) apres chargement du .env.
configurePassport();

// ─────────────────────────────────────────────────────────────
// CONFIGURATION ESM
// ─────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// INITIALISATION EXPRESS
// ─────────────────────────────────────────────────────────────

const app = express();

// Reverse proxy support en production (Railway/Render/Nginx)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ─────────────────────────────────────────────────────────────
// MIDDLEWARES DE BASE
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (public)
app.use(express.static(path.join(__dirname, "..", "public")));

// Serve the project logo as favicon to avoid browser fallback icons.
app.get("/favicon.ico", (_req, res) => {
  return res.sendFile(path.join(__dirname, "..", "public", "images", "logo.svg"));
});

// ─────────────────────────────────────────────────────────────
// SÉCURITÉ GLOBALE
// cookieParser DOIT passer AVANT session & CSRF
// ─────────────────────────────────────────────────────────────
app.use(cookieParserMiddleware);
app.use(securityHeaders);
app.use(corsConfig);
app.use(globalLimiter);

// ─────────────────────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────────────────────
app.use(sessionMiddleware);
// Passport est utilise ici en mode stateless pour le callback OAuth.
app.use(passport.initialize());

// ─────────────────────────────────────────────────────────────
// FLASH + USER CONTEXT
// ─────────────────────────────────────────────────────────────
app.use(flashMiddleware);
app.use(injectUserToLocals);

// ─────────────────────────────────────────────────────────────
// CSRF (Double Submit Cookie)
// 1) Protection sur méthodes unsafe
// 2) Token dispo dans toutes les vues
// ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const unsafe = ["POST", "PUT", "PATCH", "DELETE"];
  if (!unsafe.includes(req.method)) return next();
  return doubleCsrfProtection(req, res, next);
});

app.use((req, res, next) => {
  try {
    // Skip token generation for common non-page requests that can overwrite
    // CSRF cookies after the form page is rendered.
    if (req.path === "/favicon.ico") {
      res.locals.csrfToken = null;
      return next();
    }

    // Force session initialization so CSRF session identifier stays stable
    // between GET (form render) and POST (form submit) when saveUninitialized=false.
    if (req.session && !req.session.csrfSessionId) {
      req.session.csrfSessionId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
    }
    res.locals.csrfToken = generateToken(req, res);
  } catch {
    res.locals.csrfToken = null;
  }
  next();
});

// ─────────────────────────────────────────────────────────────
// CONFIGURATION EJS
// ─────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// ─────────────────────────────────────────────────────────────
// RATE LIMITER AUTH desactive temporairement
// ─────────────────────────────────────────────────────────────
// app.use("/auth", authLimiter);

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────
app.use("/", routes);

// ─────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─────────────────────────────────────────────────────────────
// ERREURS GLOBALES
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏠 HomeServices - Plateforme de services à domicile      ║
║                                                           ║
║   🚀 Serveur lancé avec succès !                           ║
║   📍 URL: http://localhost:${PORT}                            ║
║   🌐 Environnement: ${process.env.NODE_ENV || "development"}                            ║
║   ⏰ Démarré le: ${new Date().toLocaleString("fr-FR")}                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// ─────────────────────────────────────────────────────────────
// ARRÊT PROPRE
// ─────────────────────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("\n\n👋 Arrêt du serveur HomeServices...");
  process.exit(0);
});

export default app;


