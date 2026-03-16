"use strict";

import ReviewService from "../services/ReviewService.js";
import { validateReviewPayload } from "../validators/reviewValidator.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

class ReviewController {
  async new(req, res) {
    try {
      const { bookingId } = req.params;
      const clientId = getUserId(req);
      const booking = await ReviewService.getBookingReviewContext({ bookingId, clientId });

      if (booking.status !== "completed") {
        req.flash("error", "Vous pourrez laisser un avis quand la reservation sera terminee.");
        return res.redirect("/bookings");
      }

      if (booking.review_id) {
        req.flash("error", "Un avis existe deja pour cette reservation.");
        return res.redirect("/bookings");
      }

      return res.render("pages/reviews/new", {
        title: "Laisser un avis - HomeService",
        booking,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/bookings");
    }
  }

  async store(req, res) {
    try {
      const clientId = getUserId(req);
      const validation = validateReviewPayload(req.body);

      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect(`/reviews/bookings/${req.body?.booking_id}/new`);
      }

      await ReviewService.create({
        booking_id: validation.data.booking_id,
        client_id: clientId,
        provider_id: validation.data.provider_id,
        rating: validation.data.rating,
        comment: validation.data.comment,
      });

      req.flash("success", "Avis publie avec succes.");
      return res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/bookings");
    }
  }
}

export default new ReviewController();
