"use strict";

import PgCategoryRepository from "../repositories/PgCategoryRepository.js";

class CategoryService {
  static async hasAdminStatusColumn(...args) {
    return PgCategoryRepository.hasAdminStatusColumn(...args);
  }

  static async list(...args) {
    return PgCategoryRepository.list(...args);
  }

  static async getAll(...args) {
    return PgCategoryRepository.getAll(...args);
  }

  static async create(...args) {
    return PgCategoryRepository.create(...args);
  }

  static async findOrCreateByName(...args) {
    return PgCategoryRepository.findOrCreateByName(...args);
  }
}

export default CategoryService;
