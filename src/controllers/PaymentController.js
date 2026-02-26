"use strict";

import PaymentService from "../services/PaymentService.js";

class PaymentController {
  async index(req, res) {
    try {
      const payments = await PaymentService.list();

      res.render("pages/payments/index", {
        title: "Paiements - HomeService",
        payments,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async pay(req, res) {
    // page paiement pour une réservation
    const { bookingId } = req.params;

    res.render("pages/payments/pay", {
      title: "Paiement - HomeService",
      bookingId,
      csrfToken: res.locals.csrfToken,
    });
  }

  async handlePay(req, res) {
    try {
      const { bookingId } = req.params;
      await PaymentService.payBooking({ bookingId });

      req.flash("success", "Paiement validé ✅");
      res.redirect("/payments");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(`/payments/${req.params.bookingId}`);
    }
  }
}

export default new PaymentController();