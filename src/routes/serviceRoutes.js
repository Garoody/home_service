"use strict";

import { Router } from "express";
import ServiceController from "../controllers/ServiceController.js";

const router = Router();

router.get("/", ServiceController.index);
router.get("/new", ServiceController.create);
router.post("/", ServiceController.store);

router.get("/:slug/edit", ServiceController.edit);
router.post("/:slug/update", ServiceController.update);

router.get("/:slug", ServiceController.show);

export default router;
