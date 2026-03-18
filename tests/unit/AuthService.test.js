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

vi.mock("../../src/repositories/UserRepository.js", () => ({
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
      message: "Email ou mot de passe incorrect.",
    });
  });

  it("bloque un compte suspendu avant la verification du mot de passe", async () => {
    findByEmailMock.mockResolvedValueOnce({
      accountStatus: "suspended",
      passwordHash: "hash",
    });

    const result = await AuthService.authenticate({
      email: "user@example.com",
      password: "secret",
    });

    expect(compareMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      status: 403,
      message: "Votre compte est suspendu. Contactez l'administration si besoin.",
    });
  });
});
