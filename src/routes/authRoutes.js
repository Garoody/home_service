"use strict";

import { Router } from "express";
import AuthController from "../controllers/auth/AuthController.js";

const router = Router();

router.get("/register", AuthController.showRegister);
router.post("/register", AuthController.register);

router.get("/login", AuthController.showLogin);
router.post("/login", AuthController.login);

router.get("/logout", AuthController.logout);
router.post("/logout", AuthController.logout);

export default router;
