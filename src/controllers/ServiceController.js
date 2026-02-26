"use strict";

import ServiceService from "../services/ServiceService.js";
import CategoryService from "../services/CategoryService.js";

class ServiceController {
  async index(req, res) {
    try {
      const { q, category_id } = req.query;

      const [services, categories] = await Promise.all([
        ServiceService.search({ q, category_id }),
        CategoryService.list(),
      ]);

      res.render("pages/services/index", {
        title: "Services - HomeService",
        services,
        categories,
        q: q || "",
        category_id: category_id || "",
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async show(req, res) {
    try {
      const { slug } = req.params;
      const service = await ServiceService.getBySlug(slug);

      res.render("pages/services/show", {
        title: "Detail du service - HomeService",
        service,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async create(req, res) {
    try {
      const categories = await CategoryService.list();

      res.render("pages/services/new", {
        title: "Creer un service - HomeService",
        categories,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async store(req, res) {
    try {
      const providerId = req.session?.user?.id ?? req.session?.userId;

      if (!providerId) {
        req.flash("error", "Vous devez etre connecte en tant que prestataire.");
        return res.redirect("/auth/login");
      }

      await ServiceService.create({
        provider_id: providerId,
        category_id: req.body.category_id,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
      });

      req.flash("success", "Service cree.");
      res.redirect("/services");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services/new");
    }
  }

  async edit(req, res) {
    try {
      const { slug } = req.params;
      const [service, categories] = await Promise.all([
        ServiceService.getBySlug(slug),
        CategoryService.list(),
      ]);

      res.render("pages/services/edit", {
        title: "Modifier le service - HomeService",
        service,
        categories,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/services");
    }
  }

  async update(req, res) {
    try {
      const { slug } = req.params;

      await ServiceService.updateBySlug(slug, {
        category_id: req.body.category_id,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
      });

      req.flash("success", "Service mis a jour.");
      res.redirect(`/services/${slug}`);
    } catch (error) {
      req.flash("error", error.message);
      res.redirect(`/services/${req.params.slug}/edit`);
    }
  }
}

export default new ServiceController();
