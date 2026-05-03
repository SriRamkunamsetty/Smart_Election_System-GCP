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

// @ts-ignore
import { _mockGenerateContent } from "@google/genai";
import { stepsHandler } from "./steps.functions";

vi.mock("@/lib/logger", () => ({
  error: vi.fn(),
  info: vi.fn(),
}));

describe("steps server function", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: "test-key-1234567890" };
  });

  it("returns AI generated content for a valid step", async () => {
    (_mockGenerateContent as any).mockResolvedValue({
      text: "AI generated guide content",
    });

    const result = await stepsHandler({ data: { stepId: "eligibility", stepTitle: "Eligibility" } });
    
    expect(result.content).toBe("AI generated guide content");
    expect(result.error).toBeNull();
  });

  it("handles missing API key", async () => {
    process.env.GEMINI_API_KEY = "";
    
    const result = await stepsHandler({ data: { stepId: "eligibility", stepTitle: "Eligibility" } });
    
    expect(result.error).toBe("AI is not configured.");
  });

  it("handles AI errors gracefully", async () => {
    (_mockGenerateContent as any).mockRejectedValue(new Error("AI error"));

    const result = await stepsHandler({ data: { stepId: "eligibility", stepTitle: "Eligibility" } });
    
    expect(result.error).toBe("Could not reach the Oracle. Check server logs.");
  });
});
