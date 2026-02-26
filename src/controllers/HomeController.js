"use strict";

import ServiceService from "../services/ServiceService.js";

class HomeController {
  async home(req, res) {
    let featuredServices = [];

    try {
      const services = await ServiceService.search({});
      featuredServices = services.slice(0, 6);
    } catch (_error) {
      // Keep the home page rendering even if the DB is unavailable.
      featuredServices = [];
    }

    res.render("pages/home", {
      title: "Garoody - Ton deuxieme cerveau",
      user: req.session.userId ?? null,
      featuredServices,
    });
  }
}

export default new HomeController();
