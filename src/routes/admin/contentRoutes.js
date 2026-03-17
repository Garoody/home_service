"use strict";

import { Router } from "express";
import AdminController from "../../controllers/adminController.js";

// Routes de moderation des contenus publies sur la plateforme.
const router = Router();

router.post("/services/:serviceId/delete", AdminController.deleteService);
router.post("/reviews/:reviewId/delete", AdminController.deleteReview);

export default router;
