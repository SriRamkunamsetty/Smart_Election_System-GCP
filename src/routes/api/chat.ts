/**
 * @module api/chat
 * Server-side streaming chat endpoint for "The Voting Oracle" AI assistant.
 * Uses Google Gemini 2.0 Flash API with Server-Sent Events (SSE) for real-time streaming.
 *
 * Security:
 *  - API key is validated and never exposed to the client.
 *  - Request body is validated via Zod schemas with strict limits.
 *  - Message content is capped at 4000 chars, history at 40 messages.
 *  - In-memory rate limiting (20 req/min per IP) prevents abuse.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import * as logger from "@/lib/logger";

/* ── Rate limiter ───────────────────────────────────────────────── */
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > RATE_LIMIT;
}

const SYSTEM_PROMPT = `You are "The Voting Oracle", a friendly, neutral, non-partisan assistant that helps Indian citizens understand the election process.

Scope:
- Indian general (Lok Sabha) and state (Vidhan Sabha) elections, run by the Election Commission of India (ECI).
- Voter registration via Form 6, NVSP / voters.eci.gov.in / Voter Helpline app.
- EPIC (Voter ID), e-EPIC, electoral roll lookup, polling booth, EVM/VVPAT, model code of conduct.
- Eligibility, deadlines (qualifying date 1 Jan), accepted ID alternatives at the booth.

Style:
- Concise, encouraging, plain language.
- Use short markdown: bullet lists, **bold** for key terms, links to official ECI sources where possible.
- Never recommend a party or candidate. Stay strictly non-partisan.
- If asked about another country's elections, politely redirect to India.
- If unsure or info may have changed, say so and link the official ECI source.`;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  context: z.string().optional(),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /* ── Rate limit check ── */
        const forwarded = request.headers.get("x-forwarded-for");
        const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";
        if (isRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
            { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } },
          );
        }

        const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        const key = rawKey?.trim();
        if (!key || key === "undefined" || key === "null" || key.length < 10) {
          return new Response(
            JSON.stringify({ error: "AI is not configured. Please check your API key." }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        let parsed;
        try {
          const json = await request.json();
          parsed = Body.parse(json);
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const ai = new GoogleGenAI({ apiKey: key });
          const dynamicSystemInstruction = parsed.context
            ? `${SYSTEM_PROMPT}\n\nUser Context:\n${parsed.context}`
            : SYSTEM_PROMPT;

          const stream = await ai.models.generateContentStream({
            model: "gemini-2.0-flash",
            config: { systemInstruction: dynamicSystemInstruction },
            contents: parsed.messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
          });

          const readable = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of stream) {
                  if (request.signal.aborted) {
                    break;
                  }
                  const payload = JSON.stringify({
                    choices: [{ delta: { content: chunk.text } }],
                  });
                  controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
                }
                if (!request.signal.aborted) {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                }
              } catch (e: unknown) {
                const isAbort = e instanceof Error && e.name === "AbortError";
                if (!isAbort && !request.signal.aborted) {
                  logger.error("Stream generation error", { component: "chat", error: String(e) });
                  try {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ error: "Stream error" })}\n\n`,
                      ),
                    );
                  } catch (err) {
                    // Ignore enqueue errors.
                  }
                }
              } finally {
                controller.close();
              }
            },
          });

          return new Response(readable, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
            },
          });
        } catch (e: unknown) {
          const errStr = String(e);
          if (errStr.includes("API key not valid") || errStr.includes("UNAUTHENTICATED")) {
            return new Response(
              JSON.stringify({ error: "AI is not configured. Please check your API key." }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }
          if (errStr.includes("SERVICE_DISABLED") || errStr.includes("disabled")) {
            return new Response(
              JSON.stringify({ error: "Gemini API is disabled. Please enable it in GCP Console." }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }
          if (errStr.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
            return new Response(
              JSON.stringify({ error: "API Key restricted by referrer. Remove HTTP Referrer restrictions in GCP Console." }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }
          if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
            return new Response(
              JSON.stringify({ error: "AI quota exhausted. Please try again later." }),
              { status: 429, headers: { "Content-Type": "application/json" } },
            );
          }
          if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
            return new Response(
              JSON.stringify({ error: "AI model not available. Please check your Google Cloud project setup." }),
              { status: 404, headers: { "Content-Type": "application/json" } },
            );
          }
          if (errStr.includes("PERMISSION_DENIED")) {
            return new Response(
              JSON.stringify({ error: "Permission denied. Enable the Generative Language API in GCP Console." }),
              { status: 403, headers: { "Content-Type": "application/json" } },
            );
          }
          logger.error("AI upstream error", { component: "chat", error: errStr });
          return new Response(
            JSON.stringify({ error: "AI gateway error. Please check server logs for details." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
