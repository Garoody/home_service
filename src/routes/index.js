// "use strict";

// import { Router } from "express";

// import homeRoutes from "./homeRoutes.js";
// import authRoutes from "./authRoutes.js";
// import userRoutes from "./userRoutes.js";
// import categoryRoutes from "./categoryRoutes.js";
// import serviceRoutes from "./serviceRoutes.js";
// import bookingRoutes from "./bookingRoutes.js";
// import paymentRoutes from "./paymentRoutes.js";
// import reviewRoutes from "./reviewRoutes.js";

// const router = Router();

// // Home
// router.use("/", homeRoutes);

// // Auth
// router.use("/auth", authRoutes);

// // Ressources
// router.use("/", userRoutes);
// router.use("/categories", categoryRoutes);
// router.use("/services", serviceRoutes);
// router.use("/bookings", bookingRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/reviews", reviewRoutes);

// export default router;




"use strict";

import { Router } from "express";

import homeRoutes from "./homeRoutes.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import reviewRoutes from "./reviewRoutes.js";

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

// Users  ✅ (corrigé ici)
router.use("/users", userRoutes);

// Ressources
router.use("/categories", categoryRoutes);
router.use("/services", serviceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);

export default router;
