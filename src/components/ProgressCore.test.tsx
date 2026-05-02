import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProgressCore } from "./ProgressCore";

describe("ProgressCore", () => {
  it("renders correct percentage and steps count", () => {
    render(<ProgressCore ratio={0.5} done={3} total={6} />);
    
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("3 of 6 steps")).toBeInTheDocument();
  });

  it("renders 0% correctly", () => {
    render(<ProgressCore ratio={0} done={0} total={6} />);
    
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 of 6 steps")).toBeInTheDocument();
  });

  it("renders 100% correctly", () => {
    render(<ProgressCore ratio={1} done={6} total={6} />);
    
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("6 of 6 steps")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<ProgressCore ratio={0.75} done={3} total={4} />);
    
    expect(screen.getByLabelText("Progress: 75 percent")).toBeInTheDocument();
  });
});
