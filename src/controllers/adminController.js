"use strict";

import AdminService from "../services/adminService.js";
import { getFirstValidationMessage } from "../utils/formState.js";

function getAdminId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

function getRequiredText(value, fallbackMessage) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(fallbackMessage);
  }

  return normalized;
}

class AdminController {
  async dashboard(req, res) {
    const dashboard = await AdminService.getDashboardData();

    res.render("pages/admin/dashboard", {
      title: "Administration - HomeService",
      dashboard,
    });
  }

  async users(req, res) {
    try {
      const users = await AdminService.listUsers({
        q: req.query.q || "",
        status: req.query.status || "",
      });

      return res.render("pages/admin/users", {
        title: "Moderation des comptes - HomeService",
        users,
        q: req.query.q || "",
        status: req.query.status || "",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message || getFirstValidationMessage(error));
      return res.redirect("/admin");
    }
  }

  async moderateUser(req, res) {
    try {
      await AdminService.moderateUser({
        adminId: getAdminId(req),
        userId: req.params.id,
        action: getRequiredText(req.body.action, "Action admin invalide."),
        reason: req.body.reason,
        warningLevel: req.body.warning_level,
      });

      req.flash("success", "Action admin appliquee sur le compte.");
      return res.redirect("/admin/users");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/users");
    }
  }

  async services(req, res) {
    try {
      const services = await AdminService.listServices({
        q: req.query.q || "",
        status: req.query.status || "",
      });

      return res.render("pages/admin/services", {
        title: "Moderation des services - HomeService",
        services,
        q: req.query.q || "",
        status: req.query.status || "",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async moderateService(req, res) {
    try {
      await AdminService.moderateService({
        adminId: getAdminId(req),
        serviceId: req.params.id,
        action: getRequiredText(req.body.action, "Action service invalide."),
        reason: req.body.reason,
      });

      req.flash("success", "Moderation du service mise a jour.");
      return res.redirect("/admin/services");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/services");
    }
  }

  async reviews(req, res) {
    try {
      const reviews = await AdminService.listReviews({
        q: req.query.q || "",
        visibility: req.query.visibility || "",
      });

      return res.render("pages/admin/reviews", {
        title: "Moderation des avis - HomeService",
        reviews,
        q: req.query.q || "",
        visibility: req.query.visibility || "",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async moderateReview(req, res) {
    try {
      await AdminService.moderateReview({
        adminId: getAdminId(req),
        reviewId: req.params.id,
        action: getRequiredText(req.body.action, "Action avis invalide."),
        reason: req.body.reason,
      });

      req.flash("success", "Moderation de l'avis mise a jour.");
      return res.redirect("/admin/reviews");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/reviews");
    }
  }

  async conversations(req, res) {
    try {
      const conversations = await AdminService.listConversations({
        q: req.query.q || "",
      });

      return res.render("pages/admin/conversations", {
        title: "Conversations admin - HomeService",
        conversations,
        q: req.query.q || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async showConversation(req, res) {
    try {
      const conversation = await AdminService.getConversationByIdForAdmin({
        conversationId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/conversation-show", {
        title: "Lecture admin de la conversation - HomeService",
        conversation,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/conversations");
    }
  }

  async bookings(req, res) {
    try {
      const bookings = await AdminService.listBookings({
        q: req.query.q || "",
        status: req.query.status || "",
      });

      return res.render("pages/admin/bookings", {
        title: "Reservations admin - HomeService",
        bookings,
        q: req.query.q || "",
        status: req.query.status || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async showBooking(req, res) {
    try {
      const booking = await AdminService.getBookingById({
        bookingId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/booking-show", {
        title: "Detail de reservation - HomeService",
        booking,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/bookings");
    }
  }

  async payments(req, res) {
    try {
      const payments = await AdminService.listPayments({
        q: req.query.q || "",
        status: req.query.status || "",
        method: req.query.method || "",
      });

      return res.render("pages/admin/payments", {
        title: "Paiements admin - HomeService",
        payments,
        q: req.query.q || "",
        status: req.query.status || "",
        method: req.query.method || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async showPayment(req, res) {
    try {
      const payment = await AdminService.getPaymentById({
        paymentId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/payment-show", {
        title: "Detail du paiement - HomeService",
        payment,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/payments");
    }
  }

  async showUser(req, res) {
    try {
      const user = await AdminService.getUserById({
        userId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/user-show", {
        title: "Detail du compte - HomeService",
        user,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/users");
    }
  }

  async showService(req, res) {
    try {
      const service = await AdminService.getServiceById({
        serviceId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/service-show", {
        title: "Detail du service - HomeService",
        service,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/services");
    }
  }

  async showReview(req, res) {
    try {
      const review = await AdminService.getReviewById({
        reviewId: req.params.id,
        adminId: getAdminId(req),
      });

      return res.render("pages/admin/review-show", {
        title: "Detail de l'avis - HomeService",
        review,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/reviews");
    }
  }

  async logs(req, res) {
    try {
      const logs = await AdminService.listActionLogs({
        q: req.query.q || "",
        actionType: req.query.actionType || "",
      });

      return res.render("pages/admin/logs", {
        title: "Historique admin - HomeService",
        logs,
        q: req.query.q || "",
        actionType: req.query.actionType || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async search(req, res) {
    try {
      const results = await AdminService.searchAll({
        q: req.query.q || "",
      });

      return res.render("pages/admin/search", {
        title: "Recherche admin - HomeService",
        results,
        q: req.query.q || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async reports(req, res) {
    try {
      const reports = await AdminService.listReports({
        q: req.query.q || "",
        status: req.query.status || "",
        priority: req.query.priority || "",
      });

      return res.render("pages/admin/reports", {
        title: "Signalements admin - HomeService",
        reports,
        q: req.query.q || "",
        status: req.query.status || "",
        priority: req.query.priority || "",
        prefill: {
          targetType: req.query.target_type || "",
          targetId: req.query.target_id || "",
          title: req.query.title || "",
        },
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async createReport(req, res) {
    try {
      await AdminService.createReport({
        adminId: getAdminId(req),
        targetType: getRequiredText(req.body.target_type, "Le type cible est obligatoire."),
        targetId: getRequiredText(req.body.target_id, "La cible du signalement est obligatoire."),
        title: getRequiredText(req.body.title, "Le titre du signalement est obligatoire."),
        description: getRequiredText(req.body.description, "La description du signalement est obligatoire."),
        priority: req.body.priority || "moyenne",
      });

      req.flash("success", "Signalement admin cree.");
      return res.redirect("/admin/reports");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/reports");
    }
  }

  async updateReportStatus(req, res) {
    try {
      await AdminService.updateReportStatus({
        adminId: getAdminId(req),
        reportId: req.params.id,
        status: getRequiredText(req.body.status, "Le nouveau statut est obligatoire."),
        resolutionNote: req.body.resolution_note,
      });

      req.flash("success", "Statut du signalement mis a jour.");
      return res.redirect("/admin/reports");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/reports");
    }
  }
}

export default new AdminController();
