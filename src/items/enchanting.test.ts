import { describe, expect, it } from "vitest";
import "./enchanting";

const LT = (globalThis as any).LT;

describe("LT.TF_MODIFIER", () => {
  it("derives value from rarity via the RARITY_COST table", () => {
    expect(LT.TF_MODIFIER.NONE.value).toBe(1); // COMMON
    expect(LT.TF_MODIFIER.CLOTHING_ATTRIBUTE.value).toBe(2); // UNCOMMON
    expect(LT.TF_MODIFIER.FERTILITY.value).toBe(4); // RARE
    expect(LT.TF_MODIFIER.HEALTH_MAXIMUM.value).toBe(8); // EPIC
    expect(LT.TF_MODIFIER.STRENGTH.value).toBe(12); // LEGENDARY
  });

  it("merges the optional extra properties object onto the modifier", () => {
    expect(LT.TF_MODIFIER.HEALTH_MAXIMUM.attr).toBe("health");
    expect(LT.TF_MODIFIER.STRENGTH.attr).toBe("physique");
  });

  it("still sets id/name/rarity when no extra object is passed", () => {
    expect(LT.TF_MODIFIER.NONE).toMatchObject({ id: "NONE", name: "Empty", rarity: "COMMON" });
  });
});

describe("LT.TF_POTENCY", () => {
  it("flags drains as negative and boosts as positive", () => {
    expect(LT.TF_POTENCY.MAJOR_DRAIN.negative).toBe(true);
    expect(LT.TF_POTENCY.MAJOR_BOOST.negative).toBe(false);
  });
});
