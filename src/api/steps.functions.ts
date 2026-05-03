/**
 * @module api/steps
 * Server function that generates dynamic, AI-powered guidance for each step
 * of the voting journey using Google Gemini.
 *
 * Called by the `useStepDetails` hook when a user expands a timeline step.
 * Results are cached client-side to avoid redundant requests.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import * as logger from "@/lib/logger";

const Input = z.object({
  stepId: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/),
  stepTitle: z.string().min(1).max(200),
});

const SYSTEM = `You are "The Voting Oracle", a strictly non-partisan assistant focused on the Indian election process (Election Commission of India — ECI).

You produce concise, *current* practical guidance for one specific step of the voter journey.

Rules:
- India only (Lok Sabha + Vidhan Sabha). Refer to ECI procedures, Form 6, NVSP / voters.eci.gov.in / Voter Helpline app, EPIC / e-EPIC, electoral roll, EVM/VVPAT, MCC.
- Concise markdown: 2–4 short paragraphs OR 4–7 bullets. Use **bold** for key terms.
- Include 1–3 official links from these domains only when relevant: eci.gov.in, voters.eci.gov.in, electoralsearch.eci.gov.in, nvsp.in. Format as [label](https://...).
- If a fact may have changed (deadlines, exact forms), say so and link the official ECI source.
- No party / candidate recommendations. No speculation about results.
- Do NOT add a heading — the UI already shows the step title.`;

export const getStepDetails = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(stepsHandler);

/** Core logic for getStepDetails, separated for testing. */
export async function stepsHandler({ data }: { data: z.infer<typeof Input> }) {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  const key = rawKey?.trim();
  if (!key || key === "undefined" || key === "null" || key.length < 10) {
    return { content: "", error: "AI is not configured." };
  }

  const userPrompt = `Step: "${data.stepTitle}" (id: ${data.stepId}).

Give the Indian voter clear, practical, up-to-date guidance for this step: what to do, what to bring, where to do it online or offline, common pitfalls, and a link or two to the official ECI source.`;

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: { systemInstruction: SYSTEM },
      contents: userPrompt,
    });
    const content = res.text?.trim() ?? "";
    return { content, error: null as string | null };
  } catch (e: unknown) {
    const errStr = String(e);
    if (errStr.includes("API key not valid") || errStr.includes("UNAUTHENTICATED")) {
      return { content: "", error: "AI is not configured. Please check your API key." };
    }
    if (errStr.includes("SERVICE_DISABLED") || errStr.includes("disabled")) {
      return { content: "", error: "Gemini API is disabled. Please enable it in Google Cloud Console." };
    }
    if (errStr.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
      return { content: "", error: "API Key restricted by referrer. Please remove HTTP Referrer restrictions in GCP Console." };
    }
    if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
      return { content: "", error: "AI quota exhausted. Please try again later." };
    }
    if (errStr.includes("PERMISSION_DENIED")) {
      return { content: "", error: "Permission denied. Enable the Generative Language API in GCP Console." };
    }
    logger.error("step-details exception", {
      component: "steps",
      stepId: data.stepId,
      error: errStr,
    });
    return { content: "", error: "Could not reach the Oracle. Check server logs." };
  }
}
