"use strict";

export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    req.flash("error", "Vous devez être connecté.");
    return res.redirect("/auth/login");
  }

  if (req.session.user.role !== "admin") {
    req.flash("error", "Accès refusé.");
    return res.redirect("/");
  }

  next();
}