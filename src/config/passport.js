"use strict";

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import authService from "../services/AuthService.js";

// Ce fichier centralise toute la configuration de Passport.
// On le place dans src/config car son role n'est pas de gérer une route
// ou de contenir de la logique metier: il sert uniquement a brancher
// une librairie externe sur l'application.
//
// Pourquoi avoir un passport.js ?
// Passport est le point d'entree de l'authentification OAuth Google.
// Sans ce fichier, il faudrait reconfigurer la strategie Google dans les
// routes ou les controllers, ce qui melangerait la config technique avec
// le code applicatif. Ici, on garde une separation propre :
// - les routes declenchent l'authentification
// - le controller gère la suite de la connexion
// - le service auth gère la liaison avec l'utilisateur local
// - ce fichier configure Passport une seule fois

// Evite d'enregistrer la strategie plusieurs fois en dev ou en hot-reload.
// Sans cette garde, Express/Passport pourrait empiler plusieurs strategies
// identiques et provoquer des comportements difficiles a deboguer.
let isConfigured = false;

export function isGoogleOAuthEnabled() {
  return Boolean(
    String(process.env.GOOGLE_CLIENT_ID || "").trim() &&
      String(process.env.GOOGLE_CLIENT_SECRET || "").trim()
  );
}

export function configurePassport() {
  // Si la config a déjà été faite, on renvoie simplement l'instance existante.
  // Cela permet d'appeler configurePassport() au demarrage sans risque.
  if (isConfigured) return passport;

  // Ces variables viennent du .env et correspondent aux identifiants
  // fournis par Google pour autoriser l'application a utiliser OAuth.
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";

  // Si la configuration est incomplete, on laisse Passport disponible
  // mais sans activer Google OAuth. L'application continue donc de tourner
  // sans planter, simplement avec la connexion Google desactivee.
  if (!isGoogleOAuthEnabled()) {
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        // Protège le retour OAuth en vérifiant un état conservé en session.
        state: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Google renvoie le profil OAuth de l'utilisateur authentifie.
          // On delegue ensuite au service metier la logique applicative :
          // retrouver un utilisateur local existant ou en créer un nouveau.
          const result = await authService.authenticateWithGoogle(profile);

          // done(null, user) indique a Passport que l'authentification a reussi
          // et que cet utilisateur doit être transmis a la suite du flux.
          return done(null, result.user);
        } catch (error) {
          // En cas d'erreur technique ou metier, Passport interrompra
          // le processus d'authentification et laissera la route gérer l'echec.
          return done(error);
        }
      }
    )
  );

  // Marque la configuration comme terminée pour eviter toute double initialisation.
  isConfigured = true;
  return passport;
}

// On exporte aussi l'instance brute pour que le reste de l'application
// puisse utiliser passport.authenticate(...) dans les routes si besoin.
export { passport };
