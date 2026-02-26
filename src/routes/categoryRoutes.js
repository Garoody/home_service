"use strict";

import { Router } from "express";
import CategoryController from "../controllers/CategoryController.js";

const router = Router();

router.get("/", CategoryController.index);
router.get("/new", CategoryController.create);
router.post("/", CategoryController.store);

export default router;
