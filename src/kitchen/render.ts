import { bold, dim, fitAnsi, rgb, theme, truncate, visibleLength } from "../tui/ansi.js";
import { selectedLine } from "@prettui/core/ansi";
import { renderFooter as renderPrettuiFooter } from "@prettui/components";
import { box, divider, hstack, keyValue, normalizeFrame, splitRatioWidths } from "../tui/layout.js";
import { kitchenSinkComponents, kitchenSinkNavigationSections } from "./registry.js";
import { resolveSelection, type KitchenBrowserState, type ResolvedSelection } from "./state.js";
import type { ComponentDefinition, OptionGroup } from "./types.js";

export type KitchenBrowserOptions = {
  width: number;
  height: number;
  color?: boolean;
  tick?: number;
  paused?: boolean;
  state: KitchenBrowserState;
};

const statusTone: Record<string, readonly [number, number, number]> = {
  stable: theme.green,
  new: theme.cyan,
  experimental: theme.amber
};

function wrapText(text: string, width: number, max = 6): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if (visibleLength(`${current} ${word}`) <= width) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
    if (lines.length >= max) break;
  }
  if (current && lines.length < max) lines.push(current);
  return lines.map((line) => truncate(line, width));
}

// ── Header / footer ───────────────────────────────────────────────────────────

function renderHeader(width: number, resolved: ResolvedSelection, color: boolean): string[] {
  const dot = rgb("◆", theme.cyan, color);
  const title = bold(rgb("INVADER-TUI", theme.white, color), color);
  const sub = dim(`kitchen sink · ${kitchenSinkComponents.length} components`, color);
  const right = dim(`built on @prettui/* · ${resolved.component.category.toUpperCase()}`, color);
  const left = `${dot} ${title}  ${sub}`;
  const gap = Math.max(1, width - visibleLength(left) - visibleLength(right));
  return [fitAnsi(`${left}${" ".repeat(gap)}${right}`, width), rgb("─".repeat(width), theme.border, color)];
}

function renderFooterBar(width: number, resolved: ResolvedSelection, paused: boolean, color: boolean): string {
  // Built on @prettui/components renderFooter (status items + control hints).
  return renderPrettuiFooter({
    width,
    color,
    status: [
      { label: "Focus", value: resolved.focus, tone: "cyan" },
      { label: "Component", value: resolved.component.label, tone: "white" },
      { label: "State", value: paused ? "paused" : "live", tone: paused ? "amber" : "green" }
    ],
    controls: [
      "[Tab] focus",
      `[↑↓/WS] ${resolved.focus === "options" ? "group" : "item"}`,
      `[←→/AD] ${resolved.focus === "options" ? "value" : "select"}`,
      "[p] pause",
      "[f] step",
      "[q] quit"
    ]
  });
}

// ── Navigation ──────────────────────────────────────────────────────────────────

function renderNav(width: number, height: number, resolved: ResolvedSelection, color: boolean): string {
  const inner = width - 4;
  const contentHeight = height - 2;
  const focused = resolved.focus === "navigation";

  type Row = { text: string; componentIndex?: number };
  const rows: Row[] = [];
  for (const section of kitchenSinkNavigationSections) {
    rows.push({ text: bold(rgb(section.label.toUpperCase(), theme.slate, color), color) });
    for (const id of section.componentIds) {
      const index = kitchenSinkComponents.findIndex((c) => c.id === id);
      if (index < 0) continue;
      const component = kitchenSinkComponents[index]!;
      const active = index === resolved.componentIndex;
      const marker = active ? rgb("◆", theme.cyan, color) : dim("◇", color);
      rows.push({ text: `${marker} ${active ? rgb(component.label, theme.white, color) : component.label}`, componentIndex: index });
    }
    rows.push({ text: "" });
  }

  // Scroll so the active component row stays visible.
  const activeRow = rows.findIndex((row) => row.componentIndex === resolved.componentIndex);
  let start = 0;
  if (activeRow >= contentHeight) start = Math.min(activeRow - contentHeight + 1, Math.max(0, rows.length - contentHeight));
  const windowRows = rows.slice(start, start + contentHeight);

  const lines = windowRows.map((row) => {
    if (row.componentIndex === resolved.componentIndex && focused) return selectedLine(fitAnsi(row.text, inner), inner, color);
    return fitAnsi(row.text, inner);
  });

  return box(`${focused ? "◆" : "◇"} CATALOG`, lines, { width, height, color, accent: focused ? theme.cyan : theme.border, paddingX: 1, titleAlign: "left" });
}

// ── Preview ──────────────────────────────────────────────────────────────────────

