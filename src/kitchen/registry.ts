import { theme, rgb, bold, dim, fitAnsi, formatNumber } from "../tui/ansi.js";
import { box, divider, hstack, keyValue, tableRow } from "../tui/layout.js";
import { bars, dotSparkline } from "@prettui/core/charts";
import type { Rgb } from "@prettui/core/ansi";
import { buildKitchenSinkState, type KitchenSinkState, type BorderStyle, type BackgroundStyle } from "../sim/state.js";
import {
  turboEnemySpecies,
  shipDesignPresets,
  type EnemySpecies
} from "../assets/index.js";
import {
  renderCounters,
  renderBars,
  renderBar,
  renderArcadeHud,
  renderLoading,
  renderEnemyGrid,
  renderShipGrid,
  renderShipDesignBuilder,
  renderBorders,
  renderBackgrounds
} from "../render/widgets.js";
import { renderKitchenSink } from "../render/kitchenSink.js";
import type { KitchenSinkFocus } from "../sim/state.js";
import {
  componentOptions,
  densityHeight,
  type ComponentDefinition,
  type ComponentRenderProps,
  type NavigationSection,
  type OptionChoice
} from "./types.js";

// Tick chosen per data mode: a fixed frame for static review, the live tick for
// dynamic, and 0 for empty (renderers additionally blank their data in empty mode).
function resolveTick(props: ComponentRenderProps): number {
  if (props.dataMode === "dynamic") return props.tick;
  if (props.dataMode === "empty") return 0;
  return 12;
}

function baseState(props: ComponentRenderProps, overrides: Partial<KitchenSinkState> = {}): KitchenSinkState {
  const state = buildKitchenSinkState({
    width: props.width,
    height: props.height,
    color: props.color,
    tick: resolveTick(props)
  });
  return { ...state, ...overrides };
}

function emptyPanel(title: string, props: ComponentRenderProps, accent = theme.border): string {
  const rows: string[] = [];
  const mid = Math.max(0, Math.floor((props.height - 3) / 2));
  for (let i = 0; i < mid; i += 1) rows.push("");
  rows.push(fitAnsi(rgb("— no data —", theme.muted, props.color), props.width - 4));
  return box(title, rows, { width: props.width, height: props.height, color: props.color, accent, paddingX: 1, titleAlign: "left" });
}

const ENEMY_TONE = theme.lime;

// ── HUD components ─────────────────────────────────────────────────────────────

const counters: ComponentDefinition = {
  id: "counters",
  label: "Score Counters",
  description: "Arcade status panel: score, hi-score, wave, chain, and accuracy readouts.",
  category: "hud",
  exportName: "renderCounters",
  status: "stable",
  tags: ["hud", "score", "panel"],
  optionGroups: componentOptions("status", [{ id: "status", label: "Status", description: "Standard player status block." }]),
  render: (props) => {
    if (props.dataMode === "empty") return emptyPanel("◇ STATUS", props, theme.green);
    const height = densityHeight(props.density, 7, 8, 11);
    return renderCounters(props.width, baseState(props), props.color).split("\n").slice(0, height).join("\n");
  }
};

const bars_: ComponentDefinition = {
  id: "bars",
  label: "Vital Bars",
  description: "Stacked progress meters for hull, shield, heat, wave, and threat.",
  category: "hud",
  exportName: "renderBars",
  status: "stable",
  tags: ["hud", "meter", "progress"],
  optionGroups: componentOptions("meters", [{ id: "meters", label: "Meters", description: "Five-channel vitals readout." }]),
  render: (props) => {
    if (props.dataMode === "empty") {
      const empty = { ...baseState(props).bars, hull: 0, shield: 0, heat: 0, waveProgress: 0, threat: 0 };
      return renderBars(props.width, baseState(props, { bars: empty }), props.color);
    }
    return renderBars(props.width, baseState(props), props.color);
  }
};

