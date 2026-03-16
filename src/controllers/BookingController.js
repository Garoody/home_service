"use strict";

import BookingService from "../services/BookingService.js";
import {
  validateBookingCreatePayload,
  validateBookingUpdatePayload,
} from "../validators/bookingValidator.js";

function getUserId(req) {
  return (
    req.session?.user?.id ||
    req.session?.user?.id_user ||
    req.session?.user?.userId ||
    req.session?.userId ||
    null
  );
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
        title: "Mes reservations - HomeService",
        bookings,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async new(req, res) {
    const serviceId = req.query.service_id || req.query.service || "";

    res.render("pages/bookings/new", {
      title: "Nouvelle reservation - HomeService",
      serviceId,
      csrfToken: res.locals.csrfToken,
    });
  }

  async edit(req, res) {
    try {
      const clientId = getUserId(req);
      const { id } = req.params;
      const booking = await BookingService.getByIdForUser({ bookingId: id, clientId });

      res.render("pages/bookings/edit", {
        title: "Modifier la reservation - HomeService",
        booking,
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
        req.flash("error", validation.message);
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

      await BookingService.create({
        client_id: clientId,
        service_id,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
      });

      req.flash("success", "Reservation creee.");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      const backService = serviceIdForRedirect ? `?service=${encodeURIComponent(serviceIdForRedirect)}` : "";
      res.redirect(`/bookings/new${backService}`);
    }
  }

  async update(req, res) {
    try {
      const validation = validateBookingUpdatePayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
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

      req.flash("success", "Reservation mise a jour.");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(`/bookings/${req.params.id}/edit`);
    }
  }

  async destroy(req, res) {
    try {
      const clientId = getUserId(req);
      const { id } = req.params;

      await BookingService.deleteByClient({ bookingId: id, clientId });

      req.flash("success", "Reservation supprimee.");
      res.redirect("/bookings");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/bookings");
    }
  }
}

export default new BookingController();
