"use strict";

import PgDashboardRepository from "../repositories/PgDashboardRepository.js";

class DashboardService {
  static async getClientDashboard(...args) {
    return PgDashboardRepository.getClientDashboard(...args);
  }

  static async getProviderDashboard(...args) {
    return PgDashboardRepository.getProviderDashboard(...args);
  }

  static async getUserDashboard(...args) {
    return PgDashboardRepository.getUserDashboard(...args);
  }
}

export default DashboardService;
