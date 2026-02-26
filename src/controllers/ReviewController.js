"use strict";

import ReviewService from "../services/ReviewService.js";

class ReviewController {
  async create(req, res) {
    const { bookingId } = req.params;

    res.render("pages/reviews/new", {
      title: "Laisser un avis - HomeService",
      bookingId,
      csrfToken: res.locals.csrfToken,
    });
  }

  async store(req, res) {
    try {
      const clientId = req.session.userId;

      await ReviewService.create({
        client_id: clientId,
        ...req.body, // booking_id, provider_id, rating, comment
      });

      req.flash("success", "Avis publié ✅");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }
}

export default new ReviewController();