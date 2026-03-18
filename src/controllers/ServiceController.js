"use strict";

import ServiceService from "../services/ServiceService.js";
import CategoryService from "../services/CategoryService.js";
import ReviewService from "../services/ReviewService.js";
import { validateServicePayload } from "../validators/serviceValidator.js";

function getCategoryId(category) {
  return category?.id || category?.id_category || null;
}

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
      const [service, reviews] = await Promise.all([
        ServiceService.getBySlug(slug),
        ReviewService.getByService(slug),
      ]);

      res.render("pages/services/show", {
        title: "Detail du service - HomeService",
        service,
        reviews,
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

      const validation = validateServicePayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect("/services/new");
      }

      const category =
        validation.data.category_id === "other"
          ? await CategoryService.findOrCreateByName(validation.data.custom_category_name)
          : { id: validation.data.category_id };

      const categoryId = getCategoryId(category);
      if (!categoryId) {
        req.flash("error", "La categorie du service est introuvable.");
        return res.redirect("/services/new");
      }

      await ServiceService.create({
        provider_id: providerId,
        category_id: categoryId,
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        experience_years: validation.data.experience_years,
        trainings: validation.data.trainings,
        has_driving_license: validation.data.has_driving_license,
        service_area: validation.data.service_area,
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
      const validation = validateServicePayload(req.body);
      if (!validation.success) {
        req.flash("error", validation.message);
        return res.redirect(`/services/${slug}/edit`);
      }

      const category =
        validation.data.category_id === "other"
          ? await CategoryService.findOrCreateByName(validation.data.custom_category_name)
          : { id: validation.data.category_id };

      const categoryId = getCategoryId(category);
      if (!categoryId) {
        req.flash("error", "La categorie du service est introuvable.");
        return res.redirect(`/services/${slug}/edit`);
      }

      await ServiceService.updateBySlug(slug, {
        category_id: categoryId,
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        experience_years: validation.data.experience_years,
        trainings: validation.data.trainings,
        has_driving_license: validation.data.has_driving_license,
        service_area: validation.data.service_area,
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
