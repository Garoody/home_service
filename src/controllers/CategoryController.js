"use strict";

import CategoryService from "../services/CategoryService.js";
import { validateCategoryPayload } from "../validators/categoryValidator.js";

class CategoryController {
  // Affiche la liste des categories.
  async index(req, res) {
    try {
      const categories = await CategoryService.list();

      res.render("pages/category/index", {
        title: "Categories - HomeService",
        categories,
      });
    } catch (error) {
      req.flash?.("error", error.message);
      res.redirect("/");
    }
  }

  // Affiche le formulaire de creation de categorie.
  async create(req, res) {
    res.render("pages/category/new", {
      title: "Creer une categorie",
      csrfToken: res.locals.csrfToken,
    });
  }

  // Traite la soumission du formulaire de creation.
  async store(req, res) {
    try {
      const validation = validateCategoryPayload(req.body);
      if (!validation.success) {
        req.flash?.("error", validation.message);
        return res.redirect("/categories/new");
      }

      await CategoryService.create(validation.data);
      req.flash?.("success", "Categorie creee.");
      res.redirect("/categories");
    } catch (error) {
      req.flash?.("error", error.message);
      res.redirect("/categories/new");
    }
  }
}

export default new CategoryController();
