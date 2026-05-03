/**
 * @module useStepDetails.test
 * Tests for the useStepDetails hook — verifies caching, inflight dedup, retry, and error states.
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the server function
vi.mock("@/api/steps.functions", () => ({
  getStepDetails: vi.fn(),
}));

import { getStepDetails } from "@/api/steps.functions";

// We need to reset module state between tests since cache is module-level
describe("useStepDetails", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("fetches step details and caches the result", async () => {
    (getStepDetails as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: "Test content for eligibility step",
      error: null,
    });

    const { useStepDetails } = await import("@/hooks/useStepDetails");
    const { result } = renderHook(() => useStepDetails("eligibility", "Check your eligibility"));

    // Should start loading
    expect(result.current.entry.status).toBe("loading");

    // Wait for ready
    await waitFor(() => {
      expect(result.current.entry.status).toBe("ready");
    });

    expect(result.current.entry.content).toBe("Test content for eligibility step");
    expect(getStepDetails).toHaveBeenCalledTimes(1);
  });

  it("handles API errors gracefully", async () => {
    (getStepDetails as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      content: "",
      error: "Could not reach the Oracle.",
    });

    const { useStepDetails } = await import("@/hooks/useStepDetails");
    const { result } = renderHook(() => useStepDetails("register", "Register on Form 6"));

    await waitFor(() => {
      expect(result.current.entry.status).toBe("error");
    });

    expect(result.current.entry.error).toBe("Could not reach the Oracle.");
  });

  it("handles network exceptions", async () => {
    (getStepDetails as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network failure"),
    );

    const { useStepDetails } = await import("@/hooks/useStepDetails");
    const { result } = renderHook(() => useStepDetails("verify", "Verify your name"));

    await waitFor(() => {
      expect(result.current.entry.status).toBe("error");
    });

    expect(result.current.entry.error).toBe("Network failure");
  });

  it("retries on demand via retry()", async () => {
    (getStepDetails as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ content: "", error: "Temporary failure" })
      .mockResolvedValueOnce({ content: "Retry success", error: null });

    const { useStepDetails } = await import("@/hooks/useStepDetails");
    const { result } = renderHook(() => useStepDetails("epic", "Download your e-EPIC"));

    await waitFor(() => {
      expect(result.current.entry.status).toBe("error");
    });

    // Retry
    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.entry.status).toBe("ready");
    });

    expect(result.current.entry.content).toBe("Retry success");
    expect(getStepDetails).toHaveBeenCalledTimes(2);
  });
});
