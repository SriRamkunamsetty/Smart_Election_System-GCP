import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Timeline } from "./Timeline";
import type { Step } from "@/lib/election-data";
import * as useStepDetailsModule from "@/hooks/useStepDetails";

vi.mock("@/hooks/useStepDetails", () => ({
  useStepDetails: vi.fn(),
}));

const mockSteps = [
  { id: "1", title: "Step 1", short: "Desc 1", estimatedMinutes: 5, body: "Fallback body 1" },
  { id: "2", title: "Step 2", short: "Desc 2", estimatedMinutes: 10, body: "Fallback body 2" },
];

describe("Timeline", () => {
  it("renders steps and toggles accordion properly", () => {
    vi.spyOn(useStepDetailsModule, "useStepDetails").mockReturnValue({
      entry: { status: "loading" },
      retry: vi.fn(),
    });

    const onExpand = vi.fn();
    const onToggleComplete = vi.fn();

    const { rerender } = render(
      <Timeline
        steps={mockSteps as Step[]}
        completed={new Set(["1"])}
        activeId="2"
        expandedId={null}
        onToggleComplete={onToggleComplete}
        onExpand={onExpand}
      />,
    );

    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();

    // Not expanded
    expect(screen.queryByText("Live from the Oracle")).not.toBeInTheDocument();

    // Click to expand Step 2
    fireEvent.click(screen.getByRole("button", { name: /desc 2/i }));
    expect(onExpand).toHaveBeenCalledWith("2");

    // Re-render with expandedId = '2'
    rerender(
      <Timeline
        steps={mockSteps as Step[]}
        completed={new Set(["1"])}
        activeId="2"
        expandedId="2"
        onToggleComplete={onToggleComplete}
        onExpand={onExpand}
      />,
    );

    expect(screen.getByText("Live from the Oracle")).toBeInTheDocument();
  });

  it("handles useStepDetails hooks loading, ready, error", () => {
    const retryFn = vi.fn();
    // Start with error
    const spy = vi.spyOn(useStepDetailsModule, "useStepDetails").mockReturnValue({
      entry: { status: "error", error: "Test error message" },
      retry: retryFn,
    });

    const { rerender } = render(
      <Timeline
        steps={mockSteps as Step[]}
        completed={new Set()}
        activeId="1"
        expandedId="1"
        onToggleComplete={vi.fn()}
        onExpand={vi.fn()}
      />,
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(retryFn).toHaveBeenCalled();

    // Now it's ready
    spy.mockReturnValue({
      entry: { status: "ready", content: "Here is some live content" },
      retry: retryFn,
    });

    rerender(
      <Timeline
        steps={mockSteps as Step[]}
        completed={new Set()}
        activeId="1"
        expandedId="1"
        onToggleComplete={vi.fn()}
        onExpand={vi.fn()}
      />,
    );

    expect(screen.getByText("Here is some live content")).toBeInTheDocument();
    expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
  });
});
