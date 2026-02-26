"use strict";

import { Router } from "express";
import ReviewController from "../controllers/ReviewController.js";

const router = Router();

// GET /reviews (liste)
// router.get("/", ReviewController.index);

// GET /reviews/new?booking_id=...
// router.get("/new", ReviewController.new);

// POST /reviews
// router.post("/", ReviewController.create);

// GET /reviews/:id
// router.get("/:id", ReviewController.show);

// POST /reviews/:id/delete
// router.post("/:id/delete", ReviewController.destroy);

export default router;