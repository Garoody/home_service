"use strict";

import authService from "../../services/AuthService.js";
import UserDTO from "../../dto/UserDTO.js";
import {
  validateLoginPayload,
  validateRegisterPayload,
} from "../../validators/userValidator.js";

/**
 * Helper de rendu pour la page login.
 * Centralise la forme de l'objet passé à la vue EJS.
 */
function renderLogin(res, { csrfToken, error = null, email = "" } = {}) {
  return res.render("pages/auth/login", {
    title: "Connexion - HomeService",
    csrfToken: csrfToken ?? null,
    error,
    formData: { email },
  });
}

/**
 * Helper de rendu pour la page register.
 * Permet de conserver les valeurs saisies en cas d'erreur.
 */
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

/**
 * AuthController
 */
class AuthController {
  showLogin(req, res) {
    return renderLogin(res, { csrfToken: res.locals.csrfToken });
  }

  async login(req, res) {
    try {
      const validation = validateLoginPayload(req.body);
      const fallbackEmail = String(req.body?.email || "");

      if (!validation.success) {
        return renderLogin(res.status(400), {
          csrfToken: res.locals.csrfToken,
          error: validation.message,
          email: fallbackEmail,
        });
      }

      const loginDto = UserDTO.toLoginDTO(validation.data);
      const authResult = await authService.authenticate(loginDto);

      if (!authResult.success) {
        return renderLogin(res.status(authResult.status || 401), {
          csrfToken: res.locals.csrfToken,
          error: authResult.message,
          email: loginDto.email,
        });
      }

      req.session.user = authResult.user.toSession();
      req.session.userId = authResult.user.id;

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
      const validation = validateRegisterPayload(req.body);
      const rawFormData = {
        full_name: req.body?.full_name || "",
        phone: req.body?.phone || "",
        email: req.body?.email || "",
        role: req.body?.role || "client",
        gdpr_consent:
          req.body?.gdpr_consent === "on" ||
          req.body?.gdpr_consent === "true" ||
          req.body?.gdpr_consent === true,
      };

      if (!validation.success) {
        return renderRegister(res.status(400), {
          csrfToken: res.locals.csrfToken,
          error: validation.message,
          formData: rawFormData,
        });
      }

      const registerDto = UserDTO.toRegisterDTO(validation.data);
      const registerResult = await authService.register(registerDto);

      if (!registerResult.success) {
        return renderRegister(res.status(registerResult.status || 400), {
          csrfToken: res.locals.csrfToken,
          error: registerResult.message,
          formData: {
            ...registerDto,
            gdpr_consent: true,
          },
        });
      }

      req.session.user = registerResult.user.toSession();
      req.session.userId = registerResult.user.id;

      return res.redirect("/");
    } catch (error) {
      console.error("Auth register error:", error);
      return res.status(500).render("pages/errors/500", { title: "Erreur serveur" });
    }
  }

  googleCallback(req, res) {
    if (!req.user) {
      return renderLogin(res.status(401), {
        csrfToken: res.locals.csrfToken,
        error: "Connexion Google impossible.",
        email: "",
      });
    }

    req.session.user = req.user.toSession();
    req.session.userId = req.user.id;

    return res.redirect("/");
  }

  logout(req, res) {
    req.session.destroy(() => res.redirect("/auth/login"));
  }
}

export default new AuthController();
