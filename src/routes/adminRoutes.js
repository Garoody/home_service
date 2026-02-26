"use strict";

import { Router } from "express";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import AdminController from "../controllers/AdminController.js";

const router = Router();

router.get("/", requireAdmin, AdminController.dashboard);

export default router;