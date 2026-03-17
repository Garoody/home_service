"use strict";

import { Router } from "express";
import ServiceController from "../../controllers/ServiceController.js";
import ServiceService from "../../services/ServiceService.js";
import { requireProvider } from "../../middlewares/authMiddleware.js";
import { requireOwnership } from "../../middlewares/ownershipMiddleware.js";

const router = Router();

router.get("/", ServiceController.index);
router.get("/new", requireProvider, ServiceController.create);
router.post("/", requireProvider, ServiceController.store);

// Seul le prestataire proprietaire du service (ou l'admin) peut modifier son annonce.
router.get(
  "/:slug/edit",
  requireProvider,
  requireOwnership((req) => ServiceService.getOwnerIdBySlug(req.params.slug)),
  ServiceController.edit
);
router.post(
  "/:slug/update",
  requireProvider,
  requireOwnership((req) => ServiceService.getOwnerIdBySlug(req.params.slug)),
  ServiceController.update
);

router.get("/:slug", ServiceController.show);

export default router;
