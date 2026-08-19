import { describe, expect, it } from "vitest";
import "./paths";

const LT = globalThis.LT;

describe("LT path helpers", () => {
  it("builds an assets/ui path", () => {
    expect(LT.uiIcon("menu.svg")).toBe("assets/ui/menu.svg");
  });

  it("builds an assets/fonts path", () => {
    expect(LT.fontUrl("body.woff2")).toBe("assets/fonts/body.woff2");
  });

  it("builds an assets/map path", () => {
    expect(LT.mapAsset("tiles/grass.png")).toBe("assets/map/tiles/grass.png");
  });
});
