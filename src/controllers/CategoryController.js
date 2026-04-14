"use strict";

import CategoryService from "../services/CategoryService.js";
import { validateCategoryPayload } from "../validators/categoryValidator.js";
import { getFirstValidationMessage } from "../utils/formState.js";

class CategoryController {
  // Affiche la liste des catégories.
  async index(req, res) {
    try {
      const categories = await CategoryService.list();

      res.render("pages/category/index", {
        title: "Catégories - HomeService",
        categories,
      });
    } catch (error) {
      req.flash?.("error", error.message);
      res.redirect("/");
    }
  }

  // Affiche le formulaire de création de catégorie.
  async create(req, res) {
    res.render("pages/category/new", {
      title: "Créer une catégorie",
      csrfToken: res.locals.csrfToken,
    });
  }

  // Traite la soumission du formulaire de création.
  async store(req, res) {
    try {
      const validation = validateCategoryPayload(req.body);
      if (!validation.success) {
        req.saveOldInput?.(req.body);
        req.flash?.("error", getFirstValidationMessage(validation));
        return res.redirect("/categories/new");
      }

      await CategoryService.create(validation.data);
      req.flash?.("success", "Catégorie créée.");
      res.redirect("/categories");
    } catch (error) {
      req.saveOldInput?.(req.body);
      req.flash?.("error", error.message);
      res.redirect("/categories/new");
    }
  }
}

export default new CategoryController();
