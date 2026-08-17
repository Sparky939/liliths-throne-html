import { describe, expect, it } from "vitest";
import "./colours";

const LT = (globalThis as any).LT;

describe("LT.Colour", () => {
  it("defines the full palette as hex strings", () => {
    expect(LT.Colour.BACKGROUND).toBe("#1e1e20");
    expect(LT.Colour.GENERIC_GOOD).toMatch(/^#[0-9a-f]{6}$/);
    expect(Object.keys(LT.Colour).length).toBeGreaterThan(20);
  });
});

describe("LT.styleSpan", () => {
  it("wraps text in a coloured span", () => {
    expect(LT.styleSpan("#ff0000", "hello")).toBe('<span style="color:#ff0000;">hello</span>');
  });

  it("does not escape or alter the input text", () => {
    expect(LT.styleSpan("#000", "<b>bold</b>")).toBe('<span style="color:#000;"><b>bold</b></span>');
  });
});
