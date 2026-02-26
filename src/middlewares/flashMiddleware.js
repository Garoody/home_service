"use strict";

/**
 * HomeServices - Flash Middleware
 * Gère :
 *  - messages success / error / info
 *  - oldInput (ré-remplissage formulaire)
 *  - méthode req.flash()
 */

export const flashMiddleware = (req, res, next) => {
  // Injecter vers les vues
  res.locals.flash = req.session.flash || {
    success: [],
    error: [],
    info: [],
  };

  res.locals.oldInput = req.session.oldInput || {};

  // Nettoyer après affichage (flash = 1 seule requête)
  delete req.session.flash;
  delete req.session.oldInput;

  /**
   * Ajouter un message flash
   * @param {string} type - success | error | info
   * @param {string} message
   */
  req.flash = (type, message) => {
    if (!req.session.flash) {
      req.session.flash = {
        success: [],
        error: [],
        info: [],
      };
    }

    if (!req.session.flash[type]) {
      req.session.flash[type] = [];
    }

    req.session.flash[type].push(message);
  };

  /**
   * Sauvegarder les données du formulaire
   * Pour les renvoyer en cas d'erreur
   */
  req.saveOldInput = (data) => {
    req.session.oldInput = data;
  };

  next();
};