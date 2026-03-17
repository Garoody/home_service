"use strict";

import { Router } from "express";
import AdminController from "../../controllers/adminController.js";

// Routes d'administration des comptes client et prestataire.
const router = Router();

router.get("/users", AdminController.users);
router.get("/users/:userId", AdminController.userProfile);
router.post("/users/:userId/status", AdminController.updateUserStatus);
router.post("/users/:userId/warnings", AdminController.sendWarning);
router.post("/users/:userId/delete", AdminController.deleteUser);

export default router;
