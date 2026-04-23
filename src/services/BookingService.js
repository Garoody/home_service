"use strict";

import PgBookingRepository from "../repositories/PgBookingRepository.js";

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

  static async assertClientCanBookService(...args) {
    return PgBookingRepository.assertClientCanBookService(...args);
  }

  static async assertOwnership(...args) {
    return PgBookingRepository.assertOwnership(...args);
  }

  static async getBookingContext(...args) {
    return PgBookingRepository.getBookingContext(...args);
  }

  static async findPaidConflictForSlot(...args) {
    return PgBookingRepository.findPaidConflictForSlot(...args);
  }

  static async assertNoPaidConflictForSlot(...args) {
    return PgBookingRepository.assertNoPaidConflictForSlot(...args);
  }

  static async listForUser(...args) {
    return PgBookingRepository.listForUser(...args);
  }

  static async getByIdForUser(...args) {
    return PgBookingRepository.getByIdForUser(...args);
  }

  static async getDetailForUser(...args) {
    return PgBookingRepository.getDetailForUser(...args);
  }

  static async getServiceViewerStatesForUser(...args) {
    return PgBookingRepository.getServiceViewerStatesForUser(...args);
  }

  static async listForProvider(...args) {
    return PgBookingRepository.listForProvider(...args);
  }

  static async getDetailForProvider(...args) {
    return PgBookingRepository.getDetailForProvider(...args);
  }

  static async create(...args) {
    return PgBookingRepository.create(...args);
  }

  static async updateByClient(...args) {
    return PgBookingRepository.updateByClient(...args);
  }

  static async deleteByClient(...args) {
    return PgBookingRepository.deleteByClient(...args);
  }

  static async confirmByProvider(...args) {
    return PgBookingRepository.confirmByProvider(...args);
  }

  static async refuseByProvider(...args) {
    return PgBookingRepository.refuseByProvider(...args);
  }
}

export default BookingService;
