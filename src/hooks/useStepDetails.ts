import { useCallback, useEffect, useState } from "react";
import { getStepDetails } from "@/api/steps.functions";

type Entry = {
  status: "idle" | "loading" | "ready" | "error";
  content?: string;
  error?: string;
};

// Module-level cache to preserve fetched data across dismounts
const cache = new Map<string, Entry>();
const inflight = new Set<string>();

export function useStepDetails(stepId: string, stepTitle: string) {
  const [entry, setEntry] = useState<Entry>(() => cache.get(stepId) || { status: "loading" });

  const load = useCallback(
    async (force = false) => {
      if (!force) {
        const existing = cache.get(stepId);
        if (existing && existing.status === "ready") {
          setEntry(existing);
          return;
        }
      }

      if (inflight.has(stepId)) return;

      inflight.add(stepId);
      const loadingState: Entry = { status: "loading" };
      setEntry(loadingState);
      cache.set(stepId, loadingState);

      try {
        const res = await getStepDetails({ data: { stepId, stepTitle } });
        const newState: Entry =
          res.error || !res.content
            ? { status: "error", error: res.error ?? "No content." }
            : { status: "ready", content: res.content };

        cache.set(stepId, newState);
        setEntry(newState);
      } catch (e) {
        const errorState: Entry = {
          status: "error",
          error: e instanceof Error ? e.message : "Request failed.",
        };
        cache.set(stepId, errorState);
        setEntry(errorState);
      } finally {
        inflight.delete(stepId);
      }
    },
    [stepId, stepTitle],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { entry, retry: () => load(true) };
}

export type StepDetailsState = ReturnType<typeof useStepDetails>;
