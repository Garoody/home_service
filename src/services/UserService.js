"use strict";

import UserRepository from "../repositories/UserRepository.js";

/**
 * UserService
 */
class UserService {
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
}

export default new UserService();
