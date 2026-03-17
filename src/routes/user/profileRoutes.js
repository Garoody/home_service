

// import { Router } from "express";
// import UserController from "../controllers/UserController.js";

// const router = Router();

// // GET /users
// router.get("/", UserController.index);

// // GET /users/:id
// router.get("/:id", UserController.show);

// // POST /users/:id/delete
// router.post("/:id/delete", UserController.destroy);

// export default router;




"use strict";

import { Router } from "express";
import UserController from "../../controllers/UserController.js";
import { requireAuth } from "../../middlewares/authMiddleware.js";

const router = Router();

// Profil utilisateur (page)
router.get("/profile", requireAuth, UserController.profile);

// Update profil (form POST)
router.post("/profile", requireAuth, UserController.updateProfile);
// Droit a l'oubli: suppression du compte client connecte.
router.post("/profile/delete", requireAuth, UserController.deleteAccount);

export default router;
