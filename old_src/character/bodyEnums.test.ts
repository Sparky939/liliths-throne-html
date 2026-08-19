import { describe, expect, it } from "vitest";
import "./bodyEnums";

const LT = globalThis.LT;

describe("LT body enum catalogues", () => {
  it("builds BODY_SIZE entries with id/name/colour", () => {
    expect(LT.BODY_SIZE.TWO_AVERAGE).toEqual({ id: "TWO_AVERAGE", name: "average", colour: "#88b8d4" });
  });

  it("builds BODY_SIZE_LIST as an ordered flat list of the same entries", () => {
    expect(LT.BODY_SIZE_LIST).toHaveLength(Object.keys(LT.BODY_SIZE).length);
    expect(LT.BODY_SIZE_LIST[0]).toEqual(LT.BODY_SIZE.ZERO_SKINNY);
  });

  it("defaults a missing colour to the fallback grey", () => {
    // LT.LIP entries omit the colour argument, exercising item()'s `|| "#dddddd"` fallback.
    expect(LT.LIP.ZERO_THIN.colour).toBe("#dddddd");
  });
});
