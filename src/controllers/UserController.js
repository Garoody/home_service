"use strict";

import UserService from "../services/UserService.js";
import DashboardService from "../services/DashboardService.js";
import BookingService from "../services/BookingService.js";
import PaymentService from "../services/PaymentService.js";
import ReviewService from "../services/ReviewService.js";
import {
  validateUserProfilePayload,
  validateServiceProfilePayload,
} from "../validators/userValidator.js";
import { PROVIDER_STATUS_OPTIONS } from "../constants/providerStatuses.js";
import { getFirstValidationMessage } from "../utils/formState.js";

class UserController {
  async publicProfile(req, res) {
    try {
      const userId = req.params.id;
      const [user, dashboard, reviews] = await Promise.all([
        UserService.getById(userId),
        DashboardService.getProviderDashboard(userId, { publicOnly: true }),
        ReviewService.listByProvider(userId),
      ]);

      // Le profil public existe des qu'un utilisateur a publie au moins un service.
      if (!user || dashboard.stats.services === 0) {
        return res.status(404).render("pages/errors/404", {
          title: "Profil public introuvable",
          path: req.originalUrl,
        });
      }

      return res.render("pages/users/public-profile", {
        title: `${user.fullName} - Profil public HomeService`,
        publicUser: user,
        dashboard,
        reviews: reviews.slice(0, 6),
      });
    } catch (error) {
      return res.status(500).render("pages/errors/500", {
        title: "Erreur",
        message: error.message || "Impossible d'afficher le profil public.",
      });
    }
  }

  async profile(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      if (req.session?.user) {
        req.session.user.name = user.fullName;
        req.session.user.profilePhotoPath = user.profilePhotoPath || null;
      }

      const dashboard = await DashboardService.getUserDashboard(userId);

      return res.render("pages/users/profile", {
        title: "Mon espace - HomeService",
        user,
        dashboard,
        providerStatusOptions: PROVIDER_STATUS_OPTIONS,
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

      if (user.role === "admin") {
        req.flash("error", "Le compte administrateur se gere depuis l'espace admin.");
        return res.redirect("/admin");
      }

      const personalValidation = validateUserProfilePayload(req.body);
      if (!personalValidation.success) {
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(personalValidation));
        return res.redirect("/users/profile");
      }

      const professionalValidation = validateServiceProfilePayload(req.body);
      if (!professionalValidation.success) {
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(professionalValidation));
        return res.redirect("/users/profile");
      }

      const profilePhotoPath = req.file ? `/uploads/${req.file.filename}` : null;

      const updatedUser = await UserService.updateUserProfile({
        userId,
        ...personalValidation.data,
      });

      await UserService.updateServiceProfile({
        userId,
        ...professionalValidation.data,
        profile_photo_path: profilePhotoPath,
      });

      if (req.session?.user) {
        req.session.user.name = updatedUser?.full_name || user.fullName;
        req.session.user.profilePhotoPath =
          profilePhotoPath || user.profilePhotoPath || null;
      }

      req.flash("success", "Profil mis a jour.");
      return res.redirect("/users/profile");
    } catch (error) {
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async serviceBookings(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const requestedStatus = req.params.status || req.query.status || "";
      const allowedStatuses = new Set(["pending", "confirmed", "completed"]);
      const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "";
      const bookings = await BookingService.listForProvider(userId, { status });

      const pageMeta = {
        all: {
          title: "Reservations recues - HomeService",
          heading: "Reservations recues",
          description: "Suivez les reservations recues sur vos services et leur statut.",
        },
        pending: {
          title: "Reservations en attente - HomeService",
          heading: "Reservations en attente",
          description: "Consultez les demandes a confirmer ou a refuser sur vos services.",
        },
        confirmed: {
          title: "Reservations confirmees - HomeService",
          heading: "Reservations confirmees",
          description: "Retrouvez les reservations confirmees en attente de paiement ou deja reglees.",
        },
        completed: {
          title: "Reservations terminees - HomeService",
          heading: "Reservations terminees",
          description: "Retrouvez les prestations terminees sur vos services.",
        },
      };

      const meta = pageMeta[status || "all"];

      return res.render("pages/users/service-bookings", {
        title: meta.title,
        user,
        bookings,
        currentStatus: status,
        heading: meta.heading,
        description: meta.description,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async serviceBookingDetail(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const booking = await BookingService.getDetailForProvider({
        bookingId: req.params.id,
        providerId: userId,
      });

      return res.render("pages/bookings/show", {
        title: "Detail de la reservation recue - HomeService",
        booking,
        viewerMode: "provider",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile/service-bookings");
    }
  }

  async reviewsGiven(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const reviews = await ReviewService.listByClient(userId);

      return res.render("pages/users/reviews", {
        title: "Mes avis - HomeService",
        sectionLabel: "Activite utilisateur",
        heading: "Avis laisses",
        emptyMessage: "Vous n'avez laisse aucun avis pour le moment.",
        reviews,
        counterpartLabel: "Service propose par",
        counterpartField: "provider_name",
        pageMode: "client",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async reviewsReceived(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const reviews = await ReviewService.listByProvider(userId);

      return res.render("pages/users/reviews", {
        title: "Avis recus - HomeService",
        sectionLabel: "Activite de mes services",
        heading: "Avis recus sur mes services",
        emptyMessage: "Aucun avis recu pour le moment.",
        reviews,
        counterpartLabel: "Laisse par",
        counterpartField: "client_name",
        pageMode: "provider",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async servicePayments(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const payments = await PaymentService.listForProvider(userId);
      const totalRevenue = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

      return res.render("pages/users/service-payments", {
        title: "Paiements recus - HomeService",
        payments,
        totalRevenue,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile");
    }
  }

  async servicePaymentDetail(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      if (!user) {
        req.flash("error", "Utilisateur introuvable.");
        return res.redirect("/users/profile");
      }

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      const payment = await PaymentService.getByIdForProvider({
        paymentId: req.params.id,
        providerId: userId,
      });

      return res.render("pages/payments/show", {
        title: "Detail du paiement recu - HomeService",
        payment,
        viewerMode: "provider",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/users/profile/service-payments");
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

      if (user.role === "admin") {
        req.flash("error", "La suppression libre du compte n'est pas autorisee pour l'administrateur.");
        return res.redirect("/admin");
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
