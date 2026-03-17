"use strict";

/**
 * Lance un fichier SQL avec psql en lisant DATABASE_URL depuis l'environnement
 * ou depuis le fichier .env du projet.
 * Ce script evite les problemes de syntaxe de variables entre Windows et Unix.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});

const sqlFileArg = process.argv[2];
if (!sqlFileArg) {
  console.error("Fichier SQL manquant.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL est manquante dans l'environnement ou le fichier .env.");
  process.exit(1);
}

const sqlFile = path.resolve(projectRoot, sqlFileArg);
const result = spawnSync("psql", [databaseUrl, "-f", sqlFile], {
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(`Impossible de lancer psql : ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
