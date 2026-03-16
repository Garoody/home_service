"use strict";

import { Router } from "express";
import ReviewController from "../controllers/ReviewController.js";
import { requireClient } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireClient);

// Formulaire d'avis pour une reservation du client connecte.
router.get("/bookings/:bookingId/new", ReviewController.new);

// Enregistrement de l'avis.
router.post("/", ReviewController.store);

export default router;
