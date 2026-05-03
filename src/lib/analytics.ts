/**
 * @module analytics
 * Google Analytics 4 (GA4) custom event helpers.
 *
 * Sends structured events to Google Analytics via the global `gtag()` function
 * injected by the GA4 script in `__root.tsx`. All helpers are no-ops when
 * `gtag` is unavailable (SSR, ad-blockers, missing script).
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Safe wrapper — only calls gtag if it exists (prevents SSR / ad-blocker crashes). */
function safeGtag(command: string, eventName: string, params?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(command, eventName, params);
  }
}

/* ── Page-level events ─────────────────────────────────────────── */

/** Track when a user switches between Classic and Quest modes. */
export function trackModeSwitch(mode: "classic" | "quest"): void {
  safeGtag("event", "mode_switch", { mode, event_category: "engagement" });
}

/* ── Step / Progress events ────────────────────────────────────── */

/** Track when a user completes a step in the voting guide. */
export function trackStepCompleted(stepId: string, stepTitle: string): void {
  safeGtag("event", "step_completed", {
    step_id: stepId,
    step_title: stepTitle,
    event_category: "progress",
  });
}

/** Track when a user expands a step to view AI-generated details. */
export function trackStepExpanded(stepId: string): void {
  safeGtag("event", "step_expanded", { step_id: stepId, event_category: "engagement" });
}

/** Track overall progress milestones (25%, 50%, 75%, 100%). */
export function trackProgressMilestone(percentage: number): void {
  safeGtag("event", "progress_milestone", {
    percentage,
    event_category: "progress",
  });
}

/* ── AI / Oracle events ────────────────────────────────────────── */

/** Track when a user sends a message to the Voting Oracle. */
export function trackAiQuery(mode: "classic" | "quest" | undefined): void {
  safeGtag("event", "ai_query", { mode: mode ?? "classic", event_category: "ai" });
}

/** Track when a user uses TTS (Text-to-Speech). */
export function trackTtsUsed(context: string): void {
  safeGtag("event", "tts_used", { context, event_category: "accessibility" });
}

/* ── Interactive feature events ────────────────────────────────── */

/** Track when a user checks an ID photo via Gemini Vision. */
export function trackIdCheck(docType: string, success: boolean): void {
  safeGtag("event", "id_check", {
    doc_type: docType,
    success,
    event_category: "interactive",
  });
}

/** Track EVM practice completion. */
export function trackEvmPractice(candidateId: string): void {
  safeGtag("event", "evm_practice", { candidate_id: candidateId, event_category: "interactive" });
}

/** Track document match game interactions. */
export function trackDocumentMatch(docId: string, correct: boolean): void {
  safeGtag("event", "document_match", {
    doc_id: docId,
    correct,
    event_category: "interactive",
  });
}

/* ── Accessibility events ──────────────────────────────────────── */

/** Track when a user toggles high-contrast mode. */
export function trackHighContrast(enabled: boolean): void {
  safeGtag("event", "high_contrast_toggle", {
    enabled,
    event_category: "accessibility",
  });
}
