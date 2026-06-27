import { kitchenSinkComponents } from "./registry.js";
import type { ComponentDefinition, KitchenSinkDataMode, KitchenSinkDensity, OptionGroup } from "./types.js";

export const kitchenSinkFocusZones = ["navigation", "preview", "options"] as const;
export type KitchenSinkFocusZone = (typeof kitchenSinkFocusZones)[number];

export type KitchenBrowserState = {
  componentIndex: number;
  /** Active option group while the options pane is focused. */
  optionGroupIndex: number;
  dataIndex: number;
  variantIndex: number;
  densityIndex: number;
  focus: KitchenSinkFocusZone;
};

export type ResolvedSelection = {
  component: ComponentDefinition;
  componentIndex: number;
  optionGroupIndex: number;
  dataIndex: number;
  variantIndex: number;
  densityIndex: number;
  dataMode: KitchenSinkDataMode;
  variantId: string;
  density: KitchenSinkDensity;
  focus: KitchenSinkFocusZone;
};

function clampIndex(value: number | undefined, length: number): number {
  if (length <= 0) return 0;
  const v = Math.floor(value ?? 0);
  return ((v % length) + length) % length;
}

function groupById(component: ComponentDefinition, id: OptionGroup["id"]): OptionGroup | undefined {
  return component.optionGroups.find((group) => group.id === id);
}

function defaultChoiceIndex(group: OptionGroup | undefined): number {
  if (!group) return 0;
  const idx = group.choices.findIndex((choice) => choice.id === group.defaultChoiceId);
  return idx >= 0 ? idx : 0;
}

export function createBrowserState(componentIndex = 0): KitchenBrowserState {
  const component = kitchenSinkComponents[clampIndex(componentIndex, kitchenSinkComponents.length)]!;
  return {
    componentIndex: clampIndex(componentIndex, kitchenSinkComponents.length),
    optionGroupIndex: 0,
    dataIndex: defaultChoiceIndex(groupById(component, "data")),
    variantIndex: defaultChoiceIndex(groupById(component, "variant")),
    densityIndex: defaultChoiceIndex(groupById(component, "density")),
    focus: "navigation"
  };
}

/** Reset the per-component option indices to their defaults for a new component. */
function selectComponent(componentIndex: number): KitchenBrowserState {
  return { ...createBrowserState(componentIndex), focus: "navigation" };
}

export function resolveSelection(state: KitchenBrowserState): ResolvedSelection {
  const componentIndex = clampIndex(state.componentIndex, kitchenSinkComponents.length);
  const component = kitchenSinkComponents[componentIndex]!;
  const dataGroup = groupById(component, "data");
  const variantGroup = groupById(component, "variant");
  const densityGroup = groupById(component, "density");
  const dataIndex = clampIndex(state.dataIndex, dataGroup?.choices.length ?? 1);
  const variantIndex = clampIndex(state.variantIndex, variantGroup?.choices.length ?? 1);
  const densityIndex = clampIndex(state.densityIndex, densityGroup?.choices.length ?? 1);
  const optionGroupIndex = clampIndex(state.optionGroupIndex, component.optionGroups.length);
  return {
    component,
    componentIndex,
    optionGroupIndex,
    dataIndex,
    variantIndex,
    densityIndex,
    dataMode: (dataGroup?.choices[dataIndex]?.id ?? "static") as KitchenSinkDataMode,
    variantId: variantGroup?.choices[variantIndex]?.id ?? "default",
    density: (densityGroup?.choices[densityIndex]?.id ?? "comfortable") as KitchenSinkDensity,
    focus: state.focus
  };
}

function cycleFocus(focus: KitchenSinkFocusZone, dir: 1 | -1): KitchenSinkFocusZone {
  const i = kitchenSinkFocusZones.indexOf(focus);
  const next = (i + dir + kitchenSinkFocusZones.length) % kitchenSinkFocusZones.length;
  return kitchenSinkFocusZones[next]!;
}

function changeActiveOption(state: KitchenBrowserState, dir: 1 | -1): KitchenBrowserState {
  const resolved = resolveSelection(state);
  const group = resolved.component.optionGroups[resolved.optionGroupIndex];
  if (!group) return state;
  const len = group.choices.length;
  const step = (current: number) => clampIndex(current + dir, len);
  if (group.id === "data") return { ...state, dataIndex: step(resolved.dataIndex) };
  if (group.id === "variant") return { ...state, variantIndex: step(resolved.variantIndex) };
  if (group.id === "density") return { ...state, densityIndex: step(resolved.densityIndex) };
  return state;
}

export type KitchenKeyAction =
  | { kind: "state"; state: KitchenBrowserState }
  | { kind: "quit" }
  | { kind: "pause" }
  | { kind: "step" }
  | { kind: "ignored" };

/**
 * Pure keyboard reducer for the catalog browser. Mirrors the prettui demo's
 * navigation/preview/options interaction model.
 */
export function applyKey(state: KitchenBrowserState, key: string): KitchenKeyAction {
  if (key === "q" || key === "") return { kind: "quit" };
  if (key === "p") return { kind: "pause" };
  if (key === "f") return { kind: "step" };

  // Tab / Shift-Tab cycle focus zones.
  if (key === "\t") return { kind: "state", state: { ...state, focus: cycleFocus(state.focus, 1) } };
  if (key === "[Z") return { kind: "state", state: { ...state, focus: cycleFocus(state.focus, -1) } };

  const up = key === "w" || key === "[A";
  const down = key === "s" || key === "[B";
  const leftKey = key === "a" || key === "[D";
  const rightKey = key === "d" || key === "[C";

  if (state.focus === "options") {
    if (up) return { kind: "state", state: { ...state, optionGroupIndex: clampIndex(state.optionGroupIndex - 1, resolveSelection(state).component.optionGroups.length) } };
    if (down) return { kind: "state", state: { ...state, optionGroupIndex: clampIndex(state.optionGroupIndex + 1, resolveSelection(state).component.optionGroups.length) } };
    if (leftKey) return { kind: "state", state: changeActiveOption(state, -1) };
    if (rightKey) return { kind: "state", state: changeActiveOption(state, 1) };
    return { kind: "ignored" };
  }

  // navigation or preview focus: move between components.
  const total = kitchenSinkComponents.length;
  if (up || leftKey) return { kind: "state", state: selectComponentPreserveFocus(state, clampIndex(state.componentIndex - 1, total)) };
  if (down || rightKey) return { kind: "state", state: selectComponentPreserveFocus(state, clampIndex(state.componentIndex + 1, total)) };
  return { kind: "ignored" };
}

function selectComponentPreserveFocus(state: KitchenBrowserState, componentIndex: number): KitchenBrowserState {
  return { ...selectComponent(componentIndex), focus: state.focus };
}
