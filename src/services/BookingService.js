"use strict";

import db from "../config/database.js";
import PgBookingRepository from "../repositories/PgBookingRepository.js";
import BookingMaintenanceService from "./BookingMaintenanceService.js";
import ConversationService from "./ConversationService.js";
import { isBookingSlotExpired, validateBookingSlot } from "../utils/bookingSlot.js";
import {
  buildServiceViewerState,
  pickRelevantServiceBooking,
} from "../utils/serviceViewerState.js";

class BookingService {
  static async hasContactColumns(...args) {
    return PgBookingRepository.hasContactColumns(...args);
  }

  static async hasAdminStatusColumn(...args) {
    return PgBookingRepository.hasAdminStatusColumn(...args);
  }

  static async getOwnerIdByBookingId(...args) {
    return PgBookingRepository.getOwnerIdByBookingId(...args);
  }

  static async getServiceForBooking(...args) {
    return PgBookingRepository.getServiceForBooking(...args);
  }

  static async assertClientCanBookService({ serviceId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }

    const service = await this.getServiceForBooking(serviceId);
    if (!service) {
      throw new Error("Service introuvable ou indisponible.");
    }

    if (String(service.provider_id) === String(clientId)) {
      throw new Error("Vous ne pouvez pas réserver votre propre service.");
    }
    return service;
  }

  static async assertOwnership(bookingId, clientId) {
    const ownerId = await this.getOwnerIdByBookingId(bookingId);
    if (!ownerId) {
      throw new Error("Réservation introuvable.");
    }

    if (String(ownerId) !== String(clientId)) {
      throw new Error("Action non autorisée sur cette réservation.");
    }
  }

  static async getBookingContext(bookingId, { dbClient = db } = {}) {
    await BookingMaintenanceService.expirePendingBookings({ dbClient });
    return PgBookingRepository.getBookingContext(bookingId, dbClient);
  }

  static async findPaidConflictForSlot(...args) {
    return PgBookingRepository.findPaidConflictForSlot(...args);
  }

  static async assertNoPaidConflictForSlot(options) {
    const conflict = await this.findPaidConflictForSlot(options);
    if (conflict) {
      throw new Error(
        "Vous êtes déjà engagé sur ce créneau. Une autre réservation a déjà été payée à cette heure."
      );
    }
    return null;
  }

