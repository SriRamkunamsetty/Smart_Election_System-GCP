import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@google/genai", () => {
  const mockGenerateContent = vi.fn();
  class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    _mockGenerateContent: mockGenerateContent,
  };
});

// @ts-ignore - _mockGenerateContent is only available in tests
import { _mockGenerateContent } from "@google/genai";
import { visionHandler } from "./vision.functions";

vi.mock("@/lib/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
}));

describe("vision server function", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key-1234567890" };
  });

  const mockImage = "data:image/jpeg;base64," + "a".repeat(100);

  it("returns verified document details on success", async () => {
    const mockRes = {
      text: JSON.stringify({
        ok: true,
        doc: "aadhaar",
        confidence: 0.95,
        reason: "Clear Aadhaar card visible.",
        tips: ["Good lighting"]
      })
    };

    (_mockGenerateContent as any).mockResolvedValue(mockRes);

    const result = await visionHandler({ data: { image: mockImage, docHint: "aadhaar" } });
    
    expect(result.ok).toBe(true);
    expect(result.doc).toBe("aadhaar");
    expect(result.confidence).toBe(0.95);
  });

  it("handles malformed JSON from AI", async () => {
    (_mockGenerateContent as any).mockResolvedValue({
      text: "not a json"
    });

    const result = await visionHandler({ data: { image: mockImage, docHint: "any" } });
    
    expect(result.ok).toBe(false);
    expect(result.doc).toBe("unknown");
  });

  it("handles missing API key", async () => {
    process.env.GEMINI_API_KEY = "";
    const result = await visionHandler({ data: { image: mockImage, docHint: "any" } });
    expect(result.error).toBe("no_key");
  });

  it("handles upstream AI exceptions", async () => {
    (_mockGenerateContent as any).mockRejectedValue(new Error("AI Crash"));

    const result = await visionHandler({ data: { image: mockImage, docHint: "any" } });
    
    expect(result.ok).toBe(false);
    expect(result.error).toBe("network");
  });
});
