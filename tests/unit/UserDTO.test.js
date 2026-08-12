"use strict";

import { describe, expect, it } from "vitest";
import { toRegisterDTO } from "../../src/dto/UserDTO.js";

describe("toRegisterDTO", () => {
  it("construit le nom complet de compatibilité depuis le prénom et le nom", () => {
    const dto = toRegisterDTO({
      first_name: "  Alice ",
      last_name: " Martin  ",
      phone: "0612345678",
      email: " ALICE@EXAMPLE.COM ",
      password: "motdepasse123",
      gdpr_consent: true,
    });

    expect(dto).toMatchObject({
      first_name: "Alice",
      last_name: "Martin",
      full_name: "Alice Martin",
      email: "alice@example.com",
      role: "client",
      gdpr_consent: true,
    });
  });
});
