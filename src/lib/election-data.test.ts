/**
 * @module election-data.test
 * Tests for the static election data module —
 * validates step schema, data integrity, and date calculation.
 */
import { describe, it, expect } from "vitest";
import { STEPS, NEXT_ELECTION_DATE } from "./election-data";

describe("election-data", () => {
  describe("STEPS", () => {
    it("has at least 5 steps", () => {
      expect(STEPS.length).toBeGreaterThanOrEqual(5);
    });

    it("each step has required fields", () => {
      for (const step of STEPS) {
        expect(step.id).toBeTruthy();
        expect(step.title).toBeTruthy();
        expect(step.short).toBeTruthy();
        expect(step.body).toBeTruthy();
        expect(typeof step.estimatedMinutes).toBe("number");
        expect(step.estimatedMinutes).toBeGreaterThan(0);
      }
    });

    it("step IDs are unique", () => {
      const ids = STEPS.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("contains the critical steps: eligibility, register, vote", () => {
      const ids = STEPS.map((s) => s.id);
      expect(ids).toContain("eligibility");
      expect(ids).toContain("register");
      expect(ids).toContain("vote");
    });

    it("steps with links have valid URLs", () => {
      for (const step of STEPS) {
        if (step.link) {
          expect(step.link.label).toBeTruthy();
          expect(step.link.href).toMatch(/^https?:\/\//);
        }
      }
    });
  });

  describe("NEXT_ELECTION_DATE", () => {
    it("is a valid Date object", () => {
      expect(NEXT_ELECTION_DATE).toBeInstanceOf(Date);
    });

    it("is in the future relative to the current year", () => {
      expect(NEXT_ELECTION_DATE.getFullYear()).toBeGreaterThanOrEqual(new Date().getFullYear());
    });
  });
});
