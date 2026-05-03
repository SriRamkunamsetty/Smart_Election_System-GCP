/**
 * @module EvmPractice.test
 * Tests for the EVM simulator component —
 * validates candidate selection, button disabling, and reset.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EvmPractice } from "./EvmPractice";

vi.mock("@/lib/audio", () => ({
  playTap: vi.fn(),
  playSuccess: vi.fn(),
  playFailure: vi.fn(),
}));

vi.mock("@/components/SpeakButton", () => ({
  SpeakButton: () => null,
}));

describe("EvmPractice", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders all candidates and NOTA", () => {
    render(<EvmPractice />);
    expect(screen.getByText("Lotus Party")).toBeInTheDocument();
    expect(screen.getByText("Hand Party")).toBeInTheDocument();
    expect(screen.getByText("Broom Party")).toBeInTheDocument();
    expect(screen.getByText("Cycle Party")).toBeInTheDocument();
    expect(screen.getByText("NOTA")).toBeInTheDocument();
  });

  it("renders 5 vote buttons", () => {
    render(<EvmPractice />);
    const buttons = screen.getAllByRole("button", { name: /vote for/i });
    expect(buttons).toHaveLength(5);
  });

  it("disables buttons after a candidate is selected", () => {
    render(<EvmPractice />);
    fireEvent.click(screen.getByRole("button", { name: /vote for lotus party/i }));

    // Other buttons should be disabled
    const buttons = screen.getAllByRole("button", { name: /vote for/i });
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("resets to initial state on restart", () => {
    render(<EvmPractice />);
    fireEvent.click(screen.getByRole("button", { name: /vote for lotus party/i }));

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));

    // Buttons should be enabled again
    const buttons = screen.getAllByRole("button", { name: /vote for/i });
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it("has correct EVM title and description", () => {
    render(<EvmPractice />);
    expect(screen.getByText("EVM practice")).toBeInTheDocument();
    expect(screen.getByText(/try the machine/i)).toBeInTheDocument();
  });
});
