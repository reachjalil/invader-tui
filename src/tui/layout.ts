import { bold, fitAnsi, joinAligned, rgb, theme, truncate, visibleLength, type Rgb } from "./ansi.js";
import type { BorderStyle } from "../sim/state.js";

// Layout primitives shared with @prettui/core. We re-export the ones that are
// identical to the core implementation instead of duplicating them, and keep only
// invader-tui's richer `box` (multiple border-style variants) + helpers on top.
export { splitRatioWidths, splitWidths, hstack, tableRow, normalizeFrame, divider } from "@prettui/core/layout";

export type BoxOptions = {
  width: number;
  height?: number;
  accent?: Rgb;
  color?: boolean;
  paddingX?: number;
  titleAlign?: "left" | "center";
  /** invader-tui extension: pick from the arcade/cyberpunk/etc. border family below. */
  borderStyle?: BorderStyle;
};

export type BorderChars = {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  ht: string;
  hb: string;
  v: string;
};

export const borderStyles: Record<BorderStyle, BorderChars> = {
  single: { tl: "┌", tr: "┐", bl: "└", br: "┘", ht: "─", hb: "─", v: "│" },
  double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", ht: "═", hb: "═", v: "║" },
  heavy: { tl: "┏", tr: "┓", bl: "┗", br: "┛", ht: "━", hb: "━", v: "┃" },
  arcade: { tl: "╭", tr: "╮", bl: "╰", br: "╯", ht: "─", hb: "─", v: "│" },
  block: { tl: "█", tr: "█", bl: "█", br: "█", ht: "▀", hb: "▄", v: "█" },
  ornamental: { tl: "╬", tr: "╬", bl: "╬", br: "╬", ht: "═", hb: "═", v: "║" },
  cyberpunk: { tl: "◤", tr: "◥", bl: "◣", br: "◢", ht: "▀", hb: "▄", v: "█" },
  dashed: { tl: "┌", tr: "┐", bl: "└", br: "┘", ht: "╌", hb: "╌", v: "╎" },
  terminal: { tl: "+", tr: "+", bl: "+", br: "+", ht: "-", hb: "-", v: "|" },
  cryptic: { tl: "╓", tr: "╖", bl: "╙", br: "╜", ht: "─", hb: "─", v: "║" }
};

// Extends @prettui/core's `box` with selectable border-style variants used across
// the arcade UI; the layout/measurement behaviour matches core otherwise.
export function box(title: string, body: string | string[], options: BoxOptions): string {
  const width = Math.max(4, Math.floor(options.width));
  const innerWidth = Math.max(2, width - 2);
  const paddingX = Math.max(0, Math.min(Math.floor(options.paddingX ?? 0), Math.floor((innerWidth - 1) / 2)));
  const contentWidth = Math.max(1, innerWidth - paddingX * 2);
  const accent = options.accent ?? theme.border;
  const color = options.color ?? true;

  const styleName = options.borderStyle ?? "single";
  const b = borderStyles[styleName] ?? borderStyles.single;

  const lines = Array.isArray(body) ? [...body] : String(body || "").split("\n");
  const contentHeight = options.height ? Math.max(0, options.height - 2) : lines.length;
  const rawTitle = title ? ` ${title} ` : "";
  const titleText = truncate(rawTitle, innerWidth);
  const fill = Math.max(0, innerWidth - visibleLength(titleText));
  const leftFill = options.titleAlign === "left" && fill > 0 ? 1 : Math.floor(fill / 2);
  const rightFill = options.titleAlign === "left" ? Math.max(0, fill - leftFill) : Math.ceil(fill / 2);
  const top = title
    ? `${rgb(b.tl, accent, color)}${rgb(b.ht.repeat(leftFill), accent, color)}${bold(rgb(titleText, accent, color), color)}${rgb(b.ht.repeat(rightFill), accent, color)}${rgb(b.tr, accent, color)}`
    : rgb(`${b.tl}${b.ht.repeat(innerWidth)}${b.tr}`, accent, color);
  const visibleLines = lines.slice(0, contentHeight);
  while (visibleLines.length < contentHeight) visibleLines.push("");
  const pad = " ".repeat(paddingX);
  const content = visibleLines.map((line) => `${rgb(b.v, accent, color)}${pad}${fitAnsi(line, contentWidth)}${pad}${rgb(b.v, accent, color)}`);
  const bottom = rgb(`${b.bl}${b.hb.repeat(innerWidth)}${b.br}`, accent, color);
  return [top, ...content, bottom].join("\n");
}

export function keyValue(label: string, value: string, width: number, color = true): string {
  return joinAligned(`${rgb(label, theme.muted, color)} ${value}`, rgb("›", theme.muted, color), width);
}
