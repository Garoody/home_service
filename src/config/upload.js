"use strict";

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import logger from "./logger.js";

/**
 * Configuration Upload Images - HomeService
 * Stockage local (peut évoluer vers Cloudinary / S3 plus tard)
 */

const uploadPath = "public/uploads";

// Création automatique du dossier si inexistant
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  logger.info("📁 Dossier uploads créé");s
}

/**
 * Configuration du stockage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    // Génère un nom unique sécurisé
    const uniqueName = crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${uniqueName}${extension}`);
  },
});

/**
 * Filtre : uniquement images autorisées
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn(
      { fileType: file.mimetype },
      "❌ Tentative upload fichier non autorisé"
    );

    cb(new Error("Format non supporté. Images uniquement."), false);
  }
};

/**
 * Middleware Multer configuré
 */
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default uploadConfig;