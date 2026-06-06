import {
  buildDefaultShipDesign,
  enemySpecies,
  getCompatibleModulesForSlot,
  getCosmeticPartsForSlot,
  getModulesForDesignSlot,
  getShipClassConfig,
  getSelectedCosmeticPart,
  getSelectedDesignModule,
  resolveShipDesign,
  shipCallsigns,
  shipClassConfigs,
  shipCosmeticSlots,
  shipDesignModuleSlots,
  shipFamily,
  shipPaintSchemes,
  type GameAssetVariant,
  type ShipCosmeticPart,
  type ShipCosmeticSlot,
  type ShipCosmeticSlotId,
  type ShipDesign,
  type ShipDesignModuleSlot,
  type ShipDesignModuleSlotId,
  type ShipModule,
  type ShipStatKey
} from "../assets/index.js";
import { fitAnsi, joinAligned, rgb, theme, truncate, visibleLength } from "../tui/ansi.js";
import { box, borderStyles, hstack, splitRatioWidths } from "../tui/layout.js";
import type { KitchenSinkFocus, KitchenSinkState, BorderStyle, BackgroundStyle } from "../sim/state.js";
import { renderSprite } from "./sprites.js";

function focusMark(focus: KitchenSinkFocus, panel: KitchenSinkFocus): string {
  return focus === panel ? "◆" : "◇";
}

export function renderFooter(width: number, state: KitchenSinkState, color = true): string {
  return box(
    "",
    ["[q] Quit   [p] Pause   [t] Focus   [b] Border Style   [v] Background"],
    { width, height: 3, color, accent: theme.border, paddingX: 1 }
  );
}

export function renderCounters(width: number, state: KitchenSinkState, color = true): string {
  const c = state.counters;
  const innerWidth = width - 4;
  const score = String(c.score).padStart(6, "0");
  const hiScore = String(c.highScore).padStart(6, "0");
  const rows = [
    fitAnsi(`${rgb("1UP", theme.green, color)} ${score}   ${rgb("HI", theme.purple, color)} ${hiScore}`, innerWidth),
    fitAnsi(`${rgb("WAVE", theme.cyan, color)} ${String(c.wave).padStart(2, "0")}   ${rgb("CHAIN", theme.lime, color)} x${String(c.combo).padStart(2, "0")}`, innerWidth),
    fitAnsi(`${rgb("BUGS", theme.red, color)} ${String(c.enemiesRemaining).padStart(3, "0")}  ${rgb("SHOT", theme.blue, color)} ${String(c.shotsFired).padStart(4, "0")}`, innerWidth),
    fitAnsi(`${rgb("ACC ", theme.green, color)} ${String(c.accuracy).padStart(3, "0")}%   ${rgb("MODE", theme.slate, color)} AUTO`, innerWidth),
    "",
    fitAnsi(`${rgb("READY", theme.amber, color)} PLAYER-01`, innerWidth)
  ];
  return box(`${focusMark(state.focus, "counters")} STATUS`, rows, { width, height: 8, color, accent: theme.green, paddingX: 1, titleAlign: "left" });
}

export function renderBar(label: string, value: number, width: number, color = true, tone: keyof typeof theme = "cyan"): string {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const meterWidth = Math.max(4, width - 11);
  const filled = Math.max(0, Math.min(meterWidth, Math.round((clamped / 100) * meterWidth)));
  const empty = Math.max(0, meterWidth - filled);
  const meter = `${rgb("■".repeat(filled), theme[tone], color)}${rgb("□".repeat(empty), theme.grid, color)}`;
  return fitAnsi(`${fitAnsi(label, 4)} [${meter}] ${String(clamped).padStart(3, "0")}`, width);
}

export type ArcadeHudState = {
  score: number;
  highScore: number;
  wave: number;
  level: number;
  upgradePoints: number;
  nextUpgradeAt: number | null;
  enemiesRemaining: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldActive: boolean;
  gameMode?: string;
  specialName?: string;
  specialCharge?: number;
  boss?: {
    name: string;
    hp: number;
    maxHp: number;
  };
};

