"use strict";

import UserRepository from "../repositories/UserRepository.js";

/**
 * UserService
 */
class UserService {
  async getById(userId) {
    return UserRepository.findById(userId);
  }

  async getByEmail(email) {
    return UserRepository.findByEmail(email);
  }

  async create({ full_name, email, password_hash, phone, role, gdpr_consent }) {
    return UserRepository.create({
      full_name,
      email,
      password_hash,
      phone,
      role,
      gdpr_consent,
    });
  }

  async deleteById(userId) {
    return UserRepository.deleteById(userId);
  }

  async updateServiceProfile(payload) {
    return UserRepository.updateServiceProfile(payload);
  }

  async updateProviderStatus(payload) {
    return UserRepository.updateProviderStatus(payload);
  }

  async updateUserProfile(payload) {
    return UserRepository.updateUserProfile(payload);
  }
}

export default new UserService();
