
"use strict";

import session from "express-session";
import connectPgSession from "connect-pg-simple";
import { pool } from "./database.js";
import logger from "./logger.js";

const PgSession = connectPgSession(session);

const isProd = process.env.NODE_ENV === "production";

// FAIL FAST (important)
if (!process.env.SESSION_SECRET && !isProd) {
  logger.warn(
    "⚠️ SESSION_SECRET manquant dans .env (dev). Ajoute-le pour éviter les soucis."
  );
}
if (!process.env.SESSION_SECRET && isProd) {
  const msg = "❌ SESSION_SECRET manquant en production (.env)";
  logger.fatal(msg);
  throw new Error(msg);
}

/**
 * Middleware express-session configuré avec PostgreSQL
 * Table par défaut : "session" (connect-pg-simple)
 * Ici on force "user_sessions"
 */
export const sessionMiddleware = session({
  name: isProd ? "__Host-homeservice.sid" : "homeservice.sid",
  secret: process.env.SESSION_SECRET || "CHANGE_ME_IN_PRODUCTION",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,        // nécessite app.set("trust proxy", 1) en prod
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
  },

  store: new PgSession({
    pool,
    tableName: "user_sessions",
    // `app_service` has no CREATE privilege on schema `public` in this project.
    // Create the table via migrations/admin role instead of app runtime.
    createTableIfMissing: false,
    pruneExpired: true,

    // connect-pg-simple peut log en console : on centralise
    errorLog: (err) => {
      logger.error({ err }, "❌ Erreur store session PostgreSQL (HomeService)");
    },
  }),
});

/**
 * Utilitaire pour scripts SQL (création table)
 */
export const sessionTableConfig = {
  tableName: "user_sessions",
};
