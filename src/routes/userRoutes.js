"use strict";

import { Router } from "express";
import UserController from "../controllers/UserController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import uploadConfig from "../config/upload.js";
import { validateCsrfRequest } from "../config/security.js";

const router = Router();

const handleProfilePhotoUpload = (req, res, next) => {
  uploadConfig.single("profile_photo")(req, res, (error) => {
    if (!error) return next();

    req.flash("error", error.message || "Impossible d'envoyer la photo de profil.");
    return res.redirect("/users/profile");
  });
};

const verifyMultipartProfileCsrf = (req, res, next) => {
  if (validateCsrfRequest(req)) return next();

  req.flash("error", "Votre session a expire ou le formulaire est invalide.");
  return res.redirect("/users/profile");
};

const redirectWithQuery = (basePath) => (req, res) => {
  const query = req.originalUrl.includes("?")
    ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
    : "";

  return res.redirect(`${basePath}${query}`);
};

// Nouveau chemin propre pour le profil public d'un utilisateur qui publie des services.
router.get("/public/:id", UserController.publicProfile);
// Alias legacy.
router.get("/providers/:id", (req, res) => res.redirect(`/users/public/${req.params.id}`));

// Profil utilisateur (page)
router.get("/profile", requireAuth, UserController.profile);
router.get("/profile/service-bookings", requireAuth, UserController.serviceBookings);
router.get("/profile/service-bookings/detail/:id", requireAuth, UserController.serviceBookingDetail);
router.get("/profile/service-bookings/:status", requireAuth, UserController.serviceBookings);
router.get("/profile/reviews-given", requireAuth, UserController.reviewsGiven);
router.get("/profile/reviews-received", requireAuth, UserController.reviewsReceived);
router.get("/profile/service-payments", requireAuth, UserController.servicePayments);
router.get("/profile/service-payments/:id", requireAuth, UserController.servicePaymentDetail);

// Alias legacy.
router.get("/profile/provider-bookings", redirectWithQuery("/users/profile/service-bookings"));
router.get("/profile/client-reviews", redirectWithQuery("/users/profile/reviews-given"));
router.get("/profile/provider-reviews", redirectWithQuery("/users/profile/reviews-received"));
router.get("/profile/provider-payments", redirectWithQuery("/users/profile/service-payments"));
router.get("/profile/conversations", redirectWithQuery("/conversations"));

// Update profil (form POST)
router.post(
  "/profile",
  requireAuth,
  handleProfilePhotoUpload,
  verifyMultipartProfileCsrf,
  UserController.updateProfile
);
// Droit a l'oubli: suppression du compte utilisateur connecté.
router.post("/profile/delete", requireAuth, UserController.deleteAccount);

export default router;
