import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Countdown } from "./Countdown";

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders countdown tiles", () => {
    const targetDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2); // 2 days from now
    render(<Countdown date={targetDate} />);
    
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("Hrs")).toBeInTheDocument();
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("Sec")).toBeInTheDocument();
  });

  it("updates countdown every second", () => {
    const targetDate = new Date(Date.now() + 1000 * 10); // 10 seconds from now
    render(<Countdown date={targetDate} />);
    
    expect(screen.getByText("10")).toBeInTheDocument();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText("09")).toBeInTheDocument();
  });

  it("reaches zero when target date passes", () => {
    const targetDate = new Date(Date.now() + 1000 * 5);
    render(<Countdown date={targetDate} />);
    
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    
    expect(screen.getAllByText("00")).toHaveLength(4);
  });
});
