"use strict";

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import authService from "../services/AuthService.js";

// Evite d'enregistrer la strategie plusieurs fois en dev/hot-reload.
let isConfigured = false;

export function configurePassport() {
  if (isConfigured) return passport;

  // Variables OAuth attendues depuis .env
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";

  // On n'active Google OAuth que si la configuration est complete.
  if (!clientID || !clientSecret) {
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Lie l'utilisateur Google a un compte local (ou le cree).
          const result = await authService.authenticateWithGoogle(profile);
          return done(null, result.user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  isConfigured = true;
  return passport;
}

export { passport };
