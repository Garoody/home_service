"use strict";

import PaymentService from "../services/PaymentService.js";
import { validatePaymentPayload } from "../validators/paymentValidator.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

class PaymentController {
  async index(req, res) {
    try {
      const clientId = getUserId(req);
      const payments = await PaymentService.listForUser(clientId);

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
    try {
      const clientId = getUserId(req);
      const { bookingId } = req.params;
      const booking = await PaymentService.getPayContext(bookingId, clientId);

      res.render("pages/payments/pay", {
        title: "Paiement - HomeService",
        booking,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }

  async handlePay(req, res) {
    try {
      const clientId = getUserId(req);
      const { bookingId } = req.params;

      const validation = validatePaymentPayload({
        booking_id: bookingId,
        amount: req.body.amount,
        payment_method: req.body.payment_method,
      });

      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect(`/payments/${bookingId}`);
      }

      await PaymentService.payBooking({
        bookingId,
        clientId,
        payment_method: validation.data.payment_method,
      });

      req.flash("success", "Paiement valide.");
      res.redirect("/payments");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(`/payments/${req.params.bookingId}`);
    }
  }
}

export default new PaymentController();
