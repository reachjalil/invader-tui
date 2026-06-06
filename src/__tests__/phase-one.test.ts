import { describe, expect, test } from "vitest";
import {
  buildDefaultShipDesign,
  enemySpecies,
  resolveShipDesign,
  shipClassConfigs,
  shipFamily
} from "../assets/index.js";
import { renderKitchenSink } from "../render/kitchenSink.js";
import { validateAssetCatalog } from "../render/sprites.js";
import { renderArcadeHud, renderShipDesignBuilder } from "../render/widgets.js";
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

  test("ship designs resolve compatible modules and custom stats", () => {
    for (const config of shipClassConfigs) {
      const design = buildDefaultShipDesign(config.id);
      const resolved = resolveShipDesign(design, 1);
      expect(resolved.classId).toBe(config.id);
      expect(resolved.variant.name).toContain(design.name);
      expect(resolved.stats.hull).toBeGreaterThan(0);
      expect(resolved.stats.projectileDamage).toBeGreaterThan(0);
      for (const slot of resolved.slots) {
        if (slot.module) expect(slot.point.accepts).toContain(slot.module.category);
      }
    }
  });

  test("ship cosmetic parts alter the resolved silhouette and stat tradeoffs", () => {
    const stock = resolveShipDesign(buildDefaultShipDesign("bar"), 1);
    const custom = resolveShipDesign(buildDefaultShipDesign("bar", {
      cosmetics: {
        nose: "nose-fork",
        leftWing: "left-round",
        rightWing: "right-blade",
        tail: "tail-u",
        interior: "inside-hollow"
      }
    }), 1);
    const silhouette = custom.variant.sprite.lines.join("\n");

    expect(custom.cosmetics.map((part) => part.name)).toContain("Fork Tip");
    expect(custom.cosmetics.map((part) => part.name)).toContain("Hollow Core");
    expect(silhouette).toContain("Y");
    expect(silhouette).toContain("U");
    expect(silhouette).toContain("O");
    expect(custom.stats.hull).toBeLessThan(stock.stats.hull);
    expect(custom.stats.spread).toBeGreaterThan(stock.stats.spread);
  });

  test("ship builder panel renders a width-safe customization interface", () => {
    const design = buildDefaultShipDesign("delta", {
      name: "Razorback",
      paintId: "redline",
      modules: {
        gun: "needle-cannon",
        wings: "vector-wings",
        core: "overdrive-core"
      },
      cosmetics: {
        tail: "tail-u",
        interior: "inside-hollow"
      }
    });
    const frame = renderShipDesignBuilder(85, 23, {
      design,
      activeSection: "tail",
      activeSlotIndex: 1,
      tick: 4,
      showControls: true
    }, false);
    expect(frame).toContain("SHIP BUILDER");
    expect(frame).toContain("BUILD OPTIONS");
    expect(frame).toContain("VISIBLE HARDPOINTS");
    expect(frame).toContain("RAZORBACK");
    expect(frame).toContain("U-Tail");
    for (const line of lines(frame)) {
      expect(visibleLength(line)).toBeLessThanOrEqual(85);
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

  test("design focus exposes the ship builder in kitchen sink snapshots", () => {
    const frame = renderKitchenSink({ width: 160, height: 48, color: false, tick: 12, focus: "designs" });
    expect(frame).toContain("SHIP BUILDER");
    expect(frame).toContain("BUILD OPTIONS");
    expect(frame).toContain("VISIBLE HARDPOINTS");
  });

  test.each([
    [80, 24],
    [120, 36]
  ])("%ix%i design focus render stays inside requested frame", (width, height) => {
    const frame = renderKitchenSink({ width, height, color: true, tick: 21, focus: "designs" });
    const frameLines = lines(frame);
    expect(frameLines).toHaveLength(height);
    for (const line of frameLines) {
      expect(visibleLength(line)).toBeLessThanOrEqual(width);
    }
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

  test("arcade hud can show turbo mode and special weapon charge", () => {
    const frame = renderArcadeHud(96, {
      score: 9990,
      highScore: 15000,
      wave: 2,
      level: 3,
      upgradePoints: 400,
      nextUpgradeAt: null,
      enemiesRemaining: 12,
      hp: 80,
      maxHp: 90,
      shield: 40,
      maxShield: 70,
      shieldActive: true,
      gameMode: "TURBO",
      specialName: "NOVA LANCE",
      specialCharge: 100
    }, false);

    expect(frame).toContain("MODE TURBO");
    expect(frame).toContain("SPEC NOVA LANCE 100%");
  });
});
