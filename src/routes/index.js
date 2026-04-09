"use strict";

import { Router } from "express";

import homeRoutes from "./homeRoutes.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import adminRoutes from "./adminRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import conversationRoutes from "./conversationRoutes.js";

const router = Router();

// Home
router.use("/", homeRoutes);

// Aliases (legacy links) -> auth routes
router.get("/login", (req, res) => res.redirect("/auth/login"));
router.get("/register", (req, res) => res.redirect("/auth/register"));
router.get("/connexion", (req, res) => res.redirect("/auth/login"));
router.get("/inscription", (req, res) => res.redirect("/auth/register"));

// Auth
router.use("/auth", authRoutes);

// Admin
router.use("/admin", adminRoutes);

// Users
router.use("/users", userRoutes);

// Ressources
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/conversations", conversationRoutes);

export default router;