const bar: ComponentDefinition = {
  id: "bar",
  label: "Meter Bar",
  description: "Single labelled progress meter primitive used across the HUD.",
  category: "primitive",
  exportName: "renderBar",
  status: "stable",
  tags: ["primitive", "meter"],
  optionGroups: componentOptions("hull", [
    { id: "hull", label: "Hull", description: "Green hull meter." },
    { id: "shield", label: "Shield", description: "Blue shield meter." },
    { id: "heat", label: "Heat", description: "Amber heat meter." },
    { id: "threat", label: "Threat", description: "Red threat meter." }
  ]),
  render: (props) => {
    const tones: Record<string, { label: string; tone: keyof typeof theme }> = {
      hull: { label: "HULL", tone: "green" },
      shield: { label: "SHLD", tone: "blue" },
      heat: { label: "HEAT", tone: "amber" },
      threat: { label: "BOSS", tone: "red" }
    };
    const conf = tones[props.variantId] ?? tones.hull!;
    const value = props.dataMode === "empty" ? 0 : props.dataMode === "dynamic" ? 50 + Math.round(Math.sin(props.tick / 8) * 45) : 72;
    const inner = Math.max(12, props.width - 4);
    const rows = [fitAnsi(renderBar(conf.label, value, inner, props.color, conf.tone), inner)];
    return box("renderBar", rows, { width: props.width, height: 3, color: props.color, accent: theme[conf.tone], paddingX: 1, titleAlign: "left" });
  }
};

const arcadeHud: ComponentDefinition = {
  id: "arcade-hud",
  label: "Arcade HUD",
  description: "In-game gameplay HUD with score, level, vitals, mode, special charge, and boss bar.",
  category: "hud",
  exportName: "renderArcadeHud",
  status: "stable",
  tags: ["hud", "gameplay"],
  optionGroups: componentOptions("classic", [
    { id: "classic", label: "Classic", description: "Standard run HUD." },
    { id: "turbo", label: "Turbo", description: "Turbo mode with special charge." },
    { id: "boss", label: "Boss", description: "Adds the boss health bar." }
  ]),
  render: (props) => {
    const charge = props.dataMode === "dynamic" ? (props.tick * 5) % 101 : 60;
    const hp = props.dataMode === "empty" ? 0 : 84;
    const lines = renderArcadeHud(props.width, {
      score: props.dataMode === "empty" ? 0 : 1678,
      highScore: 999999,
      wave: 1,
      level: 2,
      upgradePoints: 240,
      nextUpgradeAt: 1000,
      enemiesRemaining: props.dataMode === "empty" ? 0 : 18,
      hp,
      maxHp: 100,
      shield: props.dataMode === "empty" ? 0 : 85,
      maxShield: 100,
      shieldActive: props.dataMode !== "empty",
      gameMode: props.variantId === "turbo" ? "TURBO" : "CLASSIC",
      ...(props.variantId === "turbo" ? { specialName: "NOVA LANCE", specialCharge: charge } : {}),
      ...(props.variantId === "boss" ? { boss: { name: "Dread Gate V2", hp: 61, maxHp: 100 } } : {})
    }, props.color);
    return box("◇ ARCADE HUD", lines.split("\n"), { width: props.width, height: densityHeight(props.density, 5, 7, 9), color: props.color, accent: theme.cyan, paddingX: 1, titleAlign: "left" });
  }
};

const diagnostics: ComponentDefinition = {
  id: "diagnostics",
  label: "Diagnostics",
  description: "Braille progress spinner and rolling boot-log diagnostics panel.",
  category: "hud",
  exportName: "renderLoading",
  status: "stable",
  tags: ["hud", "loading", "spinner"],
  optionGroups: componentOptions("boot", [{ id: "boot", label: "Boot Log", description: "System boot diagnostics." }]),
  render: (props) => {
    if (props.dataMode === "empty") return emptyPanel("DIAGNOSTICS", props, theme.purple);
    return renderLoading(props.width, baseState(props), props.color);
  }
};

// ── Asset catalogs ─────────────────────────────────────────────────────────────

function gridColumnsForDensity(density: ComponentRenderProps["density"]): number {
  return density === "compact" ? 2 : density === "expanded" ? 5 : 3;
}

const enemyGrid: ComponentDefinition = {
  id: "enemy-grid",
  label: "Enemy Grid",
  description: "Braille sprite catalog for the classic Swarm Armada enemies.",
  category: "assets",
  exportName: "renderEnemyGrid",
  status: "stable",
  tags: ["assets", "sprite", "enemy"],
  optionGroups: componentOptions("classic", [
    { id: "classic", label: "Classic", description: "Swarm Armada lineup." },
    { id: "turbo", label: "Turbo", description: "Turbo-run hazard sprites." }
  ]),
  render: (props) => {
    if (props.dataMode === "empty") return emptyPanel("◇ Enemies", props, ENEMY_TONE);
    // renderEnemyGrid reads enemySpecies directly; for the turbo variant we reuse the
    // ship-grid style helper path by swapping the species via a thin local render.
    const state = baseState(props);
    if (props.variantId === "turbo") return renderSpeciesGrid(turboEnemySpecies, props, ENEMY_TONE, state);
    return renderEnemyGrid(props.width, props.height, state, props.color);
  }
};

