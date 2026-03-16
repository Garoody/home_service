"use strict";

import { Router } from "express";
import CategoryController from "../controllers/CategoryController.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", CategoryController.index);

// La creation de categories est reservee a l'administration.
router.get("/new", requireAdmin, CategoryController.create);
router.post("/", requireAdmin, CategoryController.store);

export default router;
