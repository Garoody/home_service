"use strict";

import { Router } from "express";
import BookingController from "../controllers/BookingController.js";
import { requireClient } from "../middlewares/authMiddleware.js";

const router = Router();

// Protection globale: seules les sessions client/admin peuvent acceder aux reservations.
router.use(requireClient);

// Liste des reservations de l'utilisateur connecte.
router.get("/", BookingController.index);
// Formulaire de creation d'une reservation.
router.get("/new", BookingController.new);
// Formulaire d'edition d'une reservation existante.
router.get("/:id/edit", BookingController.edit);
// Creation d'une reservation.
router.post("/", BookingController.store);
// Mise a jour (date/heure) d'une reservation.
router.post("/:id/update", BookingController.update);
// Suppression d'une reservation.
router.post("/:id/delete", BookingController.destroy);
// Route de secours pour suppression via lien direct.
router.get("/:id/delete", BookingController.destroy);

export default router;