function renderPreview(width: number, height: number, resolved: ResolvedSelection, tick: number, color: boolean): string {
  const focused = resolved.focus === "preview";
  const titleAccent = focused ? theme.cyan : theme.muted;
  const titleLine = fitAnsi(
    `${rgb(focused ? "◆" : "◇", titleAccent, color)} ${bold(rgb(resolved.component.label, theme.white, color), color)}  ${dim(`${resolved.dataMode} · ${resolved.variantId} · ${resolved.density}`, color)}`,
    width
  );
  const bodyHeight = Math.max(1, height - 1);
  let body: string;
  try {
    body = resolved.component.render({
      width,
      height: bodyHeight,
      color,
      tick,
      variantId: resolved.variantId,
      dataMode: resolved.dataMode,
      density: resolved.density
    });
  } catch (error) {
    body = rgb(`render error: ${(error as Error).message}`, theme.red, color);
  }
  return [titleLine, normalizeFrame(body, width, bodyHeight)].join("\n");
}

// ── Options + inspector ──────────────────────────────────────────────────────────

function renderChoiceLine(group: OptionGroup, selectedId: string, width: number, color: boolean): string {
  const chips = group.choices.map((choice) => {
    const isSelected = choice.id === selectedId;
    const label = ` ${choice.label} `;
    return isSelected ? rgb(`[${choice.label}]`, theme.cyan, color) : dim(label, color);
  });
  return truncate(chips.join(" "), width);
}

function selectedChoiceId(group: OptionGroup, resolved: ResolvedSelection): string {
  if (group.id === "data") return group.choices[resolved.dataIndex]?.id ?? group.defaultChoiceId;
  if (group.id === "variant") return group.choices[resolved.variantIndex]?.id ?? group.defaultChoiceId;
  return group.choices[resolved.densityIndex]?.id ?? group.defaultChoiceId;
}

function renderOptions(width: number, height: number, resolved: ResolvedSelection, color: boolean): string {
  const inner = width - 4;
  const focused = resolved.focus === "options";
  const lines: string[] = [];
  const component: ComponentDefinition = resolved.component;

  resolved.component.optionGroups.forEach((group, groupIndex) => {
    const isActive = focused && groupIndex === resolved.optionGroupIndex;
    const marker = isActive ? rgb("▸", theme.cyan, color) : " ";
    lines.push(`${marker} ${bold(rgb(group.label.toUpperCase(), isActive ? theme.cyan : theme.slate, color), color)}`);
    const selId = selectedChoiceId(group, resolved);
    const choiceLine = `  ${renderChoiceLine(group, selId, inner - 2, color)}`;
    lines.push(isActive ? selectedLine(fitAnsi(choiceLine, inner), inner, color) : fitAnsi(choiceLine, inner));
    const desc = group.choices.find((c) => c.id === selId)?.description;
    if (desc) lines.push(fitAnsi(`  ${dim(truncate(desc, inner - 2), color)}`, inner));
    lines.push("");
  });

  lines.push(divider(inner, color));
  lines.push(keyValue("ID", rgb(component.id, theme.cyan, color), inner, color));
  // Export name gets its own line so long function names are not truncated by alignment.
  lines.push(fitAnsi(rgb("EXPORT", theme.muted, color), inner));
  lines.push(fitAnsi(`  ${rgb(truncate(component.exportName, inner - 2), theme.lime, color)}`, inner));
  lines.push(keyValue("CATEGORY", rgb(component.category, theme.blue, color), inner, color));
  if (component.status) {
    lines.push(keyValue("STATUS", rgb(component.status, statusTone[component.status] ?? theme.muted, color), inner, color));
  }
  if (component.tags?.length) {
    lines.push(fitAnsi(`${rgb("TAGS", theme.muted, color)} ${dim(component.tags.join(" · "), color)}`, inner));
  }
  lines.push("");
  for (const line of wrapText(component.description, inner, 4)) {
    lines.push(fitAnsi(dim(line, color), inner));
  }

  return box(`${focused ? "◆" : "◇"} OPTIONS`, lines, { width, height, color, accent: focused ? theme.cyan : theme.border, paddingX: 1, titleAlign: "left" });
}

// ── Compose ───────────────────────────────────────────────────────────────────────

export function renderKitchenSinkBrowser(options: KitchenBrowserOptions): string {
  const width = Math.max(72, Math.floor(options.width));
  const height = Math.max(20, Math.floor(options.height));
  const color = options.color ?? true;
  const tick = Math.max(0, Math.floor(options.tick ?? 0));
  const resolved = resolveSelection(options.state);

  const header = renderHeader(width, resolved, color);
  const footer = renderFooterBar(width, resolved, options.paused ?? false, color);
  const mainHeight = Math.max(8, height - header.length - 3);

  const [navWidth = 24, previewWidth = 50, optionsWidth = 30] = splitRatioWidths(width, [24, 54, 30], 1, [22, 34, 28]);

  const nav = renderNav(navWidth, mainHeight, resolved, color);
  const preview = renderPreview(previewWidth, mainHeight, resolved, tick, color);
  const options_ = renderOptions(optionsWidth, mainHeight, resolved, color);
  const main = hstack([nav, preview, options_], 1);

  return normalizeFrame([...header, main, footer].join("\n"), width, height);
}
