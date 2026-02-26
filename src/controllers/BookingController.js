"use strict";

import BookingService from "../services/BookingService.js";

class BookingController {
  async index(req, res) {
    try {
      const userId = req.session.userId;
      const bookings = await BookingService.listForUser(userId);

      res.render("pages/bookings/index", {
        title: "Mes réservations - HomeService",
        bookings,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async create(req, res) {
    // Affiche le formulaire de réservation pour un service
    const { serviceId } = req.params;

    res.render("pages/bookings/new", {
      title: "Réserver - HomeService",
      serviceId,
      csrfToken: res.locals.csrfToken,
    });
  }

  async store(req, res) {
    try {
      const clientId = req.session.userId;

      await BookingService.create({
        client_id: clientId,
        ...req.body, // service_id, booking_date, booking_time
      });

      req.flash("success", "Réservation créée ✅");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const clientId = req.session.userId;

      await BookingService.cancel({ bookingId: id, clientId });

      req.flash("success", "Réservation annulée ✅");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }
}

export default new BookingController();