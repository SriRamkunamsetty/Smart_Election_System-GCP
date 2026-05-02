/**
 * @module api/vision
 * Server function that uses Gemini's vision capabilities to verify
 * Indian voter ID documents (Aadhaar, EPIC, Passport, DL, PAN).
 *
 * Privacy:
 *  - Images are sent directly to Gemini and never stored.
 *  - The AI is instructed to never echo personal data.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import * as logger from "@/lib/logger";

const Input = z.object({
  // data URL or base64 of the image
  image: z.string().min(64).max(8_000_000),
  docHint: z
    .enum(["aadhaar", "voter_id", "passport", "driving_licence", "pan", "any"])
    .default("any"),
});

const SYSTEM = `You are a non-partisan visual checker for Indian voter ID documents.
You will be shown ONE photo. Decide if the photo plausibly shows an official Indian ID acceptable for voter registration / polling-day identification:
- Aadhaar card, EPIC (Voter ID), Indian passport, driving licence, or PAN card.

Reply with JSON only. No markdown. Schema:
{
  "ok": boolean,                 // true if a plausible Indian ID is visible AND key fields look readable
  "doc": "aadhaar"|"voter_id"|"passport"|"driving_licence"|"pan"|"unknown",
  "confidence": number,          // 0..1
  "reason": string,              // 1 short sentence, friendly, India-aware
  "tips": string[]               // 0-3 short tips to improve the photo if not ok
}

Privacy rule: NEVER reveal or echo any personal numbers, names, addresses, photos, or QR data. Just judge the document type and visibility.`;

export const checkIdPhoto = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(visionHandler);

/** Core logic for checkIdPhoto, separated for testing. */
export async function visionHandler({ data }: { data: z.infer<typeof Input> }) {
  const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    const key = rawKey?.trim();
    if (!key || key === "undefined" || key === "null" || key.length < 10) {
      return {
        ok: false,
        doc: "unknown" as const,
        confidence: 0,
        reason: "AI is not configured.",
        tips: [],
        error: "no_key",
      };
    }

    const { image, docHint } = data;
    const base64Str = image.startsWith("data:") ? image.split(",")[1] : image;

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const res = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
        },
        contents: [
          {
            text: `User said the document is: ${docHint}. Judge the photo and reply with JSON only.`,
          },
          { inlineData: { mimeType: "image/jpeg", data: base64Str } },
        ],
      });

      const cleaned = res.text?.trim() ?? "{}";
      let parsed: {
        ok?: boolean;
        doc?: string;
        confidence?: number;
        reason?: string;
        tips?: string[];
      } = {};
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {};
      }

      const allowedDocs = [
        "aadhaar",
        "voter_id",
        "passport",
        "driving_licence",
        "pan",
        "unknown",
      ] as const;
      const docVal = (allowedDocs as readonly string[]).includes(parsed.doc ?? "")
        ? (parsed.doc as (typeof allowedDocs)[number])
        : "unknown";

      return {
        ok: !!parsed.ok,
        doc: docVal,
        confidence:
          typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        reason:
          parsed.reason ||
          (parsed.ok ? "Looks like a valid ID." : "Could not verify the document."),
        tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3).map(String) : [],
        error: null as string | null,
      };
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("API key not valid")) {
        return {
          ok: false,
          doc: "unknown" as const,
          confidence: 0,
          reason: "AI is not configured. Please check your API key.",
          tips: [],
          error: "no_key",
        };
      }
      logger.error("vision exception", { component: "vision", error: String(e) });
      return {
        ok: false,
        doc: "unknown" as const,
        confidence: 0,
        reason: "Could not reach the Oracle.",
        tips: [],
        error: "network",
      };
    }
  }
