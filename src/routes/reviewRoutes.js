"use strict";

import { Router } from "express";
import ReviewController from "../controllers/ReviewController.js";
import { requireMember } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireMember);

// Formulaire d'avis pour une réservation du client connecté.
router.get("/bookings/:bookingId/new", ReviewController.new);
router.get("/:reviewId/edit", ReviewController.edit);

// Enregistrement de l'avis.
router.post("/", ReviewController.store);
router.post("/:reviewId", ReviewController.update);
router.post("/:reviewId/delete", ReviewController.destroy);
router.post("/:reviewId/reply", ReviewController.reply);

export default router;
