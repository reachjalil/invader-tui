import { describe, expect, test } from "vitest";
import { BrailleCanvas, renderShipPlayground } from "../shipPlayground.js";

describe("ship playground braille renderer", () => {
  test("packs a 2x4 dot block into one full braille cell", () => {
    const canvas = new BrailleCanvas(2, 4);
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 2; x += 1) {
        canvas.set(x, y);
      }
    }

    expect(canvas.frame()).toEqual({ width: 1, height: 1, lines: ["⣿"] });
  });

  test("export mode emits plain sprite frame literals", () => {
    const output = renderShipPlayground({ exportsOnly: true });
    expect(output).toContain("x_wing_study_5x3");
    expect(output).toContain("lines:");
    expect(output).not.toContain("┌");
  });
});