const shipGrid: ComponentDefinition = {
  id: "ship-grid",
  label: "Ship Grid",
  description: "Braille sprite catalog for the player fleet chassis family.",
  category: "assets",
  exportName: "renderShipGrid",
  status: "stable",
  tags: ["assets", "sprite", "ship"],
  optionGroups: componentOptions("fleet", [{ id: "fleet", label: "Fleet", description: "Player chassis family." }]),
  render: (props) => {
    if (props.dataMode === "empty") return emptyPanel("◇ Ships", props, theme.cyan);
    return renderShipGrid(props.width, props.height, baseState(props), props.color);
  }
};

// Local species-grid renderer so the catalog can show turbo enemies with the same
// tile styling as renderEnemyGrid without duplicating the game-facing widget.
function renderSpeciesGrid(
  species: EnemySpecies,
  props: ComponentRenderProps,
  accent: Rgb,
  _state: KitchenSinkState
): string {
  const contentWidth = props.width - 4;
  const columns = Math.max(1, Math.min(5, gridColumnsForDensity(props.density)));
  const colWidth = Math.floor((contentWidth - columns + 1) / columns);
  const tiles = species.variants.map((variant) => {
    const sprite = variant.sprite.lines.map((line) => fitAnsi(` ${rgb(line, theme[variant.tone], props.color)}`, colWidth));
    return [fitAnsi(rgb(`▪ ${variant.name}`, theme[variant.tone], props.color), colWidth), ...sprite, fitAnsi(rgb(variant.tags.slice(0, 2).join("."), theme.muted, props.color), colWidth)];
  });
  const rows: string[] = [];
  for (let i = 0; i < tiles.length; i += columns) {
    const group = tiles.slice(i, i + columns);
    const h = Math.max(...group.map((t) => t.length));
    for (let line = 0; line < h; line += 1) rows.push(group.map((t) => fitAnsi(t[line] ?? "", colWidth)).join(" "));
    if (i + columns < tiles.length) rows.push("");
  }
  return box(`◇ Enemies - ${species.displayName}`, rows, { width: props.width, height: props.height, color: props.color, accent, paddingX: 1, titleAlign: "left" });
}

// ── Builder ────────────────────────────────────────────────────────────────────

const builderVariants: OptionChoice[] = shipDesignPresets.map((preset) => ({
  id: preset.id,
  label: preset.name,
  description: `${preset.classId} chassis preset`
}));

const shipBuilder: ComponentDefinition = {
  id: "ship-builder",
  label: "Ship Builder",
  description: "Interactive ship design builder: chassis, paint, modules, cosmetics, and live stats.",
  category: "builder",
  exportName: "renderShipDesignBuilder",
  status: "stable",
  tags: ["builder", "ship", "interactive"],
  optionGroups: componentOptions(builderVariants[0]?.id ?? "preset", builderVariants),
  render: (props) => {
    const preset = shipDesignPresets.find((p) => p.id === props.variantId) ?? shipDesignPresets[0]!;
    return renderShipDesignBuilder(props.width, props.height, {
      design: preset,
      activeSection: "gun",
      activeSlotIndex: props.dataMode === "dynamic" ? Math.floor(props.tick / 7) : 1,
      tick: resolveTick(props),
      showControls: props.density !== "compact"
    }, props.color);
  }
};

// ── Chrome / layout ──────────────────────────────────────────────────────────────

const borderStylesList: BorderStyle[] = [
  "single", "double", "heavy", "arcade", "block", "ornamental", "cyberpunk", "dashed", "terminal", "cryptic"
];

