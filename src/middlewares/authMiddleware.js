"use strict";

import UserService from "../services/UserService.js";
import ConversationService from "../services/ConversationService.js";

function getUserIdFromSession(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

function getModerationMessage(user) {
  if (!user) {
    return "Votre session n'est plus valide.";
  }

  if (user.deletedByAdminAt) {
    return "Ce compte n'est plus disponible.";
  }

  if (user.bannedAt) {
    return "Ce compte a été banni par l'administration.";
  }

  if (user.suspendedAt) {
    return "Ce compte est temporairement suspendu par l'administration.";
  }

  return null;
}

async function loadSessionUser(req) {
  const userId = getUserIdFromSession(req);
  if (!userId) return null;

  return UserService.getById(userId);
}

function clearSessionUser(req, message) {
  if (req.session) {
    req.session.user = null;
    req.session.userId = null;
    req.session.flash = req.session.flash || {
      success: [],
      error: [],
      info: [],
    };
    req.session.flash.error.push(message);
  }
}

export const injectUserToLocals = async (req, res, next) => {
  let unreadConversationCount = 0;

  try {
    if (req.session?.user && req.session.userId) {
      const user = await loadSessionUser(req);
      const moderationMessage = getModerationMessage(user);

      if (moderationMessage) {
        clearSessionUser(req, moderationMessage);

        if (!String(req.originalUrl || "").startsWith("/auth")) {
          return res.redirect("/auth/login");
        }
      } else if (user) {
        req.session.user.name = user.fullName;
        req.session.user.profilePhotoPath = user.profilePhotoPath || null;
        req.session.user.canMessage = user.canMessage;
        req.session.user.canPublishServices = user.canPublishServices;
      }
    }

    const userId = getUserIdFromSession(req);
    const userRole = req.session?.user?.role;

    if (userId && userRole !== "admin") {
      unreadConversationCount = await ConversationService.getUnreadCountForUser(userId);
    }
  } catch {
    // En cas d'echec ponctuel, on conserve la session telle quelle.
  }

  res.locals.currentUser = req.session?.user || null;
  res.locals.currentPath = req.originalUrl?.split("?")[0] || req.path || "/";
  res.locals.unreadConversationCount = unreadConversationCount;
  next();
};

export const requireAuth = (req, res, next) => {
  const handleAuth = async () => {
    if (!req.session?.user) {
      req.session.returnTo = req.originalUrl;
      req.flash?.("error", "Veuillez vous connecter.");
      return res.redirect("/auth/login");
    }

    const user = await loadSessionUser(req);
    const moderationMessage = getModerationMessage(user);

    if (moderationMessage) {
      clearSessionUser(req, moderationMessage);
      return res.redirect("/auth/login");
    }

    next();
  };

  return Promise.resolve(handleAuth()).catch(() => {
    req.flash?.("error", "Veuillez vous reconnecter.");
    return res.redirect("/auth/login");
  });
};

export const requireGuest = (req, res, next) => {
  if (req.session?.user) {
    return res.redirect(req.session.user.role === "admin" ? "/admin" : "/users/profile");
  }
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    const handleRole = async () => {
      const user = req.session?.user;

      if (!user) {
        req.session.returnTo = req.originalUrl;
        req.flash?.("error", "Veuillez vous connecter.");
        return res.redirect("/auth/login");
      }

      const dbUser = await loadSessionUser(req);
      const moderationMessage = getModerationMessage(dbUser);

      if (moderationMessage) {
        clearSessionUser(req, moderationMessage);
        return res.redirect("/auth/login");
      }

      if (!roles.includes(user.role)) {
        req.flash?.("error", "Acces interdit.");
        return res.redirect("/");
      }

      next();
    };

    return Promise.resolve(handleRole()).catch(() => {
      req.flash?.("error", "Acces interdit.");
      return res.redirect("/");
    });
  };
};

// Compte utilisateur normal: il peut réserver et publier.
// Le role "provider" reste accepte comme role legacy déjà present en base.
export const requireMember = requireRole("client", "provider");
export const requireAdmin = requireRole("admin");
