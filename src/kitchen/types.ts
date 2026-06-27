// Standardized contract for every inspectable component in the invader-tui kitchen
// sink. Modeled on the @prettui/demo registry shape (data / variant / density option
// groups) so the catalog is data-driven, navigable, and self-documenting.

export type KitchenSinkDataMode = "static" | "dynamic" | "empty";
export type KitchenSinkDensity = "compact" | "comfortable" | "expanded";
export type KitchenSinkOptionGroupId = "data" | "variant" | "density";

export type ComponentCategory = "hud" | "assets" | "builder" | "chrome" | "primitive" | "background";
export type ComponentStatus = "stable" | "new" | "experimental";

/** Resolved props handed to every component renderer in the catalog. */
export type ComponentRenderProps = {
  width: number;
  height: number;
  color: boolean;
  tick: number;
  variantId: string;
  dataMode: KitchenSinkDataMode;
  density: KitchenSinkDensity;
};

export type ComponentRenderer = (props: ComponentRenderProps) => string;

export type OptionChoice = {
  id: string;
  label: string;
  description?: string;
};

export type OptionGroup = {
  id: KitchenSinkOptionGroupId;
  label: string;
  choices: OptionChoice[];
  defaultChoiceId: string;
};

export type ComponentDefinition = {
  id: string;
  label: string;
  description: string;
  category: ComponentCategory;
  /** Underlying render function name, surfaced in the inspector for traceability. */
  exportName: string;
  status?: ComponentStatus;
  tags?: string[];
  optionGroups: OptionGroup[];
  render: ComponentRenderer;
};

export type NavigationSection = {
  id: string;
  label: string;
  componentIds: string[];
};

// ── Shared option-group builders ──────────────────────────────────────────────

export const dataOptionGroup: OptionGroup = {
  id: "data",
  label: "Data",
  defaultChoiceId: "static",
  choices: [
    { id: "static", label: "Static", description: "Stable snapshot for visual review." },
    { id: "dynamic", label: "Dynamic", description: "Values drift with the demo tick." },
    { id: "empty", label: "Empty", description: "Clean no-data state for the component." }
  ]
};

export const densityOptionGroup: OptionGroup = {
  id: "density",
  label: "Size",
  defaultChoiceId: "comfortable",
  choices: [
    { id: "compact", label: "Small", description: "Tighter layout for constrained terminals." },
    { id: "comfortable", label: "Medium", description: "Default review layout." },
    { id: "expanded", label: "Large", description: "Uses more rows, labels, or detail." }
  ]
};

/** Assemble the standard [data, variant, density] option-group trio for an entry. */
export function componentOptions(defaultVariantId: string, variants: OptionChoice[]): OptionGroup[] {
  return [
    dataOptionGroup,
    { id: "variant", label: "Variant", defaultChoiceId: defaultVariantId, choices: variants },
    densityOptionGroup
  ];
}

/** Maps a density choice to a target inner height for box-based components. */
export function densityHeight(density: KitchenSinkDensity, compact: number, comfortable: number, expanded: number): number {
  return density === "compact" ? compact : density === "expanded" ? expanded : comfortable;
}
