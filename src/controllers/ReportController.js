"use strict";

import ReportService from "../services/ReportService.js";
import { validateReportPayload } from "../validators/reportValidator.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

/**
 * Controleur des signalements.
 * Il propose un formulaire unique pour signaler un service, un avis ou un utilisateur.
 */
class ReportController {
  async new(req, res) {
    try {
      const { target_type, target_id } = req.query;
      const target = await ReportService.getTargetPreview({
        targetType: target_type,
        targetId: target_id,
      });

      return res.render("pages/reports/new", {
        title: "Signaler un contenu - HomeService",
        target,
        formData: {
          target_type,
          target_id,
          return_to: req.query.return_to || "",
          reason: "",
          details: "",
        },
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/services");
    }
  }

  async store(req, res) {
    try {
      const validation = validateReportPayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect(
          `/reports/new?target_type=${encodeURIComponent(req.body?.target_type || "")}&target_id=${encodeURIComponent(req.body?.target_id || "")}`
        );
      }

      await ReportService.create({
        reporterId: getUserId(req),
        targetType: validation.data.target_type,
        targetId: validation.data.target_id,
        reason: validation.data.reason,
        details: validation.data.details,
      });

      req.flash("success", "Votre signalement a bien ete transmis a l'administration.");
      return res.redirect(req.body?.return_to || "/services");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(
        `/reports/new?target_type=${encodeURIComponent(req.body?.target_type || "")}&target_id=${encodeURIComponent(req.body?.target_id || "")}&return_to=${encodeURIComponent(req.body?.return_to || "")}`
      );
    }
  }
}

export default new ReportController();
