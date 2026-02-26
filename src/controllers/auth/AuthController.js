"use strict";

import bcrypt from "bcrypt";
import UserService from "../../services/UserService.js";

function renderLogin(res, { csrfToken, error = null, email = "" } = {}) {
  return res.render("pages/auth/login", {
    title: "Connexion - HomeService",
    csrfToken: csrfToken ?? null,
    error,
    formData: { email },
  });
}

function renderRegister(
  res,
  { csrfToken, error = null, formData = {} } = {}
) {
  return res.render("pages/auth/register", {
    title: "Inscription - HomeService",
    csrfToken: csrfToken ?? null,
    error,
    formData: {
      full_name: formData.full_name || "",
      phone: formData.phone || "",
      email: formData.email || "",
      role: formData.role || "client",
      gdpr_consent: !!formData.gdpr_consent,
    },
  });
}

class AuthController {
  showLogin(req, res) {
    return renderLogin(res, { csrfToken: res.locals.csrfToken });
  }

  async login(req, res) {
    try {
      const { email = "", password = "" } = req.body;
      const user = await UserService.getByEmail(email);

      if (!user) {
        return res.status(401).render("pages/auth/login", {
          title: "Connexion - HomeService",
          csrfToken: res.locals.csrfToken ?? null,
          error: "Email ou mot de passe incorrect.",
          formData: { email },
        });
      }

      const hash = user.password_hash || user.password;
      const isValid = hash ? await bcrypt.compare(password, hash) : false;
      if (!isValid) {
        return res.status(401).render("pages/auth/login", {
          title: "Connexion - HomeService",
          csrfToken: res.locals.csrfToken ?? null,
          error: "Email ou mot de passe incorrect.",
          formData: { email },
        });
      }

      req.session.user = {
        id: user.id_user || user.id,
        name: user.full_name || user.name,
        role: user.role,
      };
      req.session.userId = user.id_user || user.id;

      return res.redirect("/");
    } catch (error) {
      console.error("Auth login error:", error);
      return res.status(500).render("pages/errors/500", { title: "Erreur serveur" });
    }
  }

  showRegister(req, res) {
    return renderRegister(res, { csrfToken: res.locals.csrfToken });
  }

  async register(req, res) {
    try {
      const formData = {
        full_name: (req.body.full_name || "").trim(),
        phone: (req.body.phone || "").trim(),
        email: (req.body.email || "").trim().toLowerCase(),
        role: req.body.role || "client",
        gdpr_consent:
          req.body.gdpr_consent === "on" ||
          req.body.gdpr_consent === "true" ||
          req.body.gdpr_consent === true,
      };
      const password = req.body.password || "";

      if (!formData.full_name || !formData.email || !password) {
        return res.status(400).render("pages/auth/register", {
          title: "Inscription - HomeService",
          csrfToken: res.locals.csrfToken ?? null,
          error: "Tous les champs obligatoires doivent etre remplis.",
          formData,
        });
      }

      if (!formData.gdpr_consent) {
        return res.status(400).render("pages/auth/register", {
          title: "Inscription - HomeService",
          csrfToken: res.locals.csrfToken ?? null,
          error: "Le consentement RGPD est obligatoire.",
          formData,
        });
      }

      const existing = await UserService.getByEmail(formData.email);
      if (existing) {
        return res.status(409).render("pages/auth/register", {
          title: "Inscription - HomeService",
          csrfToken: res.locals.csrfToken ?? null,
          error: "Cet email est deja utilise.",
          formData,
        });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await UserService.create({
        full_name: formData.full_name,
        email: formData.email,
        password_hash,
        phone: formData.phone || null,
        role: formData.role,
        gdpr_consent: true,
      });

      req.session.user = {
        id: user.id_user,
        name: user.full_name,
        role: user.role,
      };
      req.session.userId = user.id_user;

      return res.redirect("/");
    } catch (error) {
      console.error("Auth register error:", error);
      return res.status(500).render("pages/errors/500", { title: "Erreur serveur" });
    }
  }

  logout(req, res) {
    req.session.destroy(() => res.redirect("/auth/login"));
  }
}

export default new AuthController();
