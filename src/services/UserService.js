"use strict";

import PgUserRepository from "../repositories/PgUserRepository.js";

/**
 * UserService
 */
class UserService {
  async getById(userId) {
    return PgUserRepository.findById(userId);
  }

  async getByEmail(email) {
    return PgUserRepository.findByEmail(email);
  }

  async create({ full_name, email, password_hash, phone, role, gdpr_consent }) {
    return PgUserRepository.create({
      full_name,
      email,
      password_hash,
      phone,
      role,
      gdpr_consent,
    });
  }

  async deleteById(userId) {
    return PgUserRepository.deleteById(userId);
  }

  async updateServiceProfile(payload) {
    return PgUserRepository.updateServiceProfile(payload);
  }

  async updateProviderStatus(payload) {
    return PgUserRepository.updateProviderStatus(payload);
  }

  async updateUserProfile(payload) {
    return PgUserRepository.updateUserProfile(payload);
  }
}

export default new UserService();
