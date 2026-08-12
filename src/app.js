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
  const startupLines = [
    "HomeServices - Plateforme de services a domicile",
    "",
    "Serveur lance avec succes",
    `URL: http://localhost:${PORT}`,
    `Environnement: ${process.env.NODE_ENV || "development"}`,
    `Demarre le: ${new Date().toLocaleString("fr-FR")}`,
  ];

  const contentWidth = Math.max(...startupLines.map((line) => line.length));
  const border = `+${"-".repeat(contentWidth + 2)}+`;
  const startupBox = [
    "",
    border,
    ...startupLines.map((line) => `| ${line.padEnd(contentWidth)} |`),
    border,
  ].join("\n");

  console.log(startupBox);
});

// ─────────────────────────────────────────────────────────────
// ARRÊT PROPRE
// ─────────────────────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("\n\nArret du serveur HomeServices...");
  process.exit(0);
});

export default app;

