/**
 * @module analytics.test
 * Tests for the Google Analytics 4 custom event helpers.
 * Verifies that events are sent via gtag when available
 * and are no-ops when gtag is missing (SSR, ad-blockers).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  trackModeSwitch,
  trackStepCompleted,
  trackStepExpanded,
  trackProgressMilestone,
  trackAiQuery,
  trackTtsUsed,
  trackIdCheck,
  trackEvmPractice,
  trackDocumentMatch,
  trackHighContrast,
} from "./analytics";

describe("analytics", () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    window.gtag = mockGtag;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("trackModeSwitch sends mode_switch event", () => {
    trackModeSwitch("quest");
    expect(mockGtag).toHaveBeenCalledWith("event", "mode_switch", {
      mode: "quest",
      event_category: "engagement",
    });
  });

  it("trackStepCompleted sends step_completed event", () => {
    trackStepCompleted("register", "Register on Form 6");
    expect(mockGtag).toHaveBeenCalledWith("event", "step_completed", {
      step_id: "register",
      step_title: "Register on Form 6",
      event_category: "progress",
    });
  });

  it("trackStepExpanded sends step_expanded event", () => {
    trackStepExpanded("eligibility");
    expect(mockGtag).toHaveBeenCalledWith("event", "step_expanded", {
      step_id: "eligibility",
      event_category: "engagement",
    });
  });

  it("trackProgressMilestone sends progress_milestone event", () => {
    trackProgressMilestone(50);
    expect(mockGtag).toHaveBeenCalledWith("event", "progress_milestone", {
      percentage: 50,
      event_category: "progress",
    });
  });

  it("trackAiQuery sends ai_query event", () => {
    trackAiQuery("classic");
    expect(mockGtag).toHaveBeenCalledWith("event", "ai_query", {
      mode: "classic",
      event_category: "ai",
    });
  });

  it("trackAiQuery defaults to classic mode when undefined", () => {
    trackAiQuery(undefined);
    expect(mockGtag).toHaveBeenCalledWith("event", "ai_query", {
      mode: "classic",
      event_category: "ai",
    });
  });

  it("trackTtsUsed sends tts_used event", () => {
    trackTtsUsed("step-details");
    expect(mockGtag).toHaveBeenCalledWith("event", "tts_used", {
      context: "step-details",
      event_category: "accessibility",
    });
  });

  it("trackIdCheck sends id_check event", () => {
    trackIdCheck("aadhaar", true);
    expect(mockGtag).toHaveBeenCalledWith("event", "id_check", {
      doc_type: "aadhaar",
      success: true,
      event_category: "interactive",
    });
  });

  it("trackEvmPractice sends evm_practice event", () => {
    trackEvmPractice("lotus");
    expect(mockGtag).toHaveBeenCalledWith("event", "evm_practice", {
      candidate_id: "lotus",
      event_category: "interactive",
    });
  });

  it("trackDocumentMatch sends document_match event", () => {
    trackDocumentMatch("aadhaar", true);
    expect(mockGtag).toHaveBeenCalledWith("event", "document_match", {
      doc_id: "aadhaar",
      correct: true,
      event_category: "interactive",
    });
  });

  it("trackHighContrast sends high_contrast_toggle event", () => {
    trackHighContrast(true);
    expect(mockGtag).toHaveBeenCalledWith("event", "high_contrast_toggle", {
      enabled: true,
      event_category: "accessibility",
    });
  });

  it("does not crash when gtag is unavailable (SSR/ad-blocker)", () => {
    delete window.gtag;
    expect(() => {
      trackModeSwitch("classic");
      trackStepCompleted("vote", "Vote on polling day");
      trackAiQuery("quest");
    }).not.toThrow();
  });
});
