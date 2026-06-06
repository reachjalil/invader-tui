import { describe, expect, test } from "vitest";
import { enemySpecies, shipFamily } from "../assets/index.js";
import { renderKitchenSink } from "../render/kitchenSink.js";
import { validateAssetCatalog } from "../render/sprites.js";
import { stripAnsi, visibleLength } from "../tui/ansi.js";

function lines(frame: string): string[] {
  return frame.split("\n");
}

describe("phase one kitchen sink", () => {
  test("snapshot contains the required catalog names", () => {
    const frame = renderKitchenSink({ width: 160, height: 48, color: false, tick: 12 });
    expect(frame).toContain(enemySpecies.displayName);
    expect(frame).toContain(shipFamily.displayName);
  });

  test("all sprites validate exact visible width and height", () => {
    expect(validateAssetCatalog()).toEqual([]);
  });

  test("catalog holds the agreed base enemy, selected level-2 enemy variants, and one base ship", () => {
    expect(enemySpecies.variants).toHaveLength(9);
    expect(shipFamily.variants).toHaveLength(12);
    expect(enemySpecies.variants[0]?.name).toBe("Mite Grunt L1");
    expect(enemySpecies.variants.map((variant) => variant.name)).toContain("Mite Grunt L1");
    expect(shipFamily.variants[0]?.name).toBe("Bar Chassis L1");
  });

  test("base models expose valid attachment points", () => {
    for (const variant of [...enemySpecies.variants, ...shipFamily.variants]) {
      expect(variant.attachmentPoints.length).toBeGreaterThanOrEqual(1);
      for (const point of variant.attachmentPoints) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThan(variant.sprite.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThan(variant.sprite.height);
        expect(point.accepts.length).toBeGreaterThan(0);
      }
    }
  });

  test("rendering strips ANSI correctly for width checks", () => {
    const frame = renderKitchenSink({ width: 100, height: 30, color: true, tick: 3 });
    const stripped = stripAnsi(frame);
    expect(stripped).toContain("STATUS");
    expect(visibleLength(frame.split("\n")[0])).toBe(100);
  });

  test("snapshot render is deterministic for identical input", () => {
    const options = { width: 160, height: 48, color: false, tick: 22, paused: true as const };
    expect(renderKitchenSink(options)).toBe(renderKitchenSink(options));
  });

  test.each([
    [80, 24],
    [100, 30],
    [160, 48]
  ])("%ix%i render stays inside requested frame", (width, height) => {
    const frame = renderKitchenSink({ width, height, color: true, tick: 17 });
    const frameLines = lines(frame);
    expect(frameLines).toHaveLength(height);
    for (const line of frameLines) {
      expect(visibleLength(line)).toBeLessThanOrEqual(width);
    }
  });
});
