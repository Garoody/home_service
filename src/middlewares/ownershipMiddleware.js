"use strict";

/**
 * Empêche un user de modifier une ressource qui ne lui appartient pas.
 * admin = bypass
 */
export const requireOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const user = req.session?.user;

      if (!user) {
        req.flash?.("error", "Veuillez vous connecter.");
        return res.redirect("/login");
      }

      if (user.role === "admin") return next();

      const ownerId = await getOwnerId(req);

      if (ownerId === null || ownerId === undefined) {
        req.flash?.("error", "Ressource introuvable.");
        return res.redirect("back");
      }

      if (String(ownerId) !== String(user.id)) {
        req.flash?.("error", "Action non autorisée.");
        return res.redirect("back");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};