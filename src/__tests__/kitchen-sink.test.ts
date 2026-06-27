import { describe, expect, test } from "vitest";
import { visibleLength } from "../tui/ansi.js";
import { kitchenSinkComponents, kitchenSinkNavigationSections, componentIndexById } from "../kitchen/registry.js";
import { applyKey, createBrowserState, resolveSelection } from "../kitchen/state.js";
import { renderKitchenSinkBrowser } from "../kitchen/render.js";
import type { KitchenSinkDataMode, KitchenSinkDensity } from "../kitchen/types.js";

function lines(frame: string): string[] {
  return frame.split("\n");
}

const dataModes: KitchenSinkDataMode[] = ["static", "dynamic", "empty"];
const densities: KitchenSinkDensity[] = ["compact", "comfortable", "expanded"];

describe("kitchen sink registry", () => {
  test("every component has the standard data/variant/density option groups", () => {
    for (const component of kitchenSinkComponents) {
      const ids = component.optionGroups.map((group) => group.id).sort();
      expect(ids).toEqual(["data", "density", "variant"]);
      for (const group of component.optionGroups) {
        expect(group.choices.length).toBeGreaterThan(0);
        expect(group.choices.some((choice) => choice.id === group.defaultChoiceId)).toBe(true);
      }
      expect(component.exportName.length).toBeGreaterThan(0);
      expect(component.description.length).toBeGreaterThan(0);
    }
  });

  test("navigation sections reference only real component ids and cover every component", () => {
    const referenced = new Set<string>();
    for (const section of kitchenSinkNavigationSections) {
      for (const id of section.componentIds) {
        expect(componentIndexById(id)).toBeGreaterThanOrEqual(0);
        expect(kitchenSinkComponents.some((c) => c.id === id)).toBe(true);
        referenced.add(id);
      }
    }
    for (const component of kitchenSinkComponents) {
      expect(referenced.has(component.id)).toBe(true);
    }
  });

  test("every component renders a string for all data/variant/density combinations", () => {
    for (const component of kitchenSinkComponents) {
      const variants = component.optionGroups.find((g) => g.id === "variant")!.choices;
      for (const dataMode of dataModes) {
        for (const variant of variants) {
          for (const density of densities) {
            const out = component.render({ width: 68, height: 20, color: false, tick: 9, variantId: variant.id, dataMode, density });
            expect(typeof out).toBe("string");
            expect(out.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

describe("kitchen sink browser frame", () => {
  test.each([
    [80, 24],
    [120, 32],
    [160, 44]
  ])("%ix%i frame stays inside the requested bounds", (width, height) => {
    const frame = renderKitchenSinkBrowser({ width, height, color: true, tick: 5, state: createBrowserState(0) });
    const frameLines = lines(frame);
    expect(frameLines).toHaveLength(height);
    for (const line of frameLines) {
      expect(visibleLength(line)).toBeLessThanOrEqual(width);
    }
  });

  test("snapshot render is deterministic for identical input", () => {
    const opts = { width: 130, height: 36, color: false, tick: 14, state: createBrowserState(4) } as const;
    expect(renderKitchenSinkBrowser(opts)).toBe(renderKitchenSinkBrowser(opts));
  });

  test("the frame surfaces the active component label and its export name", () => {
    const state = createBrowserState(componentIndexById("ship-builder"));
    const frame = renderKitchenSinkBrowser({ width: 130, height: 34, color: false, tick: 2, state });
    expect(frame).toContain("Ship Builder");
    expect(frame).toContain("renderShipDesignBuilder");
  });
});

describe("kitchen sink interaction reducer", () => {
  test("Tab cycles focus navigation -> preview -> options", () => {
    let state = createBrowserState(0);
    expect(state.focus).toBe("navigation");
    state = (applyKey(state, "\t") as { state: typeof state }).state;
    expect(state.focus).toBe("preview");
    state = (applyKey(state, "\t") as { state: typeof state }).state;
    expect(state.focus).toBe("options");
  });

  test("selecting a component resets option indices to defaults", () => {
    let state = { ...createBrowserState(0), variantIndex: 2, dataIndex: 1 };
    const action = applyKey(state, "d"); // next component
    expect(action.kind).toBe("state");
    state = (action as { state: typeof state }).state;
    expect(state.variantIndex).toBe(0);
    expect(state.dataIndex).toBe(0);
  });

  test("in options focus, left/right changes the active group's value", () => {
    let state = { ...createBrowserState(componentIndexById("borders")), focus: "options" as const, optionGroupIndex: 1 };
    const before = resolveSelection(state).variantId;
    const action = applyKey(state, "d");
    state = (action as { state: typeof state }).state;
    const after = resolveSelection(state).variantId;
    expect(after).not.toBe(before);
  });

  test("q requests quit", () => {
    expect(applyKey(createBrowserState(0), "q").kind).toBe("quit");
  });
});
