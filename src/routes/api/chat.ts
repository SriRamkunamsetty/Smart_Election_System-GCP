import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

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
        const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        const key = rawKey?.trim();
        if (!key || key === "undefined" || key === "null" || key.length < 10) {
          return new Response(JSON.stringify({ error: "AI is not configured. Please check your API key." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
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
            model: "gemini-3-flash-preview",
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
                  console.error("Stream generation error", e);
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
          if (e instanceof Error && e.message.includes("API key not valid")) {
            return new Response(
              JSON.stringify({ error: "AI is not configured. Please check your API key." }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
          console.error("AI upstream error", e);
          return new Response(JSON.stringify({ error: "AI gateway error." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
