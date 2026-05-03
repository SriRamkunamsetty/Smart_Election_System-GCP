/**
 * @module use-mobile.test
 * Tests for the useIsMobile responsive hook.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_event: string, fn: () => void) => {
        listeners.push(fn);
      },
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for desktop widths", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true for mobile widths", () => {
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when window is resized", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
      listeners.forEach((fn) => fn());
    });

    expect(result.current).toBe(true);
  });
});
