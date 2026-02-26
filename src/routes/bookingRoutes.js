"use strict";

import { Router } from "express";
import BookingController from "../controllers/BookingController.js";

const router = Router();

// GET /bookings (liste)
router.get("/", BookingController.index);

// GET /bookings/new?service_id=...
// router.get("/new", BookingController.new);

// POST /bookings (création)
router.post("/", BookingController.create);

// GET /bookings/:id (détails)
// router.get("/:id", BookingController.show);

// POST /bookings/:id/update-status (status = pending/confirmed/completed/cancelled)
// router.post("/:id/update-status", BookingController.updateStatus);

// POST /bookings/:id/delete
// router.post("/:id/delete", BookingController.destroy);

export default router;