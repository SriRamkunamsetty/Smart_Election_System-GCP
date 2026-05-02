import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpeakButton, stripMarkdown } from "./SpeakButton";
import * as audioModule from "@/lib/audio";

vi.mock("@/lib/audio", () => ({
  isSpeechSupported: vi.fn(),
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
}));

describe("SpeakButton", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (audioModule.isSpeechSupported as ReturnType<typeof vi.fn>).mockReturnValue(true);
    // Mock window.speechSynthesis to avoid interval errors
    Object.defineProperty(window, "speechSynthesis", {
      value: { speaking: false },
      writable: true,
    });
  });

  describe("stripMarkdown", () => {
    it("strips markdown formatting to produce clean speech", () => {
      expect(stripMarkdown("# Hello World")).toBe("Hello World");
      expect(stripMarkdown("**Bold** and *Italic*")).toBe("Bold and Italic");
      expect(stripMarkdown("Check [this link](https://example.com)")).toBe("Check this link");
      expect(stripMarkdown("`inline code`")).toBe("inline code");
      expect(stripMarkdown("- Item 1\n- Item 2")).toBe("Item 1 Item 2");
    });
  });

  it("renders correctly when speech is supported", () => {
    render(<SpeakButton text="Hello World" />);
    expect(screen.getByRole("button", { name: /read this aloud/i })).toBeInTheDocument();
  });

  it("does not render when speech is unsupported", () => {
    (audioModule.isSpeechSupported as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<SpeakButton text="Hello World" />);
    expect(screen.queryByRole("button", { name: /read this aloud/i })).not.toBeInTheDocument();
  });

  it("toggles speech on click", () => {
    render(<SpeakButton text="Hello World" />);
    const btn = screen.getByRole("button", { name: /read this aloud/i });

    // Speak
    fireEvent.click(btn);
    expect(audioModule.speak).toHaveBeenCalledWith("Hello World");

    // Stop speaking
    fireEvent.click(btn);
    expect(audioModule.stopSpeaking).toHaveBeenCalled();
  });

  it("stops speaking on unmount", () => {
    const { unmount } = render(<SpeakButton text="Hello" />);
    unmount();
    expect(audioModule.stopSpeaking).toHaveBeenCalled();
  });
});
