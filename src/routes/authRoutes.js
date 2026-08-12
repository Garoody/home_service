"use strict";

import { Router } from "express";
import AuthController from "../controllers/auth/AuthController.js";
import { isGoogleOAuthEnabled, passport } from "../config/passport.js";
import { authLimiter } from "../config/security.js";
import { requireGuest } from "../middlewares/authMiddleware.js";

const router = Router();

// Bloque les routes Google si les credentials ne sont pas definis.
const requireGoogleOAuthConfig = (req, res, next) => {
  if (!isGoogleOAuthEnabled()) {
    req.flash?.("error", "Connexion Google indisponible : configuration manquante.");
    return res.redirect("/auth/login");
  }
  next();
};

router.get("/register", requireGuest, AuthController.showRegister);
router.post("/register", authLimiter, requireGuest, AuthController.register);
router.get("/login", requireGuest, AuthController.showLogin);

router.post("/login", authLimiter, requireGuest, AuthController.login);

// Redirection vers Google (demande d'acces au profil + email).
router.get(
  "/google",
  requireGoogleOAuthConfig,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Callback Google: Passport valide puis on termine la session dans le controller.
router.get(
  "/google/callback",
  requireGoogleOAuthConfig,
  passport.authenticate("google", {
    failureRedirect: "/auth/login",
    session: false,
  }),
  AuthController.googleCallback
);

router.get("/logout", AuthController.logout);
router.post("/logout", AuthController.logout);

export default router;
