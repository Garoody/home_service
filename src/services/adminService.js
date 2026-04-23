"use strict";

import PgAdminRepository from "../repositories/PgAdminRepository.js";

class AdminService {
  async hasReportsTable(...args) {
    return PgAdminRepository.hasReportsTable(...args);
  }

  async logAction(...args) {
    return PgAdminRepository.logAction(...args);
  }

  async queryActionLogs(...args) {
    return PgAdminRepository.queryActionLogs(...args);
  }

  async getDashboardData(...args) {
    return PgAdminRepository.getDashboardData(...args);
  }

  async listUsers(...args) {
    return PgAdminRepository.listUsers(...args);
  }

  async moderateUser(...args) {
    return PgAdminRepository.moderateUser(...args);
  }

  async listServices(...args) {
    return PgAdminRepository.listServices(...args);
  }

  async moderateService(...args) {
    return PgAdminRepository.moderateService(...args);
  }

  async listReviews(...args) {
    return PgAdminRepository.listReviews(...args);
  }

  async moderateReview(...args) {
    return PgAdminRepository.moderateReview(...args);
  }

  async listConversations(...args) {
    return PgAdminRepository.listConversations(...args);
  }

  async getConversationByIdForAdmin(...args) {
    return PgAdminRepository.getConversationByIdForAdmin(...args);
  }

  async listBookings(...args) {
    return PgAdminRepository.listBookings(...args);
  }

  async getBookingById(...args) {
    return PgAdminRepository.getBookingById(...args);
  }

  async listPayments(...args) {
    return PgAdminRepository.listPayments(...args);
  }

  async getPaymentById(...args) {
    return PgAdminRepository.getPaymentById(...args);
  }

  async getUserById(...args) {
    return PgAdminRepository.getUserById(...args);
  }

  async getServiceById(...args) {
    return PgAdminRepository.getServiceById(...args);
  }

  async getReviewById(...args) {
    return PgAdminRepository.getReviewById(...args);
  }

  async listActionLogs(...args) {
    return PgAdminRepository.listActionLogs(...args);
  }

  async searchAll(...args) {
    return PgAdminRepository.searchAll(...args);
  }

  async listReports(...args) {
    return PgAdminRepository.listReports(...args);
  }

  async createReport(...args) {
    return PgAdminRepository.createReport(...args);
  }

  async updateReportStatus(...args) {
    return PgAdminRepository.updateReportStatus(...args);
  }
}

export default new AdminService();
