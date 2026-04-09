"use strict";

import PaymentService from "../services/PaymentService.js";
import { validatePaymentPayload } from "../validators/paymentValidator.js";
import { getFirstValidationMessage } from "../utils/formState.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

function pad2(value) {
  return String(value || "").padStart(2, "0");
}

function buildExpiryDisplay(expMonth, expYear) {
  if (!expMonth || !expYear) {
    return "";
  }

  return `${pad2(expMonth)}/${String(expYear).slice(-2)}`;
}

function buildPaymentOldInput(payload = {}) {
  return {
    amount: payload.amount || "",
    payment_source: payload.payment_source === "saved" ? "saved" : "new",
    saved_method_id: payload.saved_method_id || "",
    payment_method: payload.payment_method || "cb",
    cardholder_name: payload.cardholder_name || "",
    paypal_full_name: payload.paypal_full_name || "",
    paypal_email: payload.paypal_email || "",
    paypal_reference: payload.paypal_reference || "",
    bank_account_name: payload.bank_account_name || "",
    bank_name: payload.bank_name || "",
    bic: payload.bic || "",
    transfer_reference: payload.transfer_reference || "",
    card_number: payload.card_number || "",
    exp_month: payload.exp_month || "",
    exp_year: payload.exp_year || "",
    expiry: buildExpiryDisplay(payload.exp_month, payload.exp_year),
    save_card:
      payload.save_card === true ||
      payload.save_card === "true" ||
      payload.save_card === "on",
  };
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

  async show(req, res) {
    try {
      const clientId = getUserId(req);
      const { paymentId } = req.params;
      const payment = await PaymentService.getByIdForUser({ paymentId, clientId });

      return res.render("pages/payments/show", {
        title: "Detail du paiement - HomeService",
        payment,
        viewerMode: "client",
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/payments");
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
        preferredMethod: res.locals.oldInput?.payment_method || req.query.method || "cb",
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
        paypal_full_name: req.body.paypal_full_name,
        paypal_email: req.body.paypal_email,
        paypal_reference: req.body.paypal_reference,
        bank_account_name: req.body.bank_account_name,
        bank_name: req.body.bank_name,
        iban: req.body.iban,
        bic: req.body.bic,
        transfer_reference: req.body.transfer_reference,
        save_card: req.body.save_card,
      });

      if (!validation.success) {
        req.saveOldInput(buildPaymentOldInput(req.body));
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(`/payments/${bookingId}`);
      }

      const paymentResult = await PaymentService.payBooking({
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
        payment_details: validation.data.payment_details,
      });

      req.flash("success", "Paiement valide. Le creneau est maintenant reserve et la discussion reste disponible.");
      res.redirect(paymentResult?.conversationId ? `/conversations/${paymentResult.conversationId}` : "/payments");
    } catch (error) {
      req.saveOldInput(buildPaymentOldInput(req.body));
      req.flash("error", error.message);
      res.redirect(`/payments/${req.params.bookingId}`);
    }
  }
}

export default new PaymentController();