function percentage(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export function renderArcadeHud(width: number, state: ArcadeHudState, color = true): string {
  const scoreLine = joinAligned(
    `${rgb("1UP", theme.green, color)} ${String(state.score).padStart(6, "0")}   ${rgb("HI", theme.purple, color)} ${String(state.highScore).padStart(6, "0")}`,
    `${rgb("WAVE", theme.cyan, color)} ${String(state.wave).padStart(2, "0")}   ${rgb("BUGS", theme.red, color)} ${String(state.enemiesRemaining).padStart(2, "0")}`,
    width,
    3
  );

  const upgradeText = state.nextUpgradeAt
    ? `${rgb("STAR", theme.amber, color)} ${String(state.upgradePoints).padStart(3, "0")}/${state.nextUpgradeAt}`
    : `${rgb("STAR", theme.amber, color)} MAX`;
  const vitals = [
    renderBar("HP", percentage(state.hp, state.maxHp), 22, color, "green")
  ];
  if (state.shieldActive) {
    vitals.push(renderBar("SHLD", percentage(state.shield, state.maxShield), 24, color, "blue"));
  }

  const levelLine = joinAligned(
    `${rgb("LV", theme.lime, color)} ${state.level}   ${upgradeText}`,
    vitals.join("  "),
    width,
    3
  );

  const rows = [
    fitAnsi(scoreLine, width),
    fitAnsi(levelLine, width)
  ];

  if (state.gameMode || state.specialName) {
    const modeText = `${rgb("MODE", state.gameMode === "TURBO" ? theme.amber : theme.cyan, color)} ${state.gameMode ?? "CLASSIC"}`;
    const specialCharge = Math.max(0, Math.min(100, Math.round(state.specialCharge ?? 0)));
    const specialText = state.specialName
      ? `${rgb("SPEC", specialCharge >= 100 ? theme.lime : theme.amber, color)} ${state.specialName} ${String(specialCharge).padStart(3, "0")}%`
      : "";
    rows.push(fitAnsi(joinAligned(modeText, specialText, width, 3), width));
  }

  if (state.boss) {
    const bossName = truncate(state.boss.name.toUpperCase(), 18);
    rows.push(
      fitAnsi(
        `${rgb("BOSS", theme.red, color)} ${fitAnsi(bossName, 18)} ${renderBar("", percentage(state.boss.hp, state.boss.maxHp), Math.max(18, width - 26), color, "red").trimStart()}`,
        width
      )
    );
  }

  return rows.join("\n");
}

export function renderBars(width: number, state: KitchenSinkState, color = true): string {
  const rows = [
    renderBar("HP", state.bars.hull, width - 4, color, "green"),
    renderBar("SHLD", state.bars.shield, width - 4, color, "blue"),
    renderBar("HEAT", state.bars.heat, width - 4, color, "amber"),
    renderBar("WAVE", state.bars.waveProgress, width - 4, color, "cyan"),
    renderBar("BOSS", state.bars.threat, width - 4, color, "red")
  ];
  return box("HUD", rows, { width, height: 8, color, accent: theme.blue, paddingX: 1, titleAlign: "left" });
}

function renderAssetTile(variant: GameAssetVariant, selected: boolean, width: number, color = true, pulse = 0): string[] {
  const title = selected ? rgb(`■ ${variant.name}`, theme[variant.tone], color) : `▪ ${variant.name}`;
  return [
    fitAnsi(truncate(title, width), width),
    ...renderSprite(variant, color, pulse).map((line) => fitAnsi(` ${line}`, width)),
    fitAnsi(rgb(variant.tags.slice(0, 2).join("."), theme.muted, color), width)
  ];
}

function gridTiles(tiles: string[][], width: number, columns: number): string[] {
  const gap = 1;
  const columnWidth = Math.floor((width - gap * (columns - 1)) / columns);
  const rows: string[] = [];
  for (let index = 0; index < tiles.length; index += columns) {
    const group = tiles.slice(index, index + columns);
    const tileHeight = Math.max(...group.map((tile) => tile.length));
    for (let line = 0; line < tileHeight; line += 1) {
      rows.push(group.map((tile) => fitAnsi(tile[line] ?? "", columnWidth)).join(" ".repeat(gap)));
    }
    if (index + columns < tiles.length) rows.push("");
  }
  return rows;
}

export function renderEnemyGrid(width: number, height: number, state: KitchenSinkState, color = true): string {
  const contentWidth = width - 4;
  const columns = Math.max(1, Math.min(5, Math.floor((contentWidth + 1) / 14)));
  const tiles = enemySpecies.variants.map((variant, index) => renderAssetTile(variant, index === state.selectedEnemyIndex, Math.floor((contentWidth - columns + 1) / columns), color, state.tick % 2));
  const rows = gridTiles(tiles, contentWidth, columns);
  return box(`${focusMark(state.focus, "enemies")} Enemies - ${enemySpecies.displayName}`, rows, { width, height, color, accent: theme.lime, paddingX: 1, titleAlign: "left" });
}

export function renderShipGrid(width: number, height: number, state: KitchenSinkState, color = true): string {
  const contentWidth = width - 4;
  const columns = Math.max(1, Math.min(5, Math.floor((contentWidth + 1) / 14)));
  const tiles = shipFamily.variants.map((variant, index) => renderAssetTile(variant, index === state.selectedShipIndex, Math.floor((contentWidth - columns + 1) / columns), color, state.tick % 2));
  const rows = gridTiles(tiles, contentWidth, columns);
  return box(`${focusMark(state.focus, "ships")} Ships - ${shipFamily.displayName}`, rows, { width, height, color, accent: theme.cyan, paddingX: 1, titleAlign: "left" });
}

export type ShipBuilderSection = "color" | ShipCosmeticSlotId | ShipDesignModuleSlotId | "callsign";

export type ShipBuilderRenderState = {
  design: ShipDesign;
  activeSection?: ShipBuilderSection;
  activeSlotIndex?: number;
  level?: number;
  tick?: number;
  showControls?: boolean;
};

function centerAnsi(text: string, width: number): string {
  const len = visibleLength(text);
  if (len >= width) return truncate(text, width);
  const left = Math.floor((width - len) / 2);
  return fitAnsi(`${" ".repeat(left)}${text}`, width);
}

function sectionLabel(label: string, active: boolean, width: number, color = true): string {
  const marker = active ? ">" : " ";
  const text = `${marker} ${label}`;
  return fitAnsi(active ? rgb(text, theme.amber, color) : rgb(text, theme.muted, color), width);
}

function selectedRows<T>(
  items: T[],
  selectedIndex: number,
  maxRows: number,
  render: (item: T, index: number, selected: boolean) => string
): string[] {
  if (items.length <= maxRows) {
    return items.map((item, index) => render(item, index, index === selectedIndex));
  }
  const clamped = Math.max(0, Math.min(items.length - 1, selectedIndex));
  const start = Math.max(0, Math.min(items.length - maxRows, clamped - Math.floor(maxRows / 2)));
  return items.slice(start, start + maxRows).map((item, offset) => {
    const index = start + offset;
    return render(item, index, index === selectedIndex);
  });
}

function statCell(label: string, value: number, baseline: number, tone: keyof typeof theme, color = true): string {
  const current = Math.round(value);
  const delta = current - Math.round(baseline);
  const deltaText = delta === 0 ? "..." : delta > 0 ? `+${delta}` : String(delta);
  const deltaTone = delta === 0 ? theme.muted : delta > 0 ? theme.green : theme.red;
  return `${rgb(label.padEnd(4), theme[tone], color)} ${String(current).padStart(3, "0")} ${rgb(deltaText.padStart(4), deltaTone, color)}`;
}

function renderDesignStats(design: ShipDesign, width: number, color = true, level = 1): string[] {
  const resolved = resolveShipDesign(design, level);
  const baseline = resolveShipDesign(buildDefaultShipDesign(design.classId), level);
  const stats = resolved.stats;
  const baselineStats = baseline.stats;
  const cells: Array<[string, ShipStatKey, keyof typeof theme]> = [
    ["HULL", "hull", "green"],
    ["SHLD", "shield", "blue"],
    ["SPD", "speed", "amber"],
    ["TURN", "turnRate", "lime"],
    ["DMG", "projectileDamage", "red"],
    ["RATE", "fireRate", "cyan"],
    ["SPRD", "spread", "purple"],
    ["STAR", "powerUpAffinity", "white"]
  ];
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 2) {
    const left = cells[index]!;
    const right = cells[index + 1]!;
    rows.push(
      joinAligned(
        statCell(left[0], stats[left[1]], baselineStats[left[1]], left[2], color),
        statCell(right[0], stats[right[1]], baselineStats[right[1]], right[2], color),
        width,
        2
      )
    );
  }
  return [
    ...rows
  ].map((line) => fitAnsi(line, width));
}

