export type Rgb = readonly [number, number, number];

export const theme = {
  text: [235, 238, 229] as Rgb,
  muted: [142, 150, 146] as Rgb,
  border: [67, 78, 83] as Rgb,
  grid: [35, 47, 52] as Rgb,
  green: [67, 214, 137] as Rgb,
  red: [255, 95, 91] as Rgb,
  amber: [246, 194, 76] as Rgb,
  cyan: [59, 220, 210] as Rgb,
  blue: [92, 173, 255] as Rgb,
  purple: [188, 132, 255] as Rgb,
  slate: [158, 169, 178] as Rgb,
  lime: [149, 225, 83] as Rgb,
  white: [255, 252, 238] as Rgb
} as const;

const ansiPattern = /\x1b\[[0-9;]*m/g;

function charWidth(char: string): number {
  const code = char.codePointAt(0) ?? 0;
  if (code === 0 || code === 0x200d) return 0;
  if (code < 32 || (code >= 0x7f && code < 0xa0)) return 0;
  if ((code >= 0x0300 && code <= 0x036f) || (code >= 0xfe00 && code <= 0xfe0f)) return 0;
  if (
    code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1f300 && code <= 0x1faff) ||
      (code >= 0x20000 && code <= 0x3fffd))
  ) {
    return 2;
  }
  return 1;
}

export function color(text: unknown, code: string, enabled = true): string {
  return enabled ? `\x1b[${code}m${String(text)}\x1b[0m` : String(text);
}

export function rgb(text: unknown, [r, g, b]: Rgb, enabled = true): string {
  return color(text, `38;2;${r};${g};${b}`, enabled);
}

export function bold(text: unknown, enabled = true): string {
  return color(text, "1", enabled);
}

export function dim(text: unknown, enabled = true): string {
  return color(text, "2", enabled);
}

export function stripAnsi(text: unknown): string {
  return String(text ?? "").replace(ansiPattern, "");
}

export function visibleLength(text: unknown): number {
  return Array.from(stripAnsi(text)).reduce((sum, char) => sum + charWidth(char), 0);
}

function takeVisible(text: string, width: number): string {
  if (width <= 0) return "";
  let output = "";
  let visible = 0;
  for (let index = 0; index < text.length && visible < width; ) {
    if (text[index] === "\x1b") {
      const match = text.slice(index).match(/^\x1b\[[0-9;]*m/);
      if (match) {
        output += match[0];
        index += match[0].length;
        continue;
      }
    }
    const char = Array.from(text.slice(index))[0] ?? "";
    const widthForChar = charWidth(char);
    if (visible + widthForChar > width) break;
    output += char;
    visible += widthForChar;
    index += char.length;
  }
  return output;
}

export function truncate(text: unknown, width: number): string {
  const value = String(text ?? "");
  if (width <= 0) return "";
  if (visibleLength(value) <= width) return value;
  if (width <= 3) return takeVisible(value, width);
  return `${takeVisible(value, width - 3)}...${value.includes("\x1b[") ? "\x1b[0m" : ""}`;
}

export function fitAnsi(text: unknown, width: number): string {
  const value = truncate(text, width);
  const remaining = width - visibleLength(value);
  return remaining > 0 ? `${value}${" ".repeat(remaining)}` : value;
}

export function repeatToWidth(value: string, width: number): string {
  if (width <= 0) return "";
  let output = "";
  while (visibleLength(output) < width) output += value;
  return takeVisible(output, width);
}

export function joinAligned(leftText: string, rightText: string, width: number, minGap = 2): string {
  const leftWidth = visibleLength(leftText);
  const rightWidth = visibleLength(rightText);
  if (leftWidth + minGap + rightWidth <= width) {
    return `${leftText}${" ".repeat(width - leftWidth - rightWidth)}${rightText}`;
  }
  if (rightWidth + minGap >= width) return truncate(rightText, width);
  return `${truncate(leftText, width - rightWidth - minGap)}${" ".repeat(minGap)}${rightText}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
