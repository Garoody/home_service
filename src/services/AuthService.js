"use strict";

import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import PgUserRepository from "../repositories/PgUserRepository.js";

const INVALID_LOGIN_MESSAGE = "Email ou mot de passe invalide.";

class AuthService {
  // Authentifie un utilisateur via email et mot de passe.
  async authenticate(loginDto) {
    const user = await PgUserRepository.findByEmail(loginDto.email);
    if (!user) {
      return { success: false, status: 401, message: INVALID_LOGIN_MESSAGE };
    }
    if (user.deletedByAdminAt) {
      return { success: false, status: 401, message: INVALID_LOGIN_MESSAGE };
    }
    if (user.bannedAt) {
      return { success: false, status: 401, message: INVALID_LOGIN_MESSAGE };
    }
    if (user.suspendedAt) {
      return { success: false, status: 401, message: INVALID_LOGIN_MESSAGE };
    }
    // Compare le mot de passe saisi avec le hash stocke en base.
    const isValidPassword = user.passwordHash
      ? await bcrypt.compare(loginDto.password, user.passwordHash)
      : false;
    if (!isValidPassword) {
      return { success: false, status: 401, message: INVALID_LOGIN_MESSAGE };
    }
    return { success: true, user };
  }

  // Cree un compte local apres verification de l'email.
  async register(registerDto) {
    const existingUser = await PgUserRepository.findByEmail(registerDto.email);

    if (existingUser) {
      return { success: false, status: 409, message: "Cet email est déjà utilise." };
    }

    const password_hash = await bcrypt.hash(registerDto.password, 10);

    const createdUser = await PgUserRepository.create({
      full_name: registerDto.full_name,
      email: registerDto.email,
      password_hash,
      phone: registerDto.phone,
      role: registerDto.role,
      gdpr_consent: true,
    });
    return { success: true, user: createdUser };
  }

  // Associe un compte Google a un utilisateur local existant ou nouveau.
  async authenticateWithGoogle(profile) {
    const email = profile?.emails?.[0]?.value?.toLowerCase();

    if (!email) {
      return {
        success: false,
        status: 400,
        message: "Compte Google invalide : email introuvable.",
      };
    }

    const existingUser = await PgUserRepository.findByEmail(email);
    if (existingUser) {
      return { success: true, user: existingUser };
    }

    const fullName =
      profile?.displayName ||
      `${profile?.name?.givenName || "Utilisateur"} ${profile?.name?.familyName || "Google"}`.trim();

    // Le schema actuel impose un password_hash, même pour un compte OAuth.
    const password_hash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

    const createdUser = await PgUserRepository.create({
      full_name: fullName,
      email,
      password_hash,
      phone: null,
      role: "client",
      gdpr_consent: true,
    });

    return { success: true, user: createdUser };
  }
}

export default new AuthService();
