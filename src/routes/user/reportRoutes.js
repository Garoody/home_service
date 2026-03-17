"use strict";

import { Router } from "express";
import ReportController from "../../controllers/ReportController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

/**
 * Routes de signalement ouvertes aux utilisateurs connectes.
 * L'admin intervient ensuite depuis son dashboard de moderation.
 */
const router = Router();

router.use(requireAuth);

router.get("/new", ReportController.new);
router.post("/", ReportController.store);

export default router;
