"use strict";

import { Router } from "express";
import HomeController from "../../controllers/HomeController.js";

const router = Router();

// GET /
router.get("/", HomeController.home);

export default router;
