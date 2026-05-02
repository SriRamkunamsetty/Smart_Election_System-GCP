/**
 * @module audio.test
 * Tests for the audio utility module — speech synthesis helpers and
 * the WebAudio-based sound effects.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { speak, stopSpeaking, isSpeechSupported } from "./audio";

// Mock SpeechSynthesisUtterance since jsdom does not provide it
class MockUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  constructor(text: string) {
    this.text = text;
  }
}
(globalThis as Record<string, unknown>).SpeechSynthesisUtterance = MockUtterance;

describe("audio utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("isSpeechSupported", () => {
    it("returns true when speechSynthesis is available", () => {
      Object.defineProperty(window, "speechSynthesis", {
        value: { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] },
        writable: true,
        configurable: true,
      });
      expect(isSpeechSupported()).toBe(true);
    });

    it("returns false when speechSynthesis is undefined", () => {
      Object.defineProperty(window, "speechSynthesis", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isSpeechSupported()).toBe(false);
    });
  });

  describe("speak", () => {
    it("calls speechSynthesis.speak with an utterance", () => {
      const mockSpeak = vi.fn();
      const mockCancel = vi.fn();
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak: mockSpeak,
          cancel: mockCancel,
          getVoices: () => [],
        },
        writable: true,
        configurable: true,
      });

      speak("Hello world");

      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalledTimes(1);
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance).toBeInstanceOf(MockUtterance);
      expect(utterance.text).toBe("Hello world");
    });
  });

  describe("stopSpeaking", () => {
    it("calls speechSynthesis.cancel", () => {
      const mockCancel = vi.fn();
      Object.defineProperty(window, "speechSynthesis", {
        value: { cancel: mockCancel },
        writable: true,
        configurable: true,
      });

      stopSpeaking();
      expect(mockCancel).toHaveBeenCalled();
    });
  });
});
