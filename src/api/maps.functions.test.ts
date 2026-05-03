/**
 * @module maps.functions.test
 * Tests for the Google Maps API key provider server function.
 * Validates that the key is returned from environment and gracefully handles missing values.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock createServerFn to return a simple handler
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    handler: (fn: () => Promise<{ key: string }>) => fn,
  }),
}));

describe("maps.functions (getMapsKey)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns the Google Maps API key from environment", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-maps-key-123";
    const { getMapsKey } = await import("@/api/maps.functions");
    const result = await getMapsKey();
    expect(result.key).toBe("test-maps-key-123");
  });

  it("returns empty string when GOOGLE_MAPS_API_KEY is not set", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    const { getMapsKey } = await import("@/api/maps.functions");
    const result = await getMapsKey();
    expect(result.key).toBe("");
  });
});
