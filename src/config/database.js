"use strict";

import pg from "pg";
import logger from "./logger.js";

const { Pool } = pg;

/**
 * Vérification obligatoire de DATABASE_URL
 */
if (!process.env.DATABASE_URL) {
  const errorMsg =
    "[ERROR] DATABASE_URL est manquante dans le fichier .env (HomeService)";

  logger.fatal({ error: errorMsg }, "Database configuration error");
  throw new Error(errorMsg);
}

/**
 * Configuration du pool PostgreSQL
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // SSL activé uniquement en production (Neon, Supabase, Render…)
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  max: 20, // connexions max
  idleTimeoutMillis: 30000, // timeout connexions inactives
  connectionTimeoutMillis: 5000, // timeout tentative connexion
});

/**
 * Log quand une connexion est établie
 */
pool.on("connect", () => {
  logger.debug("[DB] HomeService - PostgreSQL connected");
});

/**
 * Gestion des erreurs critiques du pool
 */
pool.on("error", (err) => {
  logger.error(
    { err },
    "[ERROR] HomeService - Unexpected error on idle database client"
  );

  // En production on redémarre proprement
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

/**
 * Test de connexion au démarrage (optionnel mais recommandé)
 */
export const testDatabaseConnection = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("[OK] HomeService - Database connection successful");
  } catch (error) {
    logger.fatal(
      { error: error.message },
      "[ERROR] HomeService - Database connection failed"
    );
    process.exit(1);
  }
};
pool.query(`
  SELECT 
    current_database() AS db,
    current_user AS user,
    inet_server_addr() AS host,
    inet_server_port() AS port
`)
.then(res => {
  logger.debug({ database: res.rows[0].db }, "[DB] Connection details verified");
})
.catch(err => {
  logger.error({ err }, "[DB] Connection details query failed");
});
export default pool;