  static async listForUser(clientId) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }

    await BookingMaintenanceService.expirePendingBookings();
    const hasConversationTables = await ConversationService.hasConversationTables();

    return PgBookingRepository.listForUser(clientId, {
      hasConversationTables,
    });
  }

  static async getByIdForUser({ bookingId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }

    await BookingMaintenanceService.expirePendingBookings();
    const booking = await PgBookingRepository.getByIdForUser({
      bookingId,
      clientId,
    });

    if (!booking) {
      throw new Error("Réservation introuvable.");
    }

    return booking;
  }

  static async getDetailForUser({ bookingId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }

    await BookingMaintenanceService.expirePendingBookings();
    const hasConversationTables = await ConversationService.hasConversationTables();
    const booking = await PgBookingRepository.getDetailForUser({
      bookingId,
      clientId,
      hasConversationTables,
    });

    if (!booking) {
      throw new Error("Réservation introuvable.");
    }

    return booking;
  }

  static async getServiceViewerStatesForUser({ clientId, serviceIds = [] }) {
    if (!clientId || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return new Map();
    }

    await BookingMaintenanceService.expirePendingBookings();

    const normalizedServiceIds = Array.from(
      new Set(serviceIds.map((serviceId) => String(serviceId || "").trim()).filter(Boolean))
    );

    if (normalizedServiceIds.length === 0) {
      return new Map();
    }

    const hasConversationTables = await ConversationService.hasConversationTables();
    const rows = await PgBookingRepository.listServiceViewerBookingsForUser({
      clientId,
      serviceIds: normalizedServiceIds,
      hasConversationTables,
    });

    const groupedByService = rows.reduce((accumulator, row) => {
      const key = String(row.service_id);
      if (!accumulator.has(key)) {
        accumulator.set(key, []);
      }

      accumulator.get(key).push(row);
      return accumulator;
    }, new Map());

    const viewerStates = new Map();

    groupedByService.forEach((bookings, serviceId) => {
      const booking = pickRelevantServiceBooking(bookings);
      const viewerState = buildServiceViewerState(booking);

      if (viewerState) {
        viewerStates.set(serviceId, viewerState);
      }
    });

    return viewerStates;
  }

  static async listForProvider(providerId, { status } = {}) {
    if (!providerId) {
      throw new Error("Utilisateur non connecté.");
    }

    await BookingMaintenanceService.expirePendingBookings();
    const hasConversationTables = await ConversationService.hasConversationTables();

    return PgBookingRepository.listForProvider(providerId, {
      status,
      hasConversationTables,
    });
  }

  static async getDetailForProvider({ bookingId, providerId }) {
    if (!providerId) {
      throw new Error("Utilisateur non connecté.");
    }

    await BookingMaintenanceService.expirePendingBookings();
    const hasConversationTables = await ConversationService.hasConversationTables();
    const booking = await PgBookingRepository.getDetailForProvider({
      bookingId,
      providerId,
      hasConversationTables,
    });

    if (!booking) {
      throw new Error("Réservation introuvable.");
    }

    return booking;
  }

  static async create({
    client_id,
    service_id,
    first_name,
    last_name,
    city,
    address,
    booking_date,
    booking_time,
  }) {
    if (!client_id) {
      throw new Error("Utilisateur non connecté.");
    }
    if (!service_id || !booking_date || !booking_time) {
      throw new Error("Champs manquants pour la réservation.");
    }

    const slotValidation = validateBookingSlot({
      bookingDate: booking_date,
      bookingTime: booking_time,
    });
    if (!slotValidation.valid) {
      throw new Error(slotValidation.message);
    }

    const service = await this.assertClientCanBookService({
      serviceId: service_id,
      clientId: client_id,
    });

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      await BookingMaintenanceService.expirePendingBookings({ dbClient: client });

      const booking = await PgBookingRepository.create({
        client_id,
        service_id: service.id_service,
        first_name,
        last_name,
        city,
        address,
        booking_date,
        booking_time,
        total_price: service.price,
        dbClient: client,
      });

      const conversation = await ConversationService.ensureBookingConversation({
        bookingId: booking?.id,
        dbClient: client,
      });

      if (conversation?.id) {
        await ConversationService.addBookingIntroMessage({
          conversationId: conversation.id,
          senderId: client_id,
          bookingDate: booking_date,
          bookingTime: booking_time,
          firstName: first_name,
          lastName: last_name,
          address,
          city,
          dbClient: client,
        });
      }

      await client.query("COMMIT");

      return {
        ...booking,
        conversationId: conversation?.id || null,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateByClient({
    bookingId,
    clientId,
    first_name,
    last_name,
    city,
    address,
    booking_date,
    booking_time,
  }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }
    if (!first_name || !last_name || !city || !address || !booking_date || !booking_time) {
      throw new Error("Tous les champs du formulaire sont obligatoires.");
    }

    const slotValidation = validateBookingSlot({
      bookingDate: booking_date,
      bookingTime: booking_time,
    });
    if (!slotValidation.valid) {
      throw new Error(slotValidation.message);
    }

    const booking = await this.getBookingContext(bookingId);
    if (!booking) {
      throw new Error("Réservation introuvable.");
    }
    if (String(booking.client_id) !== String(clientId)) {
      throw new Error("Action non autorisée sur cette réservation.");
    }
    if (booking.status !== "pending") {
      throw new Error("Seules les réservations en attente peuvent encore être modifiées.");
    }

    const updatedBooking = await PgBookingRepository.updateByClient({
      bookingId,
      clientId,
      first_name,
      last_name,
      city,
      address,
      booking_date,
      booking_time,
    });

    if (!updatedBooking) {
      throw new Error("Réservation introuvable.");
    }

    return updatedBooking;
  }

  static async deleteByClient({ bookingId, clientId }) {
    if (!clientId) {
      throw new Error("Utilisateur non connecté.");
    }

    const booking = await this.getBookingContext(bookingId);
    if (!booking) {
      throw new Error("Réservation introuvable.");
    }
    if (String(booking.client_id) !== String(clientId)) {
      throw new Error("Vous ne pouvez supprimer que votre réservation.");
    }
    if (booking.payment_status === "paid") {
      throw new Error("Une réservation déjà payée ne peut plus être annulée ici.");
    }
    if (!["pending", "confirmed"].includes(booking.status)) {
      throw new Error("Cette réservation ne peut plus être annulée.");
    }

    const deletedBooking = await PgBookingRepository.deleteByClient({
      bookingId,
      clientId,
    });

    if (!deletedBooking) {
      throw new Error("Vous ne pouvez annuler que votre réservation.");
    }

    return deletedBooking;
  }

  static async confirmByProvider({ bookingId, providerId }) {
    if (!providerId) {
      throw new Error("Utilisateur non connecté.");
    }

    const booking = await this.getBookingContext(bookingId);
    if (!booking) {
      throw new Error("Réservation introuvable.");
    }
    if (String(booking.provider_id) !== String(providerId)) {
      throw new Error("Action non autorisée sur cette réservation.");
    }
    if (
      booking.status === "cancelled" &&
      isBookingSlotExpired({
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
      })
    ) {
      throw new Error(
        "La date demandée est dépassée. La réservation a été annulée automatiquement."
      );
    }
    if (booking.status !== "pending") {
      throw new Error("Cette réservation a déjà été traitée.");
    }

    await this.assertNoPaidConflictForSlot({
      providerId,
      bookingDate: booking.booking_date,
      bookingTime: booking.booking_time,
      excludeBookingId: bookingId,
    });

    const confirmedBooking = await PgBookingRepository.confirmByProvider({
      bookingId,
    });

    if (!confirmedBooking) {
      throw new Error("Réservation introuvable.");
    }

    return confirmedBooking;
  }

  static async refuseByProvider({ bookingId, providerId }) {
    if (!providerId) {
      throw new Error("Utilisateur non connecté.");
    }

    const booking = await this.getBookingContext(bookingId);
    if (!booking) {
      throw new Error("Réservation introuvable.");
    }
    if (String(booking.provider_id) !== String(providerId)) {
      throw new Error("Action non autorisée sur cette réservation.");
    }
    if (
      booking.status === "cancelled" &&
      isBookingSlotExpired({
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
      })
    ) {
      throw new Error(
        "La date demandée est dépassée. La réservation a été annulée automatiquement."
      );
    }
    if (booking.status !== "pending") {
      throw new Error("Cette réservation a déjà été traitée.");
    }

    const refusedBooking = await PgBookingRepository.refuseByProvider({
      bookingId,
    });

    if (!refusedBooking) {
      throw new Error("Réservation introuvable.");
    }

    return refusedBooking;
  }
}

export default BookingService;
