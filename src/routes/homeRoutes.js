"use strict";

import { Router } from "express";

const router = Router();

// GET /
router.get("/", (_req, res) => res.redirect("/services"));

export default router;
