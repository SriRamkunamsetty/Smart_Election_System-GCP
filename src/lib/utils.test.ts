import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("merges tailwind classes correctly", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2");
    expect(cn("px-2", { "py-2": true })).toBe("px-2 py-2");
    expect(cn("px-2", { "py-2": false })).toBe("px-2");
  });

  it("handles conflicting tailwind classes with twMerge", () => {
    // twMerge should prefer the last one
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
