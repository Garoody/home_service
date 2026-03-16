"use strict";

import UserService from "../services/UserService.js";
import DashboardService from "../services/DashboardService.js";
import { validateProviderProfilePayload } from "../validators/userValidator.js";

class UserController {
  async profile(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/");
      }

      const dashboard =
        user.role === "provider"
          ? await DashboardService.getProviderDashboard(userId)
          : await DashboardService.getClientDashboard(userId);

      return res.render("pages/users/profile", {
        title: "Mon espace - HomeService",
        user,
        dashboard,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/");
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role !== "provider") {
        req.flash("info", "La modification de profil detaille est reservee au prestataire.");
        return res.redirect("/users/profile");
      }

      const validation = validateProviderProfilePayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/users/profile");
      }

      await UserService.updateProviderProfile({
        userId,
        ...validation.data,
      });

      req.flash("success", "Profil prestataire mis a jour.");
      return res.redirect("/users/profile");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role !== "client") {
        req.flash("error", "La suppression libre du compte est reservee au client.");
        return res.redirect("/users/profile");
      }

      const deleted = await UserService.deleteById(userId);
      if (!deleted) {
        req.flash("error", "Impossible de supprimer le compte.");
        return res.redirect("/users/profile");
      }

      req.session.destroy(() => {
        res.redirect("/auth/login");
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }
}

export default new UserController();
