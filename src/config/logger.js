"use strict";
// src/config/logger.js
import pino, { destination } from "pino";
import PinoHttp, { pinoHttp } from "pino-http";
import fs from "fs";

const isDevelopment = process.env.NODE_ENV !== "production";

// Création automatique du dossier logs s'il n'existe pas (en dev)
if (isDevelopment && !fs.existsSync("./logs")) {
  fs.mkdirSync("./logs");
}

/**
 * Options de base pour pino
 * @type {pino.LoggerOptions}
 */
const baseLoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
};

const transport = isDevelopment
  ? pino.transport({
      targets: [
        // Cible 1 : console jolie
        {
          target: "pino-pretty",
          options: {
            destination: 1,
            colorizer: true,
            translateTime: "yyyy-mm-dd HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: "{level} {time} {msg}",
          },
        },
        // Cible 2 : Fichier JSON (pour garder l'historique local)
        {
          target: "pino/file",
          options: {
            destination: "./logs/app.log",
            mkdir: true,
          },
        },
      ],
    })
  : undefined;

/**
 * Crée et exporte le logger Pino principal
 * @type {pino.Logger}
 */
export const logger = pino(baseLoggerOptions, transport);

export const httpLogger = pinoHttp({
  logger: logger,

  autoLogging: {
    ignore: (req) => {
      // Ignore les requêtes techniques (CORS)
      if (req.method === "OPTIONS") return true;

      // Ignore les fichiers statiques (images, css, js)
      const url = req.url;
      if (
        url.startsWith("/css") ||
        url.startsWith("/js") ||
        url.startsWith("/images") ||
        url.startsWith("/favicon.ico")
      ) {
        return true;
      }
      return false;
    },
  },

  customLogLevel: (res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return "warn"; // Erreur client (ex: 404, 403)
    }
    if (res.statusCode >= 500) {
      return "error"; // Erreur serveur (CRITIQUE)
    }
    return "info"; // Succès (200, 301...)
  },
});

export default logger;
