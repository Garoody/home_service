"use strict";

import { Router } from "express";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import dashboardRoutes from "./dashboardRoutes.js";
import adminUserRoutes from "./userRoutes.js";
import adminReportRoutes from "./reportRoutes.js";
import adminContentRoutes from "./contentRoutes.js";

// Point d'entree des routes back-office administrateur.
const router = Router();

router.use(requireAdmin);
router.use("/", dashboardRoutes);
router.use("/", adminUserRoutes);
router.use("/", adminReportRoutes);
router.use("/", adminContentRoutes);

export default router;
