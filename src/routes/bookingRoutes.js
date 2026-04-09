"use strict";

import { Router } from "express";
import BookingController from "../controllers/BookingController.js";
import { requireMember } from "../middlewares/authMiddleware.js";

const router = Router();

// Un compte utilisateur normal peut reserver meme s'il publie aussi des services.
router.use(requireMember);

// Liste des reservations de l'utilisateur connecte.
router.get("/", BookingController.index);
// Formulaire de creation d'une reservation.
router.get("/new", BookingController.new);
// Detail simple d'une reservation du client.
router.get("/:id", BookingController.show);
// Formulaire d'edition d'une reservation existante.
router.get("/:id/edit", BookingController.edit);
// Confirmation/refus d'une reservation par le prestataire.
router.post("/:id/confirm", BookingController.confirmByProvider);
router.post("/:id/refuse", BookingController.refuseByProvider);
// Creation d'une reservation.
router.post("/", BookingController.store);
// Mise a jour (date/heure) d'une reservation.
router.post("/:id/update", BookingController.update);
// Suppression d'une reservation.
router.post("/:id/delete", BookingController.destroy);
// Route de secours pour suppression via lien direct.
router.get("/:id/delete", BookingController.destroy);

export default router;
