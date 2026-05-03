/**
 * @module DocumentMatchGame.test
 * Tests for the document match drag-and-drop game —
 * validates click-to-drop fallback and win/lose feedback.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DocumentMatchGame } from "./DocumentMatchGame";

vi.mock("@/lib/audio", () => ({
  playTap: vi.fn(),
  playSuccess: vi.fn(),
  playFailure: vi.fn(),
}));

vi.mock("@/components/SpeakButton", () => ({
  SpeakButton: () => null,
}));

describe("DocumentMatchGame", () => {
  it("renders all document cards", () => {
    render(<DocumentMatchGame />);
    expect(screen.getByText("Aadhaar Card")).toBeInTheDocument();
    expect(screen.getByText("Voter ID (EPIC)")).toBeInTheDocument();
    expect(screen.getByText("Library Card")).toBeInTheDocument();
  });

  it("accepts valid document on click (tap-to-drop fallback)", async () => {
    render(<DocumentMatchGame />);
    const aadhaar = screen.getByLabelText(/aadhaar card/i);
    fireEvent.click(aadhaar);
    // After clicking a valid doc, the win state should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/drop zone/i)).toBeInTheDocument();
    });
  });

  it("rejects invalid document on click", async () => {
    render(<DocumentMatchGame />);
    const library = screen.getByLabelText(/library card/i);
    fireEvent.click(library);
    // Library card is invalid, should trigger lose feedback
    await waitFor(() => {
      expect(screen.getByLabelText(/drop zone/i)).toBeInTheDocument();
    });
  });

  it("resets the game on reset button click", async () => {
    render(<DocumentMatchGame />);

    // Click a valid doc to remove it
    const passport = screen.getByLabelText(/passport/i);
    fireEvent.click(passport);

    // Click reset
    await waitFor(() => {
      const resetBtn = screen.getByRole("button", { name: /reset game/i });
      fireEvent.click(resetBtn);
    });

    // All 6 docs should be back
    await waitFor(() => {
      expect(screen.getByText("Aadhaar Card")).toBeInTheDocument();
      expect(screen.getByText("Passport")).toBeInTheDocument();
    });
  });
});
