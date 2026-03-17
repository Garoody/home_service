"use strict";

import AdminService from "../services/adminService.js";
import {
  validateAdminReportReviewPayload,
  validateAdminUserStatusPayload,
  validateAdminWarningPayload,
} from "../validators/adminValidator.js";

function getAdminId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

/**
 * Controleur du dashboard administrateur.
 * L'admin n'approuve rien avant publication : il intervient ici
 * seulement apres coup pour moderer, avertir ou sanctionner.
 */
class AdminController {
  async users(req, res) {
    try {
      const page = await AdminService.getUsersPage({
        q: req.query.q,
        role: req.query.role,
        userStatus: req.query.user_status,
        warnedOnly: req.query.warned_only,
      });

      return res.render("pages/admin/users", {
        title: "Utilisateurs - Administration HomeService",
        page,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async userProfile(req, res) {
    try {
      const page = await AdminService.getUserProfilePage(req.params.userId);

      return res.render("pages/admin/user-profile", {
        title: "Profil utilisateur - Administration HomeService",
        page,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin/users");
    }
  }

  async reports(req, res) {
    try {
      const page = await AdminService.getReportsPage({
        reportStatus: req.query.report_status,
        targetType: req.query.target_type,
      });

      return res.render("pages/admin/reports", {
        title: "Signalements - Administration HomeService",
        page,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async warnings(req, res) {
    try {
      const page = await AdminService.getWarningsPage();

      return res.render("pages/admin/warnings", {
        title: "Avertissements - Administration HomeService",
        page,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async services(req, res) {
    try {
      const page = await AdminService.getServicesPage();

      return res.render("pages/admin/services", {
        title: "Services - Administration HomeService",
        page,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async reviews(req, res) {
    try {
      const page = await AdminService.getReviewsPage();

      return res.render("pages/admin/reviews", {
        title: "Commentaires - Administration HomeService",
        page,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async bookings(req, res) {
    try {
      const page = await AdminService.getBookingsPage();

      return res.render("pages/admin/bookings", {
        title: "Reservations - Administration HomeService",
        page,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async dashboard(req, res) {
    try {
      const dashboard = await AdminService.getDashboard({
        q: req.query.q,
        role: req.query.role,
        userStatus: req.query.user_status,
        warnedOnly: req.query.warned_only,
        reportStatus: req.query.report_status,
        targetType: req.query.target_type,
      });

      return res.render("pages/admin/dashboard", {
        title: "Dashboard administrateur - HomeService",
        dashboard,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/");
    }
  }

  async updateUserStatus(req, res) {
    try {
      const validation = validateAdminUserStatusPayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/admin");
      }

      await AdminService.updateUserStatus({
        adminId: getAdminId(req),
        userId: req.params.userId,
        status: validation.data.status,
        reason: validation.data.reason,
        reportId: validation.data.report_id || null,
      });

      req.flash("success", "Statut utilisateur mis a jour.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async sendWarning(req, res) {
    try {
      const validation = validateAdminWarningPayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/admin");
      }

      await AdminService.createWarning({
        adminId: getAdminId(req),
        userId: req.params.userId,
        message: validation.data.message,
        reportId: validation.data.report_id || null,
      });

      req.flash("success", "Avertissement envoye.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async reviewReport(req, res) {
    try {
      const validation = validateAdminReportReviewPayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/admin");
      }

      await AdminService.reviewReport({
        adminId: getAdminId(req),
        reportId: req.params.reportId,
        status: validation.data.status,
        resolutionNote: validation.data.resolution_note,
      });

      req.flash("success", "Signalement traite.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async deleteService(req, res) {
    try {
      await AdminService.deleteServiceByAdmin({
        adminId: getAdminId(req),
        serviceId: req.params.serviceId,
        reportId: req.body?.report_id || null,
      });

      req.flash("success", "Service supprime.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async deleteReview(req, res) {
    try {
      await AdminService.deleteReviewByAdmin({
        adminId: getAdminId(req),
        reviewId: req.params.reviewId,
        reportId: req.body?.report_id || null,
      });

      req.flash("success", "Avis supprime.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }

  async deleteUser(req, res) {
    try {
      await AdminService.deleteUserByAdmin({
        adminId: getAdminId(req),
        userId: req.params.userId,
        reportId: req.body?.report_id || null,
      });

      req.flash("success", "Compte utilisateur supprime.");
      return res.redirect("/admin");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/admin");
    }
  }
}

export default new AdminController();
