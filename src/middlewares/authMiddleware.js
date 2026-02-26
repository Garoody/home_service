"use strict";

/**
 * HomeServices (EJS) — Auth via express-session
 * req.session.user = { id, email, pseudo?, role }
 */

export const injectUserToLocals = (req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.session?.user) {
    req.session.returnTo = req.originalUrl;
    req.flash?.("error", "Veuillez vous connecter.");
    return res.redirect("/auth/login");
  }
  next();
};

export const requireGuest = (req, res, next) => {
  if (req.session?.user) {
    return res.redirect("/account");
  }
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    const user = req.session?.user;

    if (!user) {
      req.session.returnTo = req.originalUrl;
      req.flash?.("error", "Veuillez vous connecter.");
      return res.redirect("/auth/login");
    }

    if (!roles.includes(user.role)) {
      req.flash?.("error", "Accès interdit.");
      return res.redirect("/"); // ou /account
    }

    next();
  };
};

export const requireClient = requireRole("client", "admin");
export const requireProvider = requireRole("provider", "admin");
export const requireAdmin = requireRole("admin");
