/**
 * @module logger.test
 * Tests for the structured Cloud Logging utility.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as logger from "./logger";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("logs info messages via console.log", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logger.info("Test info message", { component: "test" });
      expect(spy).toHaveBeenCalledWith(
        "[INFO] Test info message",
        expect.objectContaining({ component: "test" }),
      );
    });

    it("logs warnings via console.warn", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("Test warning");
      expect(spy).toHaveBeenCalledWith("[WARNING] Test warning", "");
    });

    it("logs errors via console.error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Test error", { stack: "trace" });
      expect(spy).toHaveBeenCalledWith(
        "[ERROR] Test error",
        expect.objectContaining({ stack: "trace" }),
      );
    });

    it("logs debug messages via console.debug", () => {
      const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
      logger.debug("Debug message");
      expect(spy).toHaveBeenCalledWith("[DEBUG] Debug message", "");
    });
  });

  describe("production mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("writes JSON to stdout for info logs", () => {
      const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      logger.info("Production info", { requestId: "abc" });
      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.severity).toBe("INFO");
      expect(parsed.message).toBe("Production info");
      expect(parsed.requestId).toBe("abc");
      expect(parsed.timestamp).toBeDefined();
    });

    it("writes JSON to stderr for error logs", () => {
      const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
      logger.error("Production error");
      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());
      expect(parsed.severity).toBe("ERROR");
    });
  });
});
