"use strict";

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import logger from "./logger.js";

/**
 * Configuration Upload Images - HomeService
 * Stockage local (peut evoluer vers Cloudinary / S3 plus tard)
 */

const uploadPath = "public/uploads";

// Création automatique du dossier si inexistant
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  logger.info("Dossier uploads cree");
}

/**
 * Configuration du stockage
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    // Genere un nom unique securise
    const uniqueName = crypto.randomUUID();
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `${uniqueName}${extension}`);
  },
});

/**
 * Filtre : uniquement images autorisées
 */
const fileFilter = (_req, file, cb) => {
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
      "Tentative upload fichier non autorise"
    );

    cb(new Error("Format non supporte. Images uniquement."), false);
  }
};

/**
 * Middleware Multer configure
 */
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadConfig;
