"use strict";

import { Router } from "express";
import ServiceController from "../controllers/ServiceController.js";
import ServiceService from "../services/ServiceService.js";
import { requireMember } from "../middlewares/authMiddleware.js";
import { requireOwnership } from "../middlewares/ownershipMiddleware.js";
import uploadConfig from "../config/upload.js";
import { validateCsrfRequest } from "../config/security.js";

const router = Router();

function getUploadErrorMessage(error) {
  if (error?.code === "LIMIT_FILE_SIZE") {
    return "Chaque photo doit faire 5 Mo maximum.";
  }

  if (error?.code === "LIMIT_UNEXPECTED_FILE" || error?.code === "LIMIT_FILE_COUNT") {
    return "Vous pouvez ajouter jusqu'à 6 photos par service.";
  }

  return error?.message || "Impossible d'envoyer les photos du service.";
}

const handleServicePhotosUpload = (getRedirectPath) => (req, res, next) => {
  uploadConfig.array("service_photos", 6)(req, res, (error) => {
    if (!error) return next();

    req.flash("error", getUploadErrorMessage(error));
    return res.redirect(getRedirectPath(req));
  });
};

const verifyMultipartServiceCsrf = (getRedirectPath) => (req, res, next) => {
  if (validateCsrfRequest(req)) return next();

  req.flash("error", "Votre session a expire ou le formulaire est invalide.");
  return res.redirect(getRedirectPath(req));
};

router.get("/", ServiceController.index);
router.get("/new", requireMember, ServiceController.create);
router.post(
  "/",
  requireMember,
  handleServicePhotosUpload(() => "/services/new"),
  verifyMultipartServiceCsrf(() => "/services/new"),
  ServiceController.store
);

// Seul le proprietaire connecté avec un compte membre peut modifier son annonce.
router.get(
  "/:slug/edit",
  requireMember,
  requireOwnership((req) => ServiceService.getOwnerIdBySlug(req.params.slug)),
  ServiceController.edit
);
router.post(
  "/:slug/update",
  requireMember,
  requireOwnership((req) => ServiceService.getOwnerIdBySlug(req.params.slug)),
  handleServicePhotosUpload((req) => `/services/${req.params.slug}/edit`),
  verifyMultipartServiceCsrf((req) => `/services/${req.params.slug}/edit`),
  ServiceController.update
);
router.post(
  "/:slug/delete",
  requireMember,
  requireOwnership((req) => ServiceService.getOwnerIdBySlug(req.params.slug)),
  ServiceController.destroy
);

router.get("/:slug", ServiceController.show);

export default router;
