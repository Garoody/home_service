"use strict";

import authService from "../../services/AuthService.js";
import UserDTO from "../../dto/UserDTO.js";
import {
  validateLoginPayload,
  validateRegisterPayload,
} from "../../validators/userValidator.js";
import { getFirstValidationMessage } from "../../utils/formState.js";

const INVALID_LOGIN_MESSAGE = "Email ou mot de passe invalide.";

/**
 * Helper de rendu pour la page login.
 * Centralise la forme de l'objet passe a la vue EJS.
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
        gdpr_consent: !!formData.gdpr_consent,
      },
    });
}

function getRegisterErrorFeedback(error) {
  const errorCode = String(error?.code || "");
  const constraint = String(error?.constraint || "");
  const detail = String(error?.detail || "");

  if (
    errorCode === "23505" &&
    (constraint === "users_email_key" || detail.includes("(email)"))
  ) {
    return {
      status: 409,
      message: "Cet email est deja utilise.",
    };
  }

  if (
    errorCode === "23514" &&
    (constraint === "chk_email_format" || detail.toLowerCase().includes("email"))
  ) {
    return {
      status: 400,
      message: "Email invalide.",
    };
  }

  return null;
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
          error: INVALID_LOGIN_MESSAGE,
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

  // scénario de création de compte :
  async register(req, res) {
    const rawFormData = {
      full_name: req.body?.full_name || "",
      phone: req.body?.phone || "",
      email: req.body?.email || "",
      gdpr_consent:
        req.body?.gdpr_consent === "on" ||
        req.body?.gdpr_consent === "true" ||
        req.body?.gdpr_consent === true,
    };
    try {
      const validation = validateRegisterPayload(req.body);

      if (!validation.success) {
        return renderRegister(res.status(400), {
          csrfToken: res.locals.csrfToken,
          error: getFirstValidationMessage(validation),
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

      req.flash?.("success", "Compte cree. Vous pourrez reserver ou publier un service avec ce meme compte.");
      return res.redirect("/");
    } catch (error) {
      const feedback = getRegisterErrorFeedback(error);
      if (feedback) {
        return renderRegister(res.status(feedback.status), {
          csrfToken: res.locals.csrfToken,
          error: feedback.message,
          formData: rawFormData,
        });
      }

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
