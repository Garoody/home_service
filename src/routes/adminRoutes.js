"use strict";

import { Router } from "express";
import { requireAdmin } from "../middlewares/authMiddleware.js";
import AdminController from "../controllers/adminController.js";

const router = Router();

router.get("/", requireAdmin, AdminController.dashboard);
router.get("/search", requireAdmin, AdminController.search);
router.get("/logs", requireAdmin, AdminController.logs);
router.get("/reports", requireAdmin, AdminController.reports);
router.post("/reports", requireAdmin, AdminController.createReport);
router.post("/reports/:id/status", requireAdmin, AdminController.updateReportStatus);
router.get("/bookings", requireAdmin, AdminController.bookings);
router.get("/bookings/:id", requireAdmin, AdminController.showBooking);
router.get("/payments", requireAdmin, AdminController.payments);
router.get("/payments/:id", requireAdmin, AdminController.showPayment);
router.get("/users", requireAdmin, AdminController.users);
router.get("/users/:id", requireAdmin, AdminController.showUser);
router.post("/users/:id/moderation", requireAdmin, AdminController.moderateUser);
router.get("/services", requireAdmin, AdminController.services);
router.get("/services/:id", requireAdmin, AdminController.showService);
router.post("/services/:id/moderation", requireAdmin, AdminController.moderateService);
router.get("/reviews", requireAdmin, AdminController.reviews);
router.get("/reviews/:id", requireAdmin, AdminController.showReview);
router.post("/reviews/:id/moderation", requireAdmin, AdminController.moderateReview);
router.get("/conversations", requireAdmin, AdminController.conversations);
router.get("/conversations/:id", requireAdmin, AdminController.showConversation);

export default router;
