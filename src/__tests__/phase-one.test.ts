import { describe, expect, test } from "vitest";
import { enemySpecies, shipFamily } from "../assets/index.js";
import { renderKitchenSink } from "../render/kitchenSink.js";
import { validateAssetCatalog } from "../render/sprites.js";
import { renderArcadeHud } from "../render/widgets.js";
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

  test("arcade hud keeps gameplay counters compact and hides inactive shield", () => {
    const frame = renderArcadeHud(85, {
      score: 5790,
      highScore: 15000,
      wave: 2,
      level: 1,
      upgradePoints: 290,
      nextUpgradeAt: 500,
      enemiesRemaining: 4,
      hp: 40,
      maxHp: 50,
      shield: 0,
      maxShield: 20,
      shieldActive: false
    }, false);

    expect(frame).toContain("1UP 005790");
    expect(frame).toContain("WAVE 02");
    expect(frame).toContain("STAR 290/500");
    expect(frame).not.toContain("SHLD");
    expect(frame).not.toContain("HEAT");
  });

  test("arcade hud shows shield and boss only when mechanically active", () => {
    const frame = renderArcadeHud(85, {
      score: 1200,
      highScore: 15000,
      wave: 3,
      level: 2,
      upgradePoints: 0,
      nextUpgradeAt: 1000,
      enemiesRemaining: 1,
      hp: 60,
      maxHp: 75,
      shield: 30,
      maxShield: 30,
      shieldActive: true,
      boss: { name: "Behemoth Titan", hp: 130, maxHp: 260 }
    }, false);

    expect(frame).toContain("SHLD");
    expect(frame).toContain("BOSS");
    expect(frame).toContain("BEHEMOTH TITAN");
  });
});
