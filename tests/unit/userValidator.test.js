"use strict";

import { describe, expect, it } from "vitest";
import {
  validateRegisterPayload,
  validateUserProfilePayload,
} from "../../src/validators/userValidator.js";

describe("validateRegisterPayload", () => {
  it("rejette un email qui ne respecte pas le format attendu par la base", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "0123456789",
      email: "kjdb:f@d",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Email invalide.");
  });

  it("accepte un email complet avec domaine valide", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "0123456789",
      email: "user@example.com",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe("user@example.com");
  });

  it("accepte un email accentue si le format reste valide", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "0123456789",
      email: "élise@exemple.fr",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(true);
    expect(result.data.email).toBe("élise@exemple.fr");
  });

  it("rejette un telephone qui contient autre chose que des chiffres", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "06 12 34 56 78",
      email: "user@example.com",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Seuls les chiffres sont autorises pour le telephone.");
  });

  it("rejette un telephone qui ne contient pas exactement 10 chiffres et ne commence pas par 0", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "44256",
      email: "user@example.com",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Le telephone doit contenir exactement 10 chiffres et commencer par 0.");
  });

  it("accepte un telephone francais sur 10 chiffres", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "0612345678",
      email: "user@example.com",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(true);
  });

  it("accepte un telephone vide car le champ reste optionnel", () => {
    const result = validateRegisterPayload({
      full_name: "Utilisateur Test",
      phone: "",
      email: "user@example.com",
      password: "motdepasse123",
      gdpr_consent: "on",
    });

    expect(result.success).toBe(true);
  });
});

describe("validateUserProfilePayload", () => {
  it("rejette aussi les lettres dans le telephone du profil", () => {
    const result = validateUserProfilePayload({
      full_name: "Utilisateur Test",
      phone: "abc123",
      address: "",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Seuls les chiffres sont autorises pour le telephone.");
  });

  it("rejette aussi un telephone trop court dans le profil", () => {
    const result = validateUserProfilePayload({
      full_name: "Utilisateur Test",
      phone: "44256",
      address: "",
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Le telephone doit contenir exactement 10 chiffres et commencer par 0.");
  });
});
