"use strict";

import { Router } from "express";
import PaymentController from "../controllers/PaymentController.js";
import { requireMember } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireMember);

router.get("/", PaymentController.index);
router.get("/cards", PaymentController.cards);
router.get("/history/:paymentId", PaymentController.show);
router.get("/:bookingId", PaymentController.pay);
router.post("/:bookingId", PaymentController.handlePay);

export default router;
