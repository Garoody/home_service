"use strict";

/**
 * Tests unitaires de base pour les comportements statiques
 * qui ne necessitent pas une vraie base PostgreSQL.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("../../src/config/database.js", () => ({
  default: {
    query: queryMock,
  },
}));

const { default: ServiceService } = await import("../../src/services/ServiceService.js");

describe("ServiceService.hasProviderDetailsColumns", () => {
  beforeEach(() => {
    ServiceService._hasProviderDetailsColumns = null;
    vi.clearAllMocks();
  });

  it("retourne true quand les quatre colonnes metier existent", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ count: 4 }],
    });

    const result = await ServiceService.hasProviderDetailsColumns();

    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("met le resultat en cache apres le premier appel", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ count: 4 }],
    });

    const firstResult = await ServiceService.hasProviderDetailsColumns();
    const secondResult = await ServiceService.hasProviderDetailsColumns();

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(true);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
