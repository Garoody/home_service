"use strict";

/**
 * Point d'entree commun des tests.
 * Les helpers partages peuvent etre centralises ici
 * pour eviter de dupliquer la preparation entre plusieurs suites.
 */

import { beforeEach, vi } from "vitest";

export function setupUnitTestEnvironment() {
  beforeEach(() => {
    vi.clearAllMocks();
  });
}
