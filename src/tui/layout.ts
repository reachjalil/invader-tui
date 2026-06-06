import { bold, fitAnsi, joinAligned, repeatToWidth, rgb, theme, truncate, visibleLength, type Rgb } from "./ansi.js";
import type { BorderStyle } from "../sim/state.js";

export type BoxOptions = {
  width: number;
  height?: number;
  accent?: Rgb;
  color?: boolean;
  paddingX?: number;
  titleAlign?: "left" | "center";
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

export function splitRatioWidths(total: number, ratios: number[], gap = 1, minimums: number[] = []): number[] {
  const available = Math.max(ratios.length, total - gap * Math.max(0, ratios.length - 1));
  const minimumTotal = minimums.reduce((sum, value) => sum + value, 0);
  const activeMinimums = minimumTotal <= available ? minimums : [];
  const ratioTotal = ratios.reduce((sum, ratio) => sum + ratio, 0) || 1;
  const widths = ratios.map((ratio, index) => Math.max(activeMinimums[index] ?? 1, Math.floor((available * ratio) / ratioTotal)));
  let delta = available - widths.reduce((sum, width) => sum + width, 0);
  for (let index = 0; delta !== 0 && widths.length > 0; index = (index + 1) % widths.length) {
    if (delta > 0) {
      widths[index]! += 1;
      delta -= 1;
    } else if (widths[index]! > (activeMinimums[index] ?? 1)) {
      widths[index]! -= 1;
      delta += 1;
    } else {
      break;
    }
  }
  return widths;
}

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

export function hstack(blocks: string[], gap = 1): string {
  const splitBlocks = blocks.map((block) => String(block).split("\n"));
  const widths = splitBlocks.map((lines) => Math.max(0, ...lines.map((line) => visibleLength(line))));
  const height = Math.max(0, ...splitBlocks.map((lines) => lines.length));
  const spacer = " ".repeat(gap);
  const rows: string[] = [];
  for (let row = 0; row < height; row += 1) {
    rows.push(splitBlocks.map((lines, index) => fitAnsi(lines[row] ?? "", widths[index] ?? 0)).join(spacer));
  }
  return rows.join("\n");
}

export function tableRow(values: string[], widths: number[], gap = "  "): string {
  return values.map((value, index) => fitAnsi(value, widths[index] ?? 8)).join(gap);
}

export function normalizeFrame(frame: string, width: number, height: number): string {
  const lines = frame.split("\n").slice(0, height);
  while (lines.length < height) lines.push("");
  return lines.map((line) => fitAnsi(line, width)).join("\n");
}

export function divider(width: number, color = true): string {
  return rgb(repeatToWidth("─", width), theme.border, color);
}

export function keyValue(label: string, value: string, width: number, color = true): string {
  return joinAligned(`${rgb(label, theme.muted, color)} ${value}`, rgb("›", theme.muted, color), width);
}
