"use strict";

import BookingService from "../services/BookingService.js";
import {
  validateBookingCreatePayload,
  validateBookingUpdatePayload,
} from "../validators/bookingValidator.js";
import { getFirstValidationMessage } from "../utils/formState.js";
import { getBookingDateTimeConstraints } from "../utils/bookingSlot.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
}

function buildBookingOldInput(payload = {}) {
  return {
    service_id: payload.service_id || "",
    first_name: payload.first_name || "",
    last_name: payload.last_name || "",
    city: payload.city || "",
    address: payload.address || "",
    booking_date: payload.booking_date || "",
    booking_time: payload.booking_time || "",
    payment_method: payload.payment_method || "cb",
    cardholder_name: payload.cardholder_name || "",
    expiry: payload.expiry || "",
    paypal_full_name: payload.paypal_full_name || "",
    paypal_email: payload.paypal_email || "",
    paypal_reference: payload.paypal_reference || "",
    bank_account_name: payload.bank_account_name || "",
    bank_name: payload.bank_name || "",
    bic: payload.bic || "",
    transfer_reference: payload.transfer_reference || "",
  };
}

function getSafeReturnPath(req, fallbackPath) {
  const returnTo = String(req.body?.returnTo || "").trim();

  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallbackPath;
}

class BookingController {
  async index(req, res) {
    try {
      const userId = getUserId(req);
      const rawBookings = await BookingService.listForUser(userId);
      const bookings = rawBookings.map((booking) => ({
        ...booking,
        canManage: String(booking.client_id) === String(userId),
      }));

      res.render("pages/bookings/index", {
        title: "Mes réservations - HomeService",
        bookings,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async show(req, res) {
    try {
      const clientId = getUserId(req);
      const { id } = req.params;
      const booking = await BookingService.getDetailForUser({ bookingId: id, clientId });

      return res.render("pages/bookings/show", {
        title: "Détail de la réservation - HomeService",
        booking,
        viewerMode: "client",
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/bookings");
    }
  }

  async new(req, res) {
    const serviceId = req.query.service_id || req.query.service || "";

    try {
      const clientId = getUserId(req);

      if (serviceId) {
        await BookingService.assertClientCanBookService({
          serviceId,
          clientId,
        });
      }

      res.render("pages/bookings/new", {
        title: "Nouvelle réservation - HomeService",
        serviceId,
        bookingDateMin: getBookingDateTimeConstraints().minDate,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect(serviceId ? `/services/${serviceId}` : "/services");
    }
  }

  async edit(req, res) {
    try {
      const clientId = getUserId(req);
      const { id } = req.params;
      const booking = await BookingService.getByIdForUser({ bookingId: id, clientId });

      if (booking.status !== "pending") {
        req.flash("error", "Cette réservation n'est plus modifiable.");
        return res.redirect("/bookings");
      }

      res.render("pages/bookings/edit", {
        title: "Modifier la réservation - HomeService",
        booking,
        bookingDateMin: getBookingDateTimeConstraints().minDate,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }

  async store(req, res) {
    const validation = validateBookingCreatePayload(req.body);
    const serviceIdForRedirect = req.body?.service_id || "";

    try {
      if (!validation.success) {
        req.saveOldInput(buildBookingOldInput(req.body));
        req.flash("error", getFirstValidationMessage(validation));
        const backService = serviceIdForRedirect ? `?service=${encodeURIComponent(serviceIdForRedirect)}` : "";
        return res.redirect(`/bookings/new${backService}`);
      }

      const {
        service_id,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
      } = validation.data;
      const clientId = getUserId(req);

      await BookingService.assertClientCanBookService({
        serviceId: service_id,
        clientId,
      });

      const booking = await BookingService.create({
        client_id: clientId,
        service_id,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
      });

      req.flash(
        "success",
        "Demande de réservation envoyée. Le chat est ouvert et le paiement restera bloqué jusqu'à la confirmation du prestataire."
      );

      if (booking?.conversationId) {
        return res.redirect(`/conversations/${booking.conversationId}`);
      }

      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      if (
        serviceIdForRedirect &&
        error.message === "Vous ne pouvez pas réserver votre propre service."
      ) {
        return res.redirect(`/services/${serviceIdForRedirect}`);
      }

      req.saveOldInput(buildBookingOldInput(req.body));
      const backService = serviceIdForRedirect ? `?service=${encodeURIComponent(serviceIdForRedirect)}` : "";
      res.redirect(`/bookings/new${backService}`);
    }
  }

  async update(req, res) {
    try {
      const validation = validateBookingUpdatePayload(req.body);
      if (!validation.success) {
        req.saveOldInput(req.body);
        req.flash("error", getFirstValidationMessage(validation));
        return res.redirect(`/bookings/${req.params.id}/edit`);
      }

      const clientId = getUserId(req);
      const { id } = req.params;
      const { first_name, last_name, city, address, booking_date, booking_time } = validation.data;

      await BookingService.updateByClient({
        bookingId: id,
        clientId,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
      });

      req.flash("success", "Réservation mise a jour.");
      res.redirect("/bookings");
    } catch (error) {
      req.saveOldInput(req.body);
      req.flash("error", error.message);
      res.redirect(`/bookings/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      const clientId = getUserId(req);
      const { id } = req.params;

      await BookingService.deleteByClient({ bookingId: id, clientId });

      req.flash("success", "Réservation annulée.");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }

  async confirmByProvider(req, res) {
    const fallbackPath = "/users/profile/service-bookings/pending";

    try {
      const providerId = getUserId(req);
      const { id } = req.params;

      await BookingService.confirmByProvider({ bookingId: id, providerId });

      req.flash(
        "success",
        "Réservation confirmée. Le client peut maintenant procéder au paiement."
      );
      res.redirect(getSafeReturnPath(req, fallbackPath));
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(getSafeReturnPath(req, fallbackPath));
    }
  }

  async refuseByProvider(req, res) {
    const fallbackPath = "/users/profile/service-bookings/pending";

    try {
      const providerId = getUserId(req);
      const { id } = req.params;

      await BookingService.refuseByProvider({ bookingId: id, providerId });

      req.flash("success", "Réservation refusée.");
      res.redirect(getSafeReturnPath(req, fallbackPath));
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(getSafeReturnPath(req, fallbackPath));
    }
  }
}

export default new BookingController();
