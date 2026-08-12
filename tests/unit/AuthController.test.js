"use strict";

import { describe, expect, it, vi } from "vitest";
import { setupUnitTestEnvironment } from "../bootstrap.js";

const authenticateMock = vi.fn();
const registerMock = vi.fn();

vi.mock("../../src/services/AuthService.js", () => ({
  default: {
    authenticate: authenticateMock,
    register: registerMock,
  },
}));

const { default: AuthController } = await import("../../src/controllers/auth/AuthController.js");

setupUnitTestEnvironment();

function createResponse() {
  const res = {
    locals: { csrfToken: "csrf-token" },
    status: vi.fn(),
    render: vi.fn(),
    redirect: vi.fn(),
  };

  res.status.mockReturnValue(res);
  return res;
}

describe("AuthController.register", () => {
  it("re-affiche le formulaire si une contrainte email remonte de PostgreSQL", async () => {
    registerMock.mockRejectedValueOnce({
      code: "23514",
      constraint: "chk_email_format",
    });

    const req = {
      body: {
        first_name: "Utilisateur",
        last_name: "Test",
        phone: "0123456789",
        email: "user@example.com",
        password: "motdepasse123",
        gdpr_consent: "on",
      },
      session: {},
      flash: vi.fn(),
    };
    const res = createResponse();

    await AuthController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith(
      "pages/auth/register",
      expect.objectContaining({
        title: "Inscription - HomeService",
        csrfToken: "csrf-token",
        error: "Email invalide.",
        formData: expect.objectContaining({
          first_name: "Utilisateur",
          last_name: "Test",
          phone: "0123456789",
          email: "user@example.com",
          gdpr_consent: true,
        }),
      })
    );
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
