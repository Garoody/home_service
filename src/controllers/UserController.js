"use strict";

import UserService from "../services/UserService.js";

class UserController {
  async profile(req, res) {
    try {
      const userId = req.session.userId;
      const user = await UserService.getById(userId);

      res.render("pages/users/profile", {
        title: "Mon profil - HomeService",
        user,
        csrfToken: res.locals.csrfToken,
      });
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/");
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.session.userId;
      await UserService.update(userId, req.body);

      req.flash("success", "Profil mis à jour ✅");
      res.redirect("/profile");
    } catch (error) {
      req.flash("error", error.message);
      res.redirect("/profile");
    }
  }
}

export default new UserController();