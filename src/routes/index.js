"use strict";

import { Router } from "express";

// Les routes sont regroupees par contexte pour garder un dossier plus lisible.
import homeRoutes from "./public/homeRoutes.js";
import authRoutes from "./public/authRoutes.js";
import categoryRoutes from "./public/categoryRoutes.js";
import serviceRoutes from "./public/serviceRoutes.js";
import profileRoutes from "./user/profileRoutes.js";
import bookingRoutes from "./user/bookingRoutes.js";
import paymentRoutes from "./user/paymentRoutes.js";
import reviewRoutes from "./user/reviewRoutes.js";
import reportRoutes from "./user/reportRoutes.js";
import adminRoutes from "./admin/index.js";

const router = Router();

// Home
router.use("/", homeRoutes);

// Aliases legacy vers les pages d'authentification.
router.get("/login", (req, res) => res.redirect("/auth/login"));
router.get("/register", (req, res) => res.redirect("/auth/register"));
router.get("/connexion", (req, res) => res.redirect("/auth/login"));
router.get("/inscription", (req, res) => res.redirect("/auth/register"));

// Auth
router.use("/auth", authRoutes);

// Users
router.use("/users", profileRoutes);

// Ressources
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/reports", reportRoutes);
router.use("/admin", adminRoutes);

export default router;
