"use strict";

/**
 * Tests unitaires de base pour les regles d'authentification.
 * On mocke les dependances externes pour verifier uniquement
 * le comportement du service.
 */

import { describe, expect, it, vi } from "vitest";
import { setupUnitTestEnvironment } from "../bootstrap.js";

const compareMock = vi.fn();
const hashMock = vi.fn();
const findByEmailMock = vi.fn();
const createMock = vi.fn();

vi.mock("bcrypt", () => ({
  default: {
    compare: compareMock,
    hash: hashMock,
  },
}));

vi.mock("../../src/repositories/PgUserRepository.js", () => ({
  default: {
    findByEmail: findByEmailMock,
    create: createMock,
  },
}));

const { default: AuthService } = await import("../../src/services/AuthService.js");

setupUnitTestEnvironment();

describe("AuthService.authenticate", () => {
  it("retourne une erreur si l'utilisateur est introuvable", async () => {
    findByEmailMock.mockResolvedValueOnce(null);

    const result = await AuthService.authenticate({
      email: "absent@example.com",
      password: "secret",
    });

    expect(result).toEqual({
      success: false,
      status: 401,
      message: "Email ou mot de passe invalide.",
    });
  });

  it("retourne un message generique pour un compte suspendu", async () => {
    findByEmailMock.mockResolvedValueOnce({
      suspendedAt: new Date("2026-03-27T10:00:00Z"),
      passwordHash: "hash",
    });

    const result = await AuthService.authenticate({
      email: "user@example.com",
      password: "secret",
    });

    expect(compareMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      status: 401,
      message: "Email ou mot de passe invalide.",
    });
  });

  it("retourne une erreur generique si le mot de passe est faux", async () => {
    findByEmailMock.mockResolvedValueOnce({
      passwordHash: "hash",
    });
    compareMock.mockResolvedValueOnce(false);

    const result = await AuthService.authenticate({
      email: "user@example.com",
      password: "mauvais-mot-de-passe",
    });

    expect(compareMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: false,
      status: 401,
      message: "Email ou mot de passe invalide.",
    });
  });
});

describe("AuthService.register", () => {
  it("enregistre le prénom, le nom et le nom complet de compatibilité", async () => {
    const createdUser = { id: "user-id" };
    findByEmailMock.mockResolvedValueOnce(null);
    hashMock.mockResolvedValueOnce("password-hash");
    createMock.mockResolvedValueOnce(createdUser);

    const result = await AuthService.register({
      first_name: "Alice",
      last_name: "Martin",
      full_name: "Alice Martin",
      email: "alice@example.com",
      password: "motdepasse123",
      phone: "0612345678",
      role: "client",
      gdpr_consent: true,
    });

    expect(createMock).toHaveBeenCalledWith({
      first_name: "Alice",
      last_name: "Martin",
      full_name: "Alice Martin",
      email: "alice@example.com",
      password_hash: "password-hash",
      phone: "0612345678",
      role: "client",
      gdpr_consent: true,
    });
    expect(result).toEqual({ success: true, user: createdUser });
  });
});
