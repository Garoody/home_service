"use strict";

import { Router } from "express";
import PaymentController from "../controllers/PaymentController.js";

const router = Router();

// GET /payments (liste)
// router.get("/", PaymentController.index);

// GET /payments/new?booking_id=...
// router.get("/new", PaymentController.new);

// POST /payments (créer un paiement)
// router.post("/", PaymentController.create);

// GET /payments/:id
// router.get("/:id", PaymentController.show);

export default router;