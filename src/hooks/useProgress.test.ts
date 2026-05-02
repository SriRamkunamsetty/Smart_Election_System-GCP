/**
 * @module useProgress.test
 * Tests for the useProgress hook — verifies completion tracking,
 * toggling, reset, and localStorage persistence.
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useProgress } from "./useProgress";

const STEP_IDS = ["step1", "step2", "step3"];

describe("useProgress", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with zero progress", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));
    expect(result.current.done).toBe(0);
    expect(result.current.total).toBe(3);
    expect(result.current.ratio).toBe(0);
    expect(result.current.nextStepId).toBe("step1");
  });

  it("toggles a step to completed", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));

    act(() => {
      result.current.toggle("step1");
    });

    expect(result.current.done).toBe(1);
    expect(result.current.completed.has("step1")).toBe(true);
    expect(result.current.nextStepId).toBe("step2");
  });

  it("toggles a step back to incomplete", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));

    act(() => {
      result.current.toggle("step1");
    });
    act(() => {
      result.current.toggle("step1");
    });

    expect(result.current.done).toBe(0);
    expect(result.current.completed.has("step1")).toBe(false);
  });

  it("reports 100% when all steps are complete", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));

    act(() => {
      STEP_IDS.forEach((id) => result.current.toggle(id));
    });

    expect(result.current.done).toBe(3);
    expect(result.current.ratio).toBe(1);
    expect(result.current.nextStepId).toBeNull();
  });

  it("resets all progress", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));

    act(() => {
      result.current.toggle("step1");
      result.current.toggle("step2");
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.done).toBe(0);
    expect(result.current.ratio).toBe(0);
    expect(result.current.nextStepId).toBe("step1");
  });

  it("persists progress to localStorage", () => {
    const { result } = renderHook(() => useProgress(STEP_IDS));

    act(() => {
      result.current.toggle("step2");
    });

    const stored = JSON.parse(localStorage.getItem("voting-oracle:progress") ?? "[]");
    expect(stored).toContain("step2");
  });

  it("handles empty step list gracefully", () => {
    const { result } = renderHook(() => useProgress([]));
    expect(result.current.done).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.ratio).toBe(0);
    expect(result.current.nextStepId).toBeNull();
  });
});
