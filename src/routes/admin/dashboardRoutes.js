"use strict";

import { Router } from "express";
import AdminController from "../../controllers/adminController.js";

// Routes du tableau de bord et des listes globales admin.
const router = Router();

router.get("/", AdminController.dashboard);
router.get("/warnings", AdminController.warnings);
router.get("/services", AdminController.services);
router.get("/reviews", AdminController.reviews);
router.get("/bookings", AdminController.bookings);

export default router;
