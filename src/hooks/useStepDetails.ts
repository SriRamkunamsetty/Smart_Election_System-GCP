import { useCallback, useRef, useState } from "react";
import { getStepDetails } from "@/api/steps.functions";

type Entry = {
  status: "idle" | "loading" | "ready" | "error";
  content?: string;
  error?: string;
};

export function useStepDetails() {
  const [byId, setById] = useState<Record<string, Entry>>({});
  // Track in-flight requests so a re-expand doesn't double-fire.
  const inflight = useRef<Set<string>>(new Set());

  const load = useCallback(async (stepId: string, stepTitle: string) => {
    if (inflight.current.has(stepId)) return;

    let shouldBail = false;
    setById((prev) => {
      const existing = prev[stepId];
      if (existing && (existing.status === "ready" || existing.status === "loading")) {
        shouldBail = true;
        return prev;
      }
      return { ...prev, [stepId]: { status: "loading" } };
    });

    if (shouldBail) return;

    inflight.current.add(stepId);

    try {
      const res = await getStepDetails({ data: { stepId, stepTitle } });
      if (res.error || !res.content) {
        setById((prev) => ({
          ...prev,
          [stepId]: { status: "error", error: res.error ?? "No content." },
        }));
      } else {
        setById((prev) => ({
          ...prev,
          [stepId]: { status: "ready", content: res.content },
        }));
      }
    } catch (e) {
      setById((prev) => ({
        ...prev,
        [stepId]: {
          status: "error",
          error: e instanceof Error ? e.message : "Request failed.",
        },
      }));
    } finally {
      inflight.current.delete(stepId);
    }
  }, []);

  const retry = useCallback(
    (stepId: string, stepTitle: string) => {
      setById((prev) => {
        const next = { ...prev };
        delete next[stepId];
        return next;
      });
      void load(stepId, stepTitle);
    },
    [load],
  );

  return { byId, load, retry };
}

export type StepDetailsState = ReturnType<typeof useStepDetails>;
