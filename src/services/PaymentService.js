"use strict";

import PgPaymentRepository from "../repositories/PgPaymentRepository.js";

class PaymentService {
  static async hasPaymentMethodColumn(...args) {
    return PgPaymentRepository.hasPaymentMethodColumn(...args);
  }

  static async hasSavedPaymentMethodsTable(...args) {
    return PgPaymentRepository.hasSavedPaymentMethodsTable(...args);
  }

  static async hasPaymentDetailsColumn(...args) {
    return PgPaymentRepository.hasPaymentDetailsColumn(...args);
  }

  static async listSavedMethodsForUser(...args) {
    return PgPaymentRepository.listSavedMethodsForUser(...args);
  }

  static async getSavedMethodById(...args) {
    return PgPaymentRepository.getSavedMethodById(...args);
  }

  static async saveCardForUser(...args) {
    return PgPaymentRepository.saveCardForUser(...args);
  }

  static async listForUser(...args) {
    return PgPaymentRepository.listForUser(...args);
  }

  static async listForProvider(...args) {
    return PgPaymentRepository.listForProvider(...args);
  }

  static async getByIdForUser(...args) {
    return PgPaymentRepository.getByIdForUser(...args);
  }

  static async getByIdForProvider(...args) {
    return PgPaymentRepository.getByIdForProvider(...args);
  }

  static async getPayContext(...args) {
    return PgPaymentRepository.getPayContext(...args);
  }

  static async registerBookingPaymentSelection(...args) {
    return PgPaymentRepository.registerBookingPaymentSelection(...args);
  }

  static async payBooking(...args) {
    return PgPaymentRepository.payBooking(...args);
  }
}

export default PaymentService;
