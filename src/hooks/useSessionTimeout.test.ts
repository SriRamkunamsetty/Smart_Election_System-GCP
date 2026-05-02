/**
 * @module useSessionTimeout.test
 * Tests for the privacy-friendly session timeout hook.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSessionTimeout } from "./useSessionTimeout";

describe("useSessionTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires the timeout callback after the specified period of inactivity", () => {
    const onTimeout = vi.fn();

    renderHook(() => useSessionTimeout(5000, onTimeout));

    // The hook checks every 5000ms via setInterval. We need to advance
    // past the timeout (5s) AND ensure the interval fires at least once.
    // Advance by 11s to guarantee the check fires after timeout expires.
    act(() => {
      vi.advanceTimersByTime(11000);
    });

    expect(onTimeout).toHaveBeenCalled();
  });

  it("does not fire prematurely before the timeout period", () => {
    const onTimeout = vi.fn();

    renderHook(() => useSessionTimeout(10000, onTimeout));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("resets the timer on user activity events", () => {
    const onTimeout = vi.fn();

    renderHook(() => useSessionTimeout(5000, onTimeout));

    // Simulate user activity before timeout
    act(() => {
      vi.advanceTimersByTime(3000);
      window.dispatchEvent(new Event("click"));
    });

    // Advance another 3s (total 6s since start, but only 3s since activity)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