function renderModuleOptionRows(
  modules: ShipModule[],
  currentModuleId: string | undefined,
  width: number,
  color = true,
  maxRows = 3
): string[] {
  const options: Array<ShipModule | undefined> = [undefined, ...modules];
  const selectedIndex = Math.max(0, options.findIndex((module) => module?.id === currentModuleId));
  return selectedRows(options, selectedIndex, maxRows, (module, _index, selected) => {
    const marker = selected ? "■" : "▪";
    const name = module ? module.name : "Empty hardpoint";
    const category = module ? module.category.toUpperCase() : "OPEN";
    const tone = module ? theme[module.tone] : theme.muted;
    const line = `${marker} ${fitAnsi(name, Math.max(6, width - 13))} ${category}`;
    return fitAnsi(selected ? rgb(line, tone, color) : rgb(line, theme.muted, color), width);
  });
}

function renderCosmeticOptionRows(
  parts: ShipCosmeticPart[],
  currentPartId: string | undefined,
  width: number,
  color = true,
  maxRows = 4
): string[] {
  const selectedIndex = Math.max(0, parts.findIndex((part) => part.id === currentPartId));
  return selectedRows(parts, selectedIndex, maxRows, (part, _index, selected) => {
    const marker = selected ? "■" : "▪";
    const statText = Object.entries(part.statModifiers)
      .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key.toUpperCase().slice(0, 4)}`)
      .slice(0, 1)
      .join("");
    const suffix = statText ? statText : part.marker === " " ? "HOLE" : part.marker;
    const line = `${marker} ${fitAnsi(part.name, Math.max(6, width - 10))} ${suffix}`;
    return fitAnsi(selected ? rgb(line, theme[part.tone], color) : rgb(line, theme.muted, color), width);
  });
}

function renderPaintOptionRows(currentPaintId: string, width: number, color = true, maxRows = 7): string[] {
  const selectedIndex = Math.max(0, shipPaintSchemes.findIndex((paint) => paint.id === currentPaintId));
  return selectedRows(shipPaintSchemes, selectedIndex, maxRows, (paint, _index, selected) => {
    const marker = selected ? "■" : "▪";
    const line = `${marker} ${fitAnsi(paint.name, Math.max(6, width - 4))}`;
    return fitAnsi(selected ? rgb(line, theme[paint.tone], color) : rgb(line, theme.muted, color), width);
  });
}

function renderCallsignOptionRows(currentName: string, width: number, color = true, maxRows = 6): string[] {
  const callsigns = [...shipCallsigns];
  const selectedIndex = Math.max(0, callsigns.findIndex((callsign) => callsign === currentName));
  return selectedRows(callsigns, selectedIndex, maxRows, (callsign, _index, selected) => {
    const marker = selected ? "■" : "▪";
    const line = `${marker} ${callsign}`;
    return fitAnsi(selected ? rgb(line, theme.white, color) : rgb(line, theme.muted, color), width);
  });
}

function getBuilderModuleSection(section: ShipBuilderSection): ShipDesignModuleSlot | undefined {
  return shipDesignModuleSlots.find((slot) => slot.id === section);
}

function getBuilderCosmeticSection(section: ShipBuilderSection): ShipCosmeticSlot | undefined {
  return shipCosmeticSlots.find((slot) => slot.id === section);
}

function groupLabel(label: string, width: number, color = true): string {
  return fitAnsi(rgb(label, theme.cyan, color), width);
}

function renderBuildRow(label: string, value: string, active: boolean, width: number, tone: keyof typeof theme = "muted", color = true): string {
  const marker = active ? ">" : " ";
  const labelWidth = Math.max(5, Math.min(11, Math.floor(width * 0.34)));
  const line = `${marker} ${fitAnsi(label, labelWidth)} ${value}`;
  return fitAnsi(active ? rgb(line, theme[tone], color) : rgb(line, theme.muted, color), width);
}

export function renderShipDesignBuilder(width: number, height: number, state: ShipBuilderRenderState, color = true): string {
  const safeHeight = Math.max(12, Math.floor(height));
  const contentWidth = Math.max(8, width - 4);
  const resolved = resolveShipDesign(state.design, state.level ?? 1);
  const activeSection = state.activeSection ?? "color";
  const activeSlotIndex = Math.max(0, Math.min(resolved.slots.length - 1, state.activeSlotIndex ?? 0));
  const activeSlot = resolved.slots[activeSlotIndex];
  const wide = contentWidth >= 54;
  const [leftWidth, rightWidth] = wide
    ? splitRatioWidths(contentWidth, [34, 48], 1, [25, 24])
    : [contentWidth, contentWidth];
  const paint = shipPaintSchemes.find((candidate) => candidate.id === state.design.paintId) ?? shipPaintSchemes[0]!;
  const cosmeticRows = shipCosmeticSlots.map((slot) => {
    const part = getSelectedCosmeticPart(state.design, slot.id);
    return renderBuildRow(slot.shortLabel, part.name, activeSection === slot.id, leftWidth!, part.tone, color);
  });
  const moduleRows = shipDesignModuleSlots.map((slot) => {
    const module = getSelectedDesignModule(state.design, slot.id);
    return renderBuildRow(slot.shortLabel, module?.name ?? "Stock", activeSection === slot.id, leftWidth!, module?.tone ?? "muted", color);
  });

  const leftRows = [
    fitAnsi(`${rgb("BASE", theme.cyan, color)} ${resolved.className}`, leftWidth!),
    groupLabel("BUILD OPTIONS", leftWidth!, color),
    groupLabel("FRAME", leftWidth!, color),
    renderBuildRow("COLOR", paint.name, activeSection === "color", leftWidth!, paint.tone, color),
    ...cosmeticRows,
    groupLabel("EQUIPMENT", leftWidth!, color),
    ...moduleRows,
    groupLabel("PILOT", leftWidth!, color),
    renderBuildRow("NAME", state.design.name, activeSection === "callsign", leftWidth!, "white", color)
  ];

  if (state.showControls) {
    leftRows.push(
      fitAnsi(rgb("W/S row  A/D option", theme.muted, color), leftWidth!),
      fitAnsi(rgb("Enter launch  Space back", theme.cyan, color), leftWidth!),
      fitAnsi(rgb("N preset  R stock", theme.muted, color), leftWidth!)
    );
  }

  const spriteRows = renderSprite(resolved.variant, color, state.tick ?? 0).map((line) => centerAnsi(line, rightWidth!));
  const activeBuildSlot = getBuilderModuleSection(activeSection);
  const activeCosmeticSlot = getBuilderCosmeticSection(activeSection);
  const selectedModule = activeBuildSlot ? getSelectedDesignModule(state.design, activeBuildSlot.id) : undefined;
  const selectedCosmetic = activeCosmeticSlot ? getSelectedCosmeticPart(state.design, activeCosmeticSlot.id) : undefined;
  const optionRows = activeSection === "color"
    ? renderPaintOptionRows(state.design.paintId, rightWidth!, color, 4)
    : activeSection === "callsign"
      ? renderCallsignOptionRows(state.design.name, rightWidth!, color, 4)
      : activeCosmeticSlot
        ? renderCosmeticOptionRows(getCosmeticPartsForSlot(activeCosmeticSlot.id), selectedCosmetic?.id, rightWidth!, color, 4)
        : activeBuildSlot
          ? renderModuleOptionRows(getModulesForDesignSlot(activeBuildSlot.id), selectedModule?.id, rightWidth!, color, 4)
          : [];
  const activeDescription = activeSection === "color"
    ? paint.role
    : activeSection === "callsign"
      ? "Pilot callsign shown on ship reports."
      : activeCosmeticSlot
        ? selectedCosmetic?.role ?? activeCosmeticSlot.role
        : selectedModule?.role ?? activeBuildSlot?.role ?? "Choose a build option.";
  const optionHeading = activeSection === "color"
    ? "COLORS"
    : activeSection === "callsign"
      ? "CALLSIGNS"
      : activeCosmeticSlot
        ? activeCosmeticSlot.label.toUpperCase()
        : activeBuildSlot?.label.toUpperCase() ?? "OPTIONS";
  const hardpointRows = selectedRows(resolved.slots, activeSlotIndex, 4, (slot) => {
    const moduleName = slot.module?.name ?? "Stock";
    const tone = slot.module ? theme[slot.module.tone] : theme.muted;
    return fitAnsi(rgb(`${slot.point.label}: ${moduleName}`, tone, color), rightWidth!);
  });

  const rightRows = [
    centerAnsi(rgb(resolved.name.toUpperCase(), theme.white, color), rightWidth!),
    centerAnsi(rgb(`${resolved.className} L${state.level ?? 1}`, theme.muted, color), rightWidth!),
    ...spriteRows,
    ...renderDesignStats(state.design, rightWidth!, color, state.level ?? 1),
    fitAnsi(rgb("VISIBLE HARDPOINTS", theme.cyan, color), rightWidth!),
    ...hardpointRows,
    fitAnsi(rgb(optionHeading, theme.amber, color), rightWidth!),
    ...optionRows,
    fitAnsi(rgb(activeDescription, theme.muted, color), rightWidth!)
  ];

  const rows = wide ? hstack([leftRows.join("\n"), rightRows.join("\n")], 1).split("\n") : [...leftRows, "", ...rightRows];
  return box(" SHIP BUILDER ", rows, {
    width,
    height: safeHeight,
    color,
    accent: activeSection === "color" ? theme[paint.tone] : theme.cyan,
    borderStyle: "arcade",
    paddingX: 1,
    titleAlign: "left"
  });
}

function buildBrailleProgressBar(percent: number, width: number): string {
  const blockCount = Math.floor((percent / 100) * width);
  const remainder = ((percent / 100) * width) - blockCount;
  let bar = "⣿".repeat(blockCount);
  if (blockCount < width) {
    if (remainder > 0.75) bar += "⣷";
    else if (remainder > 0.5) bar += "⣵";
    else if (remainder > 0.25) bar += "⣄";
    else if (remainder > 0) bar += "⡀";
    else bar += "⠀";
  }
  while (bar.length < width) bar += "⠀";
  return bar;
}

export function renderLoading(width: number, state: KitchenSinkState, color = true): string {
  const percent = (state.tick * 4) % 101;
  const spinners = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinner = spinners[state.tick % spinners.length]!;
  
  const innerWidth = width - 4;
  const barWidth = Math.max(5, innerWidth - 11);
  const brailleBar = buildBrailleProgressBar(percent, barWidth);
  const barColor = percent < 30 ? theme.red : percent < 70 ? theme.amber : theme.green;
  
  const diagnostics = [
    "UPLINK SECURE (128-BIT)",
    "DECRYPTING SECTOR DATA",
    "SCANNING ARMADA GRID ",
    "RESOLVING TELEMETRY  ",
    "SYNCING SHIELD CORES ",
    "INITIALIZING WEAPONS ",
    "CALIBRATING RADAR    ",
    "ESTABLISHING PROTOCOL"
  ];
  
  const logs: string[] = [];
  const currentLogIndex = Math.floor(state.tick / 5);
  for (let i = 2; i >= 0; i--) {
    const idx = (currentLogIndex - i + diagnostics.length) % diagnostics.length;
    const isCurrent = i === 0;
    const prefix = isCurrent ? rgb(spinner, theme.purple, color) : rgb("✔", theme.green, color);
    logs.push(fitAnsi(`${prefix} ${diagnostics[idx]}`, innerWidth));
  }

  const rows = [
    fitAnsi(`${rgb(spinner, theme.purple, color)}  ${String(percent).padStart(3, "0")}% [${rgb(brailleBar, barColor, color)}]`, innerWidth),
    "",
    logs[0]!,
    logs[1]!,
    logs[2]!,
    ""
  ];

  return box("DIAGNOSTICS", rows, {
    width,
    height: 8,
    color,
    accent: theme.purple,
    paddingX: 1,
    titleAlign: "left"
  });
}


export function renderBorders(width: number, height: number, state: KitchenSinkState, color = true): string {
  const styles: BorderStyle[] = [
    "single", "double", "heavy", "arcade", "block", 
    "ornamental", "cyberpunk", "dashed", "terminal", "cryptic"
  ];
  const innerWidth = width - 4;
  const contentHeight = height - 2;
  const selectedIndex = styles.indexOf(state.borderStyle);

  // Implement scrolling window for border options list
  let startIdx = 0;
  if (selectedIndex >= contentHeight) {
    startIdx = selectedIndex - contentHeight + 1;
  }
  const visibleStyles = styles.slice(startIdx, startIdx + contentHeight);

  const rows = visibleStyles.map((style) => {
    const isSelected = style === state.borderStyle;
    const bullet = isSelected ? "■" : "▪";
    const displayName = style.charAt(0).toUpperCase() + style.slice(1);
    const lineChar = borderStyles[style]?.ht ?? "─";
    const linePreview = lineChar.repeat(3);
    const labelWidth = Math.max(5, innerWidth - 8);
    const text = `${bullet} ${fitAnsi(displayName, labelWidth)} [${linePreview}]`;
    return isSelected ? rgb(text, theme.purple, color) : rgb(text, theme.muted, color);
  });

  return box("BORDERS", rows, {
    width,
    height,
    color,
    accent: theme.purple,
    paddingX: 1,
    titleAlign: "left",
    borderStyle: state.borderStyle
  });
}

type BackgroundRenderer = (innerWidth: number, contentHeight: number, tick: number, color: boolean) => string[];

const backgroundRenderers: Record<BackgroundStyle, BackgroundRenderer> = {
  empty: (w, h, tick, color) => {
    return Array.from({ length: h }, () => " ".repeat(w));
  },
  stars: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const isStarCol = ((x * 127 + 43) % 100) < 6;
        if (isStarCol) {
          const speed = ((x * 31 + 17) % 3) + 1;
          const char = speed === 3 ? "·" : speed === 2 ? "°" : ".";
          const starY = Math.floor((x * 7 + tick * (speed * 0.15)) % h);
          if (starY === y) {
            line += speed === 3 ? rgb(char, theme.white, color) : speed === 2 ? rgb(char, theme.muted, color) : rgb(char, theme.border, color);
          } else {
            line += " ";
          }
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },

  nebula: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const val1 = Math.sin(x * 0.12 + tick * 0.04) * Math.cos(y * 0.25 - tick * 0.02);
        const val2 = Math.cos(x * 0.08 - tick * 0.02) * Math.sin(y * 0.15 + tick * 0.03);
        const val = (val1 + val2) / 2;
        if (val > 0.55) {
          line += rgb("▓", theme.purple, color);
        } else if (val > 0.35) {
          line += rgb("▒", theme.blue, color);
        } else if (val > 0.15) {
          line += rgb("░", theme.grid, color);
        } else if (val > -0.1) {
          if ((x * 17 + y * 23) % 29 === 0) {
            line += rgb("·", theme.muted, color);
          } else {
            line += " ";
          }
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  warp: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) * 2;
        const dy = (y - cy) * 4;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1.5) {
          line += " ";
          continue;
        }
        const angle = Math.atan2(dy, dx);
        const numRays = 24;
        const rayIndex = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * numRays);
        const seed = (rayIndex * 13 + 7) % 100;
        const speed = 0.8 + (seed % 3) * 0.4;
        const maxDist = Math.max(cx * 2, cy * 4);
        const pos = (tick * speed + seed * 6) % maxDist;
        if (Math.abs(dist - pos) < 1.5) {
          const absAngle = Math.abs(angle);
          let streakChar = "·";
          if (absAngle < Math.PI / 8 || absAngle > 7 * Math.PI / 8) {
            streakChar = "─";
          } else if (absAngle > 3 * Math.PI / 8 && absAngle < 5 * Math.PI / 8) {
            streakChar = "│";
          } else if ((angle >= 0 && angle <= Math.PI) ? (angle < Math.PI / 2) : (angle < -Math.PI / 2)) {
            streakChar = "\\";
          } else {
            streakChar = "/";
          }
          const cTone = dist > maxDist * 0.6 ? theme.white : theme.cyan;
          line += rgb(streakChar, cTone, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  asteroids: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const lane = y % 3;
        const speed = 0.35 + lane * 0.2;
        const offset = (x + tick * speed + y * 17) % (w + 30);
        const rockPos = w - Math.floor(offset);
        const rockChars = ["▞", "▚", "⛯", "⬡", "⬢"];
        const isRock = (y % 2 === 0) && (Math.abs(x - rockPos) < 2) && ((y * 37) % 7 < 4);
        if (isRock) {
          const charIdx = (y + Math.floor(tick * 0.04)) % rockChars.length;
          const char = rockChars[charIdx]!;
          const tone = (y % 4 === 0) ? theme.amber : theme.muted;
          line += rgb(char, tone, color);
        } else {
          const starSpeed = 0.1;
          const starOffset = Math.floor(tick * starSpeed) % w;
          const starX = (x + starOffset) % w;
          if ((starX * 11 + y * 7) % 83 === 0) {
            line += rgb("·", theme.muted, color);
          } else {
            line += " ";
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  matrix: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const speed = 0.45 + ((x * 23) % 4) * 0.15;
        const streamLen = 8 + (x % 5);
        const headY = Math.floor((tick * speed + x * 9) % (h + streamLen + 5));
        const dist = headY - y;
        if (dist >= 0 && dist < streamLen && x % 3 === 0) {
          const chars = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890";
          const char = chars[(x * 5 + y + tick) % chars.length]!;
          if (dist === 0) {
            line += rgb(char, theme.white, color);
          } else if (dist < 4) {
            line += rgb(char, theme.green, color);
          } else {
            line += rgb(char, theme.muted, color);
          }
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  nova: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    
    const coreChars = ["█", "▓", "▒", "░"];
    const coreChar = coreChars[tick % coreChars.length]!;
    const coreColors = [theme.white, theme.amber, theme.red, theme.amber];
    const coreColor = coreColors[tick % coreColors.length]!;

    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) * 2;
        const dy = (y - cy) * 3;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const pulse = 2.4 + Math.sin(tick * 0.9) * 1.5;
        if (dist < pulse) {
          const intensityChar = dist < pulse * 0.45 ? "█" : dist < pulse * 0.8 ? coreChar : "▒";
          line += rgb(intensityChar, coreColor, color);
        } else {
          const flareVal = Math.sin(angle * 8 + tick * 0.5) * Math.cos(angle * 4 - tick * 0.2);
          const onRay = flareVal > 0.35 && dist < 18;

          const ejectaDist = (tick * 1.1) % 6;
          const onEjecta = Math.floor((dist - ejectaDist) % 6) === 0 && dist < 24;

          const ember = (x * 17 + y * 23 + tick * 5) % 31 === 0;

          if (onEjecta) {
            line += rgb(dist < 10 ? "█" : dist < 18 ? "▒" : "·", theme.red, color);
          } else if (onRay) {
            const flareChar = dist < 8 ? "▓" : dist < 13 ? "▒" : "░";
            line += rgb(flareChar, theme.amber, color);
          } else if (ember && dist < 20) {
            line += rgb(tick % 2 === 0 ? "+" : "°", theme.amber, color);
          } else {
            if ((x * 13 + y * 7 + tick) % 73 === 0) {
              line += rgb(".", theme.muted, color);
            } else {
              line += " ";
            }
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  blackhole: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) * 2;
        const dy = (y - cy) * 3;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const inJet = Math.abs(x - cx) < 3 && dist > 1.2 && dist < h;
        if (inJet) {
          const isCoreJet = Math.abs(x - cx) < 1;
          const direction = y < cy ? -1 : 1;
          const flowIndex = Math.floor(y - direction * tick * 2.8 + h * 10) % 3;
          if (flowIndex === 0) {
            const char = isCoreJet ? "|" : direction === -1 ? "^" : "v";
            line += rgb(char, theme.blue, color);
            continue;
          }
        }

        if (dist < 2.0) {
          line += " ";
        } else if (dist < 4.0) {
          const innerPulse = tick % 2 === 0 ? "█" : "▓";
          line += rgb(innerPulse, theme.purple, color);
        } else {
          const twist = dist * 0.3 - tick * 0.5;
          const onArm1 = Math.abs(Math.sin(angle + twist)) > 0.88;
          const onArm2 = Math.abs(Math.sin(angle + twist + Math.PI / 2)) > 0.88;

          const hotSpotAngle = tick * 0.45;
          const hotSpotDiff = (angle - hotSpotAngle + Math.PI * 2) % (Math.PI * 2);
          const inHotSpot = hotSpotDiff < 0.5 && dist > 5 && dist < 11;

          if (inHotSpot) {
            line += rgb(tick % 2 === 0 ? "█" : "▓", theme.white, color);
          } else if ((onArm1 || onArm2) && dist < 18) {
            const char = dist < 7 ? "▓" : dist < 12 ? "▒" : "░";
            const tone = dist < 7 ? theme.amber : dist < 12 ? theme.purple : theme.blue;
            line += rgb(char, tone, color);
          } else {
            const lensOffset = dist + Math.sin(tick * 0.15) * 0.8;
            if ((x * 19 + y * 23 + Math.floor(lensOffset)) % 67 === 0 && dist < 22) {
              line += rgb("·", theme.muted, color);
            } else {
              line += " ";
            }
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  pulsar: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    const coreChars = ["*", "X", "@", "O", "+", "O", "X"];
    const coreChar = coreChars[tick % coreChars.length]!;

    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = (y - cy) * 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 1.5) {
          line += rgb(coreChar, theme.white, color);
        } else {
          const beamAngle = tick * 0.32;
          const cellAngle = Math.atan2(dy, dx);
          const diff = Math.abs(Math.sin(cellAngle - beamAngle));
          const inBeam = diff < 0.14 && dist < w * 0.55;

          const beamAngle2 = -tick * 0.18 + Math.PI / 2;
          const diff2 = Math.abs(Math.sin(cellAngle - beamAngle2));
          const inBeam2 = diff2 < 0.10 && dist < w * 0.35;

          const magSpacing = 4;
          const magOffset = (tick * 0.85) % magSpacing;
          const onMagLoop = Math.floor((dist - magOffset) % magSpacing) === 0 && dist < 20;

          if (inBeam) {
            const char = dist < 5 ? "█" : dist < 10 ? "▓" : dist < 16 ? "▒" : "░";
            const tone = dist < 7 ? theme.white : theme.blue;
            line += rgb(char, tone, color);
          } else if (inBeam2) {
            line += rgb(dist < 8 ? "▓" : "░", theme.purple, color);
          } else if (onMagLoop) {
            line += rgb(tick % 2 === 0 ? "·" : "°", theme.purple, color);
          } else {
            if ((x * 31 + y * 17 + tick) % 83 === 0) {
              line += rgb(".", theme.muted, color);
            } else {
              line += " ";
            }
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  radar: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;

    const blipsConfig = [
      { r: 5, speed: 0.06, baseAngle: 0.5, tag: "A" },
      { r: 9, speed: -0.08, baseAngle: 2.2, tag: "B" },
      { r: 12, speed: 0.04, baseAngle: 4.1, tag: "C" },
      { r: 7, speed: -0.11, baseAngle: 1.3, tag: "D" },
      { r: 15, speed: 0.05, baseAngle: 5.4, tag: "E" }
    ];

    const activeBlips = blipsConfig.map((b) => {
      const currentAngle = (b.baseAngle + tick * b.speed + Math.PI * 4) % (Math.PI * 2);
      return {
        x: Math.floor(cx + b.r * Math.cos(currentAngle)),
        y: Math.floor(cy + b.r * Math.sin(currentAngle) / 2),
        angle: currentAngle,
        tag: b.tag
      };
    });

    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) * 2;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cellAngle = (Math.atan2(dy, dx) + 2 * Math.PI) % (2 * Math.PI);
        
        const sweepAngle = (tick * 0.22) % (2 * Math.PI);
        const sweepAngle2 = (2 * Math.PI - (tick * 0.1) % (2 * Math.PI)) % (2 * Math.PI);

        const diff1 = (sweepAngle - cellAngle + 2 * Math.PI) % (2 * Math.PI);
        const diff2 = (sweepAngle2 - cellAngle + 2 * Math.PI) % (2 * Math.PI);
        
        let blipChar = "";
        for (const blip of activeBlips) {
          if (Math.abs(x - blip.x) <= 1 && Math.abs(y - blip.y) <= 0) {
            const scanDiff = (sweepAngle - blip.angle + 2 * Math.PI) % (2 * Math.PI);
            if (scanDiff < 2.5) {
              const intensity = scanDiff < 0.4 ? "█" : scanDiff < 1.2 ? "▓" : "▒";
              blipChar = rgb(intensity, theme.red, color);
            }
          }
        }

        if (blipChar) {
          line += blipChar;
          continue;
        }

        const isRing = Math.abs(dist - 5) < 0.5 || Math.abs(dist - 10) < 0.5 || Math.abs(dist - 15) < 0.5;
        if (dist < 18) {
          if (diff1 < 0.25) {
            line += rgb(isRing ? "╬" : "█", theme.green, color);
          } else if (diff2 < 0.2) {
            line += rgb(isRing ? "╫" : "▓", theme.green, color);
          } else if (diff1 < 1.4) {
            line += rgb(isRing ? "╪" : "▒", theme.green, color);
          } else if (diff1 < 3.2) {
            line += rgb(isRing ? "╌" : "░", theme.grid, color);
          } else {
            if (isRing) {
              line += rgb("·", theme.muted, color);
            } else if (x === Math.floor(cx) || y === Math.floor(cy)) {
              line += rgb("·", theme.muted, color);
            } else {
              line += " ";
            }
          }
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  hyperspace: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - cx);
        const dy = Math.abs(y - cy) * 2;
        const dist = Math.max(dx, dy);
        const ringSpacing = 4;
        const offset = (tick * 0.5) % ringSpacing;
        const onRing = Math.floor((dist - offset) % ringSpacing) === 0;
        if (onRing && dist > 1 && dist < w / 2) {
          const char = dist > 15 ? "█" : dist > 10 ? "▓" : dist > 5 ? "▒" : "░";
          line += rgb(char, theme.blue, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  aurora: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const auroraY = cy + Math.sin(x * 0.1 + tick * 0.08) * 3 + Math.cos(x * 0.05 - tick * 0.04) * 2;
        const distY = Math.abs(y - auroraY);
        if (distY < 1.2) {
          line += rgb("█", theme.lime, color);
        } else if (distY < 2.5) {
          line += rgb("▓", theme.green, color);
        } else if (distY < 4.0) {
          line += rgb("▒", theme.purple, color);
        } else if (distY < 5.5) {
          line += rgb("░", theme.grid, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  fire: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const baseHeight = Math.sin(x * 0.25 + tick * 0.15) * 1.5 + h - 3.5;
        if (y >= Math.floor(baseHeight)) {
          line += rgb("█", theme.red, color);
        } else if (y >= Math.floor(baseHeight - 1.5)) {
          line += rgb("▒", theme.amber, color);
        } else if (y >= Math.floor(baseHeight - 2.8)) {
          line += rgb("░", theme.white, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  ice: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const driftX1 = Math.floor(x + tick * 1.5) % w;
        const driftY1 = Math.floor(y + tick * 0.9) % h;
        const isSnow1 = (driftX1 * 19 + driftY1 * 7) % 113 === 0;

        const driftX2 = Math.floor(x + tick * 0.9) % w;
        const driftY2 = Math.floor(y + tick * 0.5) % h;
        const isSnow2 = (driftX2 * 13 + driftY2 * 17) % 79 === 0;

        const driftX3 = Math.floor(x + tick * 0.5) % w;
        const driftY3 = Math.floor(y + tick * 0.3) % h;
        const isSnow3 = (driftX3 * 7 + driftY3 * 23) % 47 === 0;

        const val = Math.sin(x * 0.16 + tick * 0.07) * Math.cos(y * 0.26 + tick * 0.04);

        if (isSnow1) {
          line += rgb("*", theme.white, color);
        } else if (isSnow2) {
          line += rgb("*", theme.cyan, color);
        } else if (isSnow3) {
          line += rgb("+", theme.blue, color);
        } else if (val > 0.55) {
          line += rgb("*", theme.cyan, color);
        } else if (val > 0.22) {
          line += rgb("▓", theme.blue, color);
        } else if (val > -0.15) {
          line += rgb("░", theme.grid, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  crt: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const isGlitch = (tick % 14 === 0 || tick % 23 === 0);
    const glitchOffset = isGlitch ? Math.floor(Math.sin(tick) * 6) : 0;
    
    const glitchRow = isGlitch ? Math.floor((tick * 7) % h) : -1;
    const glitchRow2 = isGlitch ? Math.floor((tick * 13) % h) : -1;

    for (let y = 0; y < h; y++) {
      let line = "";
      if (y === glitchRow || y === glitchRow2) {
        for (let x = 0; x < w; x++) {
          const char = ["█", "▓", "▒", "░", "╬", "░", "▒", "█"][(x + tick * 7) % 8]!;
          line += rgb(char, theme.green, color);
        }
        rows[y] = fitAnsi(line, w);
        continue;
      }

      const rowOffset = isGlitch ? Math.floor(Math.sin(y * 1.5 + tick * 2) * 5) : Math.floor(Math.cos(y * 0.3 + tick * 0.1) * 0.7);
      const scanY = Math.floor((tick * 0.85) % h);
      const scanY2 = Math.floor((tick * 0.45 + h / 2) % h);

      for (let x = 0; x < w; x++) {
        const jx = (x + rowOffset + glitchOffset + w) % w;
        const onScanline1 = y === scanY;
        const onScanline2 = y === scanY2;

        if (onScanline1) {
          line += rgb("█", theme.green, color);
        } else if (onScanline2) {
          line += rgb("▒", theme.muted, color);
        } else {
          const isScanRow = y % 2 === 0;
          const noise = (jx * 67 + y * 43 + tick * 23) % 100;
          if (noise < 12) {
            const noiseChar = noise < 4 ? "▒" : noise < 8 ? "░" : "·";
            line += rgb(noiseChar, theme.grid, color);
          } else if (isScanRow) {
            line += rgb("·", theme.muted, color);
          } else {
            line += " ";
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  sine: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const wave1 = Math.sin(x * 0.18 + tick * 0.32) * 2.8 + cy;
        const wave2 = Math.cos(x * 0.10 - tick * 0.18) * 3.6 + cy;
        const wave3 = Math.sin(x * 0.28 + tick * 0.45) * Math.cos(x * 0.06) * 2.0 + cy;
        const wave4 = Math.sin(x * 0.05 - tick * 0.08) * 4.5 + cy;

        const amp = Math.sin(x * 0.2 + tick * 0.6) * 3.5 + 4.5;
        const onSpectrogram = (y >= h - amp) && (x % 5 === 0);

        const tracerX = Math.floor(tick * 1.8) % w;
        const onTracer1 = Math.abs(x - tracerX) < 1.0 && Math.abs(y - wave1) < 1.0;
        const onTracer2 = Math.abs(x - ((tracerX + w/2)%w)) < 1.0 && Math.abs(y - wave2) < 1.0;

        if (onTracer1 || onTracer2) {
          line += rgb("*", theme.white, color);
        } else if (Math.abs(y - wave1) < 0.5) {
          line += rgb("█", theme.green, color);
        } else if (Math.abs(y - wave2) < 0.5) {
          line += rgb("▓", theme.lime, color);
        } else if (Math.abs(y - wave3) < 0.5) {
          line += rgb("▒", theme.cyan, color);
        } else if (Math.abs(y - wave4) < 0.5) {
          line += rgb("░", theme.blue, color);
        } else if (onSpectrogram) {
          line += rgb("╎", theme.grid, color);
        } else {
          if (y === Math.floor(cy) && x % 4 === 0) {
            line += rgb("-", theme.grid, color);
          } else {
            line += " ";
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  spiral: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) * 2;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (dist <= 1.5) {
          line += rgb(tick % 2 === 0 ? "█" : "*", theme.white, color);
          continue;
        }

        const twist = dist * 0.35 - tick * 0.32;
        const onArm1 = Math.abs(Math.sin(angle + twist)) > 0.93;
        const onArm2 = Math.abs(Math.sin(angle + twist + Math.PI / 2)) > 0.93;

        const gasAngle = angle - tick * 0.15;
        const gasVal = Math.sin(dist * 0.45 + gasAngle * 3) * Math.cos(dist * 0.2);
        const inGas = gasVal > 0.42 && dist < 18;

        const dustAngle = angle - tick * 0.08;
        const isDust = (x * 7 + y * 13) % 43 === 0 && Math.abs(Math.sin(dustAngle * 5)) > 0.85 && dist < 24;

        if ((onArm1 || onArm2) && dist < 18) {
          const char = dist < 5 ? "▓" : dist < 10 ? "▒" : "░";
          const tone = dist < 5 ? theme.white : dist < 10 ? theme.amber : theme.purple;
          line += rgb(char, tone, color);
        } else if (inGas) {
          line += rgb("░", theme.purple, color);
        } else if (isDust) {
          line += rgb(".", theme.purple, color);
        } else {
          line += " ";
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  },
  rain: (w, h, tick, color) => {
    const rows = Array.from({ length: h }, () => "");
    const isLightning = (tick % 17 === 0 || tick % 17 === 1 || tick % 43 === 0);
    const lightningCol = isLightning ? Math.floor((tick * 11) % w) : -1;

    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        if (isLightning && Math.abs(x - lightningCol - Math.floor(y * 0.6)) < 1.0) {
          const boltChar = (y % 3 === 0) ? "/" : (y % 3 === 1) ? "█" : "|";
          line += rgb(boltChar, theme.white, color);
          continue;
        }

        const speed = 1.0 + ((x * 29) % 3) * 0.25;
        const dropY = Math.floor((tick * speed + x * 2) % h);
        const windOffset = Math.floor(y * 0.4);
        const rx = (x - windOffset + w) % w;

        const onFloor = y === h - 1;
        const onSubFloor = y === h - 2;
        const splashActive = (dropY >= h - 2) && (rx % 5 === 1);

        if (y === dropY && rx % 5 === 1) {
          line += rgb("\\", theme.cyan, color);
        } else if (onFloor && splashActive) {
          line += rgb(tick % 2 === 0 ? "v" : "~", theme.cyan, color);
        } else if (onSubFloor && splashActive) {
          line += rgb(".", theme.blue, color);
        } else {
          if (isLightning && y < 4) {
            line += rgb("▒", theme.blue, color);
          } else {
            line += " ";
          }
        }
      }
      rows[y] = fitAnsi(line, w);
    }
    return rows;
  }
};

export function renderBackgrounds(width: number, height: number, state: KitchenSinkState, color = true): string {
  const innerWidth = width - 4;
  const contentHeight = height - 2;

  const renderer = backgroundRenderers[state.backgroundStyle] ?? backgroundRenderers.empty;
  const rows = renderer(innerWidth, contentHeight, state.tick, color);

  const title = `BACKGROUND: ${state.backgroundStyle.toUpperCase()}`;

  return box(title, rows, {
    width,
    height,
    color,
    accent: theme.purple,
    paddingX: 1,
    titleAlign: "left"
  });
}
