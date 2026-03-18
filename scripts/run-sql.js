"use strict";

/**
 * Lance un fichier SQL en utilisant DATABASE_URL depuis .env.
 * Ce script evite les problemes de syntaxe shell entre Linux et Windows.
 */

import dotenv from "dotenv";
import { spawn } from "node:child_process";
import path from "node:path";

dotenv.config();

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node scripts/run-sql.js <fichier.sql>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est manquante dans le fichier .env.");
  process.exit(1);
}

const absoluteSqlPath = path.resolve(sqlFile);
const child = spawn("psql", [process.env.DATABASE_URL, "-f", absoluteSqlPath], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

