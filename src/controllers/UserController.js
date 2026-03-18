"use strict";

import UserService from "../services/UserService.js";
import DashboardService from "../services/DashboardService.js";
import BookingService from "../services/BookingService.js";
import PaymentService from "../services/PaymentService.js";
import ReviewService from "../services/ReviewService.js";
import {
  validateClientProfilePayload,
  validateProviderProfilePayload,
} from "../validators/userValidator.js";

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

      if (user.role === "provider") {
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
      }

      const validation = validateClientProfilePayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/users/profile");
      }

      const updatedUser = await UserService.updateClientProfile({
        userId,
        ...validation.data,
      });

      if (req.session?.user && updatedUser?.full_name) {
        req.session.user.name = updatedUser.full_name;
      }

      req.flash("success", "Profil client mis a jour.");
      return res.redirect("/users/profile");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async providerBookings(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user || user.role !== "provider") {
        req.flash("error", "Cette page est reservee au prestataire.");
        return res.redirect("/users/profile");
      }

      const { status } = req.query;
      const bookings = await BookingService.listForProvider(userId, { status });

      return res.render("pages/users/provider-bookings", {
        title: "Demandes recues - HomeService",
        user,
        bookings,
        currentStatus: status || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async clientReviews(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user || user.role !== "client") {
        req.flash("error", "Cette page est reservee au client.");
        return res.redirect("/users/profile");
      }

      const reviews = await ReviewService.listByClient(userId);

      return res.render("pages/users/reviews", {
        title: "Mes avis - HomeService",
        heading: "Mes avis",
        emptyMessage: "Vous n'avez laisse aucun avis pour le moment.",
        reviews,
        role: "client",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async providerReviews(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user || user.role !== "provider") {
        req.flash("error", "Cette page est reservee au prestataire.");
        return res.redirect("/users/profile");
      }

      const reviews = await ReviewService.listByProvider(userId);

      return res.render("pages/users/reviews", {
        title: "Avis recus - HomeService",
        heading: "Avis recus",
        emptyMessage: "Aucun avis recu pour le moment.",
        reviews,
        role: "provider",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async providerPayments(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user || user.role !== "provider") {
        req.flash("error", "Cette page est reservee au prestataire.");
        return res.redirect("/users/profile");
      }

      const payments = await PaymentService.listForProvider(userId);
      const totalRevenue = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

      return res.render("pages/users/provider-payments", {
        title: "Paiements recus - HomeService",
        payments,
        totalRevenue,
      });
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
