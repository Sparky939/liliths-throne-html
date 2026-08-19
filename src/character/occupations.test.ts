import { describe, expect, it } from "vitest";
import "./occupations";

const LT = globalThis.LT;

describe("LT.OCCUPATIONS", () => {
  it("builds a non-empty list of jobs with the expected shape", () => {
    expect(LT.OCCUPATIONS.length).toBeGreaterThan(5);
    for (const job of LT.OCCUPATIONS) {
      expect(typeof job.id).toBe("string");
      expect(typeof job.name).toBe("string");
      expect(typeof job.description).toBe("string");
    }
  });

  it("defaults feminineOnly/masculineOnly to false when omitted", () => {
    const unemployed = LT.OCCUPATIONS.find((j) => j.id === "UNEMPLOYED")!;
    expect(unemployed.feminineOnly).toBe(false);
    expect(unemployed.masculineOnly).toBe(false);
  });

  it("coerces a truthy feminineOnly flag to a boolean", () => {
    const maid = LT.OCCUPATIONS.find((j) => j.id === "MAID")!;
    expect(maid.feminineOnly).toBe(true);
    expect(maid.masculineOnly).toBe(false);
  });
});
