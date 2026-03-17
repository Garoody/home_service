"use strict";

import { Router } from "express";
import AdminController from "../../controllers/adminController.js";

// Routes de gestion des signalements et de leur traitement.
const router = Router();

router.get("/reports", AdminController.reports);
router.post("/reports/:reportId/review", AdminController.reviewReport);

export default router;
