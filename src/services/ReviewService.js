"use strict";

import PgReviewRepository from "../repositories/PgReviewRepository.js";

class ReviewService {
  static async hasProviderReplyColumns(...args) {
    return PgReviewRepository.hasProviderReplyColumns(...args);
  }

  static async getBookingReviewContext(...args) {
    return PgReviewRepository.getBookingReviewContext(...args);
  }

  static async getReviewByIdForClient(...args) {
    return PgReviewRepository.getReviewByIdForClient(...args);
  }

  static async getReviewByIdForProvider(...args) {
    return PgReviewRepository.getReviewByIdForProvider(...args);
  }

  static async create(...args) {
    return PgReviewRepository.create(...args);
  }

  static async updateByClient(...args) {
    return PgReviewRepository.updateByClient(...args);
  }

  static async deleteByClient(...args) {
    return PgReviewRepository.deleteByClient(...args);
  }

  static async replyByProvider(...args) {
    return PgReviewRepository.replyByProvider(...args);
  }

  static async getByService(...args) {
    return PgReviewRepository.getByService(...args);
  }

  static async listByClient(...args) {
    return PgReviewRepository.listByClient(...args);
  }

  static async listByProvider(...args) {
    return PgReviewRepository.listByProvider(...args);
  }
}

export default ReviewService;
