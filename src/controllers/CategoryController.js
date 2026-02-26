"use strict";

import CategoryService from "../services/CategoryService.js";

class CategoryController {
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

  async create(req, res) {
    res.render("pages/category/new", {
      title: "Creer une categorie",
      csrfToken: res.locals.csrfToken,
    });
  }

  async store(req, res) {
    try {
      await CategoryService.create(req.body);
      req.flash?.("success", "Categorie creee.");
      res.redirect("/categories");
    } catch (error) {
      req.flash?.("error", error.message);
      res.redirect("/categories/new");
    }
  }
}

export default new CategoryController();
