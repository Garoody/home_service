"use strict";

import { Router } from "express";
import PaymentController from "../../controllers/PaymentController.js";
import { requireClient } from "../../middlewares/authMiddleware.js";

const router = Router();

router.use(requireClient);

router.get("/", PaymentController.index);
router.get("/cards", PaymentController.cards);
router.get("/:bookingId", PaymentController.pay);
router.post("/:bookingId", PaymentController.handlePay);

export default router;
