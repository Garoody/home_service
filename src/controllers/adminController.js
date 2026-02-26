"use strict";

import AdminService from "../services/adminService";

class AdminController {
  async dashboard(req, res) {
    const stats = await AdminService.getStats();

    res.render("pages/admin/dashboard", {
      title: "Admin Dashboard - HomeService",
      stats,
    });
  }
}

export default new AdminController();