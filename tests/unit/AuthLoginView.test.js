"use strict";

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ejs from "ejs";

const template = readFileSync("src/views/pages/auth/login.ejs", "utf8");

function renderLogin(googleAuthAvailable) {
  return ejs.render(template, {
    csrfToken: "csrf-token",
    error: null,
    formData: { email: "" },
    currentUser: null,
    googleAuthAvailable,
  });
}

describe("login view", () => {
  it("affiche un lien Google utilisable lorsque OAuth est configuré", () => {
    const html = renderLogin(true);

    expect(html).toContain('href="/auth/google"');
    expect(html).toContain('aria-label="Continuer avec Google"');
    expect(html).toContain("Continuer avec Google");
  });

  it("affiche une explication plutôt qu'un lien mort lorsque OAuth est absent", () => {
    const html = renderLogin(false);

    expect(html).not.toContain('href="/auth/google"');
    expect(html).toContain("La connexion Google");
    expect(html).toContain("disabled");
  });
});
