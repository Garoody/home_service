"use strict";

import { Router } from "express";
import BookingController from "../controllers/BookingController.js";
import { requireMember } from "../middlewares/authMiddleware.js";

const router = Router();

// Un compte utilisateur normal peut réserver même s'il publie aussi des services.
router.use(requireMember);

// Liste des réservations de l'utilisateur connecté.
router.get("/", BookingController.index);
// Formulaire de création d'une réservation.
router.get("/new", BookingController.new);
// Détail simple d'une réservation du client.
router.get("/:id", BookingController.show);
// Formulaire d'edition d'une réservation existante.
router.get("/:id/edit", BookingController.edit);
// Confirmation/refus d'une réservation par le prestataire.
router.post("/:id/confirm", BookingController.confirmByProvider);
router.post("/:id/refuse", BookingController.refuseByProvider);
// Création d'une réservation.
router.post("/", BookingController.store);
// Mise a jour (date/heure) d'une réservation.
router.post("/:id/update", BookingController.update);
// Suppression d'une réservation.
router.post("/:id/delete", BookingController.destroy);
// Route de secours pour suppression via lien direct.
router.get("/:id/delete", BookingController.destroy);

export default router;
