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
  // Affiche l'historique des paiements du client connecte.
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

  // Affiche les cartes deja memorisees pour les paiements futurs.
  async cards(req, res) {
    try {
      const clientId = getUserId(req);
      const savedMethods = await PaymentService.listSavedMethodsForUser(clientId);

      res.render("pages/payments/cards", {
        title: "Mes cartes enregistrees - HomeService",
        savedMethods,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/payments");
    }
  }

  // Affiche l'ecran de paiement d'une reservation.
  async pay(req, res) {
    try {
      const clientId = getUserId(req);
      const { bookingId } = req.params;
      const [booking, savedMethods] = await Promise.all([
        PaymentService.getPayContext(bookingId, clientId),
        PaymentService.listSavedMethodsForUser(clientId),
      ]);

      res.render("pages/payments/pay", {
        title: "Paiement - HomeService",
        booking,
        savedMethods,
        preferredMethod: req.query.method || "cb",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }

  // Enregistre le paiement choisi par le client.
  async handlePay(req, res) {
    try {
      const clientId = getUserId(req);
      const { bookingId } = req.params;

      const validation = validatePaymentPayload({
        booking_id: bookingId,
        amount: req.body.amount,
        payment_source: req.body.payment_source,
        saved_method_id: req.body.saved_method_id,
        payment_method: req.body.payment_method,
        cardholder_name: req.body.cardholder_name,
        card_number: req.body.card_number,
        exp_month: req.body.exp_month,
        exp_year: req.body.exp_year,
        cvc: req.body.cvc,
        save_card: req.body.save_card,
      });

      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect(`/payments/${bookingId}`);
      }

      await PaymentService.payBooking({
        bookingId,
        clientId,
        payment_source: validation.data.payment_source,
        saved_method_id: validation.data.saved_method_id,
        payment_method: validation.data.payment_method,
        save_card: validation.data.save_card,
        cardholder_name: validation.data.cardholder_name,
        card_number: validation.data.card_number,
        exp_month: validation.data.exp_month,
        exp_year: validation.data.exp_year,
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
