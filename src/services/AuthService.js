"use strict";

import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import UserRepository from "../repositories/UserRepository.js";

/**
 * AuthService
 */
class AuthService {
  async authenticate(loginDto) {
    // 1) Cherche l'utilisateur par email.
    const user = await UserRepository.findByEmail(loginDto.email);
    if (!user) {
      return { success: false, status: 401, message: "Email ou mot de passe incorrect." };
    }
    // 2) Compare le mot de passe brut avec le hash stocke.
    const isValidPassword = user.passwordHash
      ? await bcrypt.compare(loginDto.password, user.passwordHash)
      : false;
    if (!isValidPassword) {
      return { success: false, status: 401, message: "Email ou mot de passe incorrect." };
    }
    return { success: true, user };
  }

  async register(registerDto) {
    // Verifie qu'aucun compte n'existe deja avec cet email.
    const existingUser = await UserRepository.findByEmail(registerDto.email);

    if (existingUser) {
      return { success: false, status: 409, message: "Cet email est deja utilise." };
    }

    const password_hash = await bcrypt.hash(registerDto.password, 10);

    const createdUser = await UserRepository.create({
      full_name: registerDto.full_name,
      email: registerDto.email,
      password_hash,
      phone: registerDto.phone,
      role: registerDto.role,
      gdpr_consent: true,
    });

    return { success: true, user: createdUser };
  }

  async authenticateWithGoogle(profile) {
    // Google peut renvoyer plusieurs emails: on prend le premier.
    const email = profile?.emails?.[0]?.value?.toLowerCase();

    if (!email) {
      return {
        success: false,
        status: 400,
        message: "Compte Google invalide : email introuvable.",
      };
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      // Compte deja present: connexion directe.
      return { success: true, user: existingUser };
    }

    const fullName =
      profile?.displayName ||
      `${profile?.name?.givenName || "Utilisateur"} ${profile?.name?.familyName || "Google"}`.trim();

    // Le schema actuel impose password_hash, meme pour un compte OAuth.
    const password_hash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

    const createdUser = await UserRepository.create({
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