const borders: ComponentDefinition = {
  id: "borders",
  label: "Border Styles",
  description: "Box border family: single, double, heavy, arcade, cyberpunk, and more.",
  category: "chrome",
  exportName: "renderBorders",
  status: "stable",
  tags: ["chrome", "border", "box"],
  optionGroups: componentOptions("arcade", borderStylesList.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
  render: (props) => {
    const style = (borderStylesList.includes(props.variantId as BorderStyle) ? props.variantId : "arcade") as BorderStyle;
    // Live preview of the chosen border plus the full family list.
    const half = Math.max(20, Math.floor((props.width - 1) / 2));
    const preview = box(`${style.toUpperCase()} BORDER`, [
      rgb("Live preview of the", theme.text, props.color),
      rgb(`"${style}" border style.`, theme.muted, props.color),
      "",
      rgb("Used by box() across the UI.", theme.muted, props.color)
    ], { width: half, height: props.height, color: props.color, accent: theme.cyan, paddingX: 1, borderStyle: style, titleAlign: "left" });
    const list = renderBorders(props.width - half - 1, props.height, baseState(props, { borderStyle: style }), props.color);
    return hstack([preview, list], 1);
  }
};

const backgroundStylesList: BackgroundStyle[] = [
  "empty", "stars", "nebula", "warp", "asteroids", "matrix", "nova",
  "blackhole", "pulsar", "radar", "hyperspace", "aurora",
  "fire", "ice", "crt", "sine", "spiral", "rain"
];

const backgrounds: ComponentDefinition = {
  id: "backgrounds",
  label: "Backgrounds",
  description: "Animated starfield/effect backdrops: stars, nebula, warp, matrix, aurora, and more.",
  category: "background",
  exportName: "renderBackgrounds",
  status: "stable",
  tags: ["background", "fx", "animation"],
  optionGroups: componentOptions("stars", backgroundStylesList.map((s) => ({ id: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))),
  render: (props) => {
    const style = (backgroundStylesList.includes(props.variantId as BackgroundStyle) ? props.variantId : "stars") as BackgroundStyle;
    return renderBackgrounds(props.width, props.height, baseState(props, { backgroundStyle: style }), props.color);
  }
};

// ── Primitives ───────────────────────────────────────────────────────────────────

const boxPrimitive: ComponentDefinition = {
  id: "box",
  label: "Box",
  description: "Titled bordered container primitive (extends @prettui/core box with border variants).",
  category: "primitive",
  exportName: "box",
  status: "stable",
  tags: ["primitive", "layout", "container"],
  optionGroups: componentOptions("titled", [
    { id: "titled", label: "Titled", description: "Left-aligned title." },
    { id: "centered", label: "Centered", description: "Centered title." },
    { id: "plain", label: "Plain", description: "No title." }
  ]),
  render: (props) => {
    const body = [
      rgb("box(title, body, options)", theme.text, props.color),
      "",
      rgb("• width / height / paddingX", theme.muted, props.color),
      rgb("• accent / color / titleAlign", theme.muted, props.color),
      rgb("• borderStyle (invader extension)", theme.muted, props.color)
    ];
    return box(props.variantId === "plain" ? "" : "BOX PRIMITIVE", body, {
      width: props.width,
      height: props.height,
      color: props.color,
      accent: theme.blue,
      paddingX: 1,
      titleAlign: props.variantId === "centered" ? "center" : "left"
    });
  }
};

const dividerPrimitive: ComponentDefinition = {
  id: "divider",
  label: "Divider / Key-Value",
  description: "Horizontal divider and aligned key-value row primitives.",
  category: "primitive",
  exportName: "divider, keyValue",
  status: "stable",
  tags: ["primitive", "layout"],
  optionGroups: componentOptions("mixed", [{ id: "mixed", label: "Mixed", description: "Divider + key-value rows." }]),
  render: (props) => {
    const inner = props.width - 4;
    const rows = [
      keyValue("SCORE", rgb(formatNumber(15234), theme.green, props.color), inner, props.color),
      keyValue("WAVE", rgb("03", theme.cyan, props.color), inner, props.color),
      divider(inner, props.color),
      keyValue("ACCURACY", rgb("83%", theme.amber, props.color), inner, props.color),
      keyValue("MODE", rgb("TURBO", theme.purple, props.color), inner, props.color)
    ];
    return box("DIVIDER / KEY-VALUE", rows, { width: props.width, height: densityHeight(props.density, 6, 7, 9), color: props.color, accent: theme.slate, paddingX: 1, titleAlign: "left" });
  }
};

const tablePrimitive: ComponentDefinition = {
  id: "table-row",
  label: "Table Row",
  description: "Fixed-width column row primitive for tabular readouts.",
  category: "primitive",
  exportName: "tableRow",
  status: "stable",
  tags: ["primitive", "table"],
  optionGroups: componentOptions("scores", [{ id: "scores", label: "Scores", description: "Leaderboard-style table." }]),
  render: (props) => {
    const inner = props.width - 4;
    const cols = [Math.floor(inner * 0.5), Math.floor(inner * 0.25), Math.floor(inner * 0.25)];
    const header = rgb(tableRow(["PILOT", "SHIP", "SCORE"], cols), theme.muted, props.color);
    const data = props.dataMode === "empty" ? [] : [
      ["AAA", "Bar L3", formatNumber(15234)],
      ["BOB", "Delta L2", formatNumber(12880)],
      ["CDE", "Wedge L3", formatNumber(9120)]
    ];
    const rows = [header, divider(inner, props.color), ...data.map((r) => tableRow(r, cols))];
    return box("TABLE ROW", rows, { width: props.width, height: densityHeight(props.density, 6, 7, 9), color: props.color, accent: theme.slate, paddingX: 1, titleAlign: "left" });
  }
};

const chartPrimitive: ComponentDefinition = {
  id: "charts",
  label: "Charts",
  description: "Bar and sparkline chart primitives from @prettui/core.",
  category: "primitive",
  exportName: "bars, dotSparkline",
  status: "new",
  tags: ["primitive", "chart", "prettui"],
  optionGroups: componentOptions("bars", [
    { id: "bars", label: "Bars", description: "Vertical bar chart." },
    { id: "spark", label: "Sparkline", description: "Dot sparkline." }
  ]),
  render: (props) => {
    const inner = props.width - 4;
    const seed = [4, 6, 5, 8, 6, 9, 7, 5, 8, 3, 4, 2, 5, 3, 7, 4, 6, 2];
    const values = props.dataMode === "empty" ? [] : props.dataMode === "dynamic" ? seed.map((v, i) => 1 + ((v + props.tick + i) % 9)) : seed;
    const accent = props.variantId === "spark" ? theme.cyan : theme.green;
    const chart = props.variantId === "spark" ? dotSparkline(values, inner, accent, props.color) : bars(values, inner, accent, props.color);
    const rows = [rgb(`@prettui/core ${props.variantId === "spark" ? "dotSparkline()" : "bars()"}`, theme.muted, props.color), "", chart];
    return box("CHARTS", rows, { width: props.width, height: densityHeight(props.density, 6, 7, 9), color: props.color, accent, paddingX: 1, titleAlign: "left" });
  }
};

const overviewVariants: OptionChoice[] = [
  { id: "enemies", label: "Enemies", description: "Highlight the enemy grid." },
  { id: "ships", label: "Ships", description: "Highlight the ship grid." },
  { id: "designs", label: "Designs", description: "Show the ship builder column." },
  { id: "counters", label: "Counters", description: "Highlight the status panel." }
];

const overview: ComponentDefinition = {
  id: "overview-dashboard",
  label: "Dashboard Overview",
  description: "The all-panels arcade dashboard composing counters, bars, grids, builder, borders, and backgrounds.",
  category: "chrome",
  exportName: "renderKitchenSink",
  status: "stable",
  tags: ["composite", "dashboard"],
  optionGroups: componentOptions("enemies", overviewVariants),
  render: (props) =>
    renderKitchenSink({
      width: Math.max(80, props.width),
      height: Math.max(24, props.height),
      color: props.color,
      tick: resolveTick(props),
      focus: props.variantId as KitchenSinkFocus
    })
};

export const kitchenSinkComponents: ComponentDefinition[] = [
  counters,
  bars_,
  arcadeHud,
  diagnostics,
  enemyGrid,
  shipGrid,
  shipBuilder,
  borders,
  backgrounds,
  boxPrimitive,
  dividerPrimitive,
  tablePrimitive,
  bar,
  chartPrimitive,
  overview
];

export const kitchenSinkNavigationSections: NavigationSection[] = [
  { id: "hud", label: "HUD & Status", componentIds: ["counters", "bars", "arcade-hud", "diagnostics"] },
  { id: "assets", label: "Sprite Catalogs", componentIds: ["enemy-grid", "ship-grid"] },
  { id: "builder", label: "Ship Builder", componentIds: ["ship-builder"] },
  { id: "chrome", label: "Chrome & FX", componentIds: ["borders", "backgrounds"] },
  { id: "primitives", label: "Primitives", componentIds: ["box", "divider", "table-row", "bar", "charts"] },
  { id: "composite", label: "Composite", componentIds: ["overview-dashboard"] }
];

export function componentIndexById(id: string): number {
  return Math.max(0, kitchenSinkComponents.findIndex((c) => c.id === id));
}
