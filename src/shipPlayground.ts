#!/usr/bin/env node
import { box, hstack, normalizeFrame } from "./tui/layout.js";
import { bold, dim, fitAnsi, rgb, theme, visibleLength, type Rgb } from "./tui/ansi.js";
import type { SpriteFrame, Tone } from "./assets/index.js";

type Point = {
  x: number;
  y: number;
};

type BrailleRenderOptions = {
  width: number;
  height: number;
  color?: boolean;
};

type ShipStudy = {
  id: string;
  name: string;
  tone: Tone;
  role: string;
  draw: (canvas: BrailleCanvas) => void;
};

const toneColors: Record<Tone, Rgb> = {
  green: theme.green,
  red: theme.red,
  amber: theme.amber,
  cyan: theme.cyan,
  blue: theme.blue,
  purple: theme.purple,
  slate: theme.slate,
  lime: theme.lime,
  white: theme.white
};

const brailleDots = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80]
] as const;

export class BrailleCanvas {
  readonly width: number;
  readonly height: number;
  private readonly cells: number[][];

  constructor(width: number, height: number) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.cells = Array.from({ length: Math.ceil(this.height / 4) }, () => Array(Math.ceil(this.width / 2)).fill(0));
  }

  set(x: number, y: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return;
    const cellX = Math.floor(px / 2);
    const cellY = Math.floor(py / 4);
    this.cells[cellY]![cellX]! |= brailleDots[py % 4]![px % 2]!;
  }

  line(start: Point, end: Point): void {
    let x0 = Math.round(start.x);
    let y0 = Math.round(start.y);
    const x1 = Math.round(end.x);
    const y1 = Math.round(end.y);
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;

    while (true) {
      this.set(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const error2 = 2 * error;
      if (error2 >= dy) {
        error += dy;
        x0 += sx;
      }
      if (error2 <= dx) {
        error += dx;
        y0 += sy;
      }
    }
  }

  polygon(points: Point[], fill = false): void {
    if (points.length < 2) return;
    for (let index = 0; index < points.length; index += 1) {
      this.line(points[index]!, points[(index + 1) % points.length]!);
    }
    if (!fill || points.length < 3) return;

    const minY = Math.max(0, Math.floor(Math.min(...points.map((point) => point.y))));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...points.map((point) => point.y))));
    for (let y = minY; y <= maxY; y += 1) {
      const intersections: number[] = [];
      for (let index = 0; index < points.length; index += 1) {
        const a = points[index]!;
        const b = points[(index + 1) % points.length]!;
        if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
          intersections.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let index = 0; index < intersections.length; index += 2) {
        const start = Math.max(0, Math.ceil(intersections[index]!));
        const end = Math.min(this.width - 1, Math.floor(intersections[index + 1] ?? intersections[index]!));
        for (let x = start; x <= end; x += 1) this.set(x, y);
      }
    }
  }

  rect(x: number, y: number, width: number, height: number, fill = false): void {
    const right = x + width - 1;
    const bottom = y + height - 1;
    if (fill) {
      for (let yy = y; yy <= bottom; yy += 1) {
        for (let xx = x; xx <= right; xx += 1) this.set(xx, yy);
      }
      return;
    }
    this.line({ x, y }, { x: right, y });
    this.line({ x: right, y }, { x: right, y: bottom });
    this.line({ x: right, y: bottom }, { x, y: bottom });
    this.line({ x, y: bottom }, { x, y });
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, fill = false): void {
    const minX = Math.floor(cx - rx);
    const maxX = Math.ceil(cx + rx);
    const minY = Math.floor(cy - ry);
    const maxY = Math.ceil(cy + ry);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const value = ((x - cx) ** 2) / (rx ** 2 || 1) + ((y - cy) ** 2) / (ry ** 2 || 1);
        if ((fill && value <= 1) || (!fill && value >= 0.78 && value <= 1.22)) this.set(x, y);
      }
    }
  }

  point(xPercent: number, yPercent: number): Point {
    return {
      x: (xPercent / 100) * (this.width - 1),
      y: (yPercent / 100) * (this.height - 1)
    };
  }

  frame(): SpriteFrame {
    return {
      width: this.cells[0]?.length ?? 0,
      height: this.cells.length,
      lines: this.cells.map((row) => row.map((mask) => String.fromCharCode(0x2800 + mask)).join(""))
    };
  }
}

function scalePoint(canvas: BrailleCanvas, x: number, y: number): Point {
  return canvas.point(x, y);
}

function drawSymmetric(canvas: BrailleCanvas, points: Point[], fill = false): void {
  canvas.polygon(points, fill);
  const mirrored = points.map((point) => ({ x: canvas.width - 1 - point.x, y: point.y })).reverse();
  canvas.polygon(mirrored, fill);
}

function renderStudyFrame(study: ShipStudy, options: BrailleRenderOptions): SpriteFrame {
  const canvas = new BrailleCanvas(options.width * 2, options.height * 4);
  study.draw(canvas);
  return canvas.frame();
}

function paintFrame(frame: SpriteFrame, tone: Tone, color: boolean): string[] {
  return frame.lines.map((line) => fitAnsi(rgb(line, toneColors[tone], color), frame.width));
}

function drawXWingStudy(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.polygon([p(48, 8), p(52, 8), p(59, 65), p(50, 92), p(41, 65)], true);
  canvas.polygon([p(45, 29), p(55, 29), p(54, 67), p(46, 67)], true);
  drawSymmetric(canvas, [p(45, 39), p(4, 4), p(12, 24), p(42, 58)], true);
  drawSymmetric(canvas, [p(44, 61), p(6, 96), p(14, 74), p(42, 51)], true);
  drawSymmetric(canvas, [p(28, 23), p(6, 10), p(7, 15), p(32, 31)], false);
  drawSymmetric(canvas, [p(29, 77), p(7, 90), p(7, 84), p(33, 69)], false);
  canvas.ellipse(p(50, 34).x, p(50, 34).y, Math.max(1, canvas.width * 0.05), Math.max(1, canvas.height * 0.06), true);
  canvas.line(p(50, 0), p(50, 14));
  canvas.line(p(47, 94), p(43, 99));
  canvas.line(p(53, 94), p(57, 99));
}

function drawDeltaInterceptor(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.polygon([p(50, 2), p(93, 88), p(62, 72), p(55, 97), p(50, 88), p(45, 97), p(38, 72), p(7, 88)], true);
  canvas.polygon([p(50, 13), p(63, 67), p(50, 82), p(37, 67)], false);
  canvas.line(p(50, 3), p(50, 89));
  drawSymmetric(canvas, [p(40, 56), p(18, 82), p(38, 69)], false);
  canvas.ellipse(p(50, 40).x, p(50, 40).y, Math.max(1, canvas.width * 0.05), Math.max(1, canvas.height * 0.08), true);
}

function drawLongNeedle(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.polygon([p(50, 0), p(59, 24), p(57, 78), p(50, 99), p(43, 78), p(41, 24)], true);
  drawSymmetric(canvas, [p(44, 44), p(8, 64), p(42, 71)], true);
  drawSymmetric(canvas, [p(43, 73), p(18, 92), p(45, 86)], false);
  canvas.rect(p(46, 25).x, p(46, 25).y, Math.max(1, canvas.width * 0.08), Math.max(1, canvas.height * 0.38), true);
  canvas.ellipse(p(50, 26).x, p(50, 26).y, Math.max(1, canvas.width * 0.04), Math.max(1, canvas.height * 0.05), false);
}

function drawRingSaucer(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.ellipse(p(50, 47).x, p(50, 47).y, Math.max(2, canvas.width * 0.43), Math.max(2, canvas.height * 0.31), true);
  canvas.ellipse(p(50, 47).x, p(50, 47).y, Math.max(1, canvas.width * 0.22), Math.max(1, canvas.height * 0.15), false);
  canvas.polygon([p(50, 0), p(59, 30), p(50, 41), p(41, 30)], true);
  canvas.polygon([p(40, 68), p(60, 68), p(54, 98), p(46, 98)], true);
  drawSymmetric(canvas, [p(24, 45), p(2, 51), p(23, 58)], true);
}

function drawSideGunWing(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.polygon([p(50, 4), p(61, 28), p(59, 76), p(50, 98), p(41, 76), p(39, 28)], true);
  canvas.rect(p(45, 28).x, p(45, 28).y, Math.max(1, canvas.width * 0.1), Math.max(1, canvas.height * 0.45), true);
  canvas.ellipse(p(50, 35).x, p(50, 35).y, Math.max(1, canvas.width * 0.06), Math.max(1, canvas.height * 0.08), false);
  drawSymmetric(canvas, [p(42, 38), p(13, 18), p(4, 43), p(38, 59)], true);
  drawSymmetric(canvas, [p(39, 62), p(8, 75), p(13, 91), p(42, 72)], true);
  drawSymmetric(canvas, [p(12, 29), p(0, 23), p(2, 34), p(13, 39)], true);
  drawSymmetric(canvas, [p(10, 76), p(0, 80), p(2, 88), p(13, 85)], true);
  drawSymmetric(canvas, [p(5, 28), p(0, 28)], false);
  drawSymmetric(canvas, [p(5, 83), p(0, 83)], false);
  canvas.line(p(50, 0), p(50, 12));
  canvas.line(p(45, 93), p(40, 99));
  canvas.line(p(55, 93), p(60, 99));
}

function drawTalonStarfighter(canvas: BrailleCanvas): void {
  const p = (x: number, y: number) => scalePoint(canvas, x, y);
  canvas.polygon([p(50, 0), p(56, 13), p(58, 35), p(58, 76), p(53, 91), p(47, 91), p(42, 76), p(42, 35), p(44, 13)], true);
  canvas.polygon([p(47, 4), p(53, 4), p(55, 13), p(45, 13)], false);
  canvas.rect(p(46, 19).x, p(46, 19).y, Math.max(1, canvas.width * 0.08), Math.max(1, canvas.height * 0.58), false);
  canvas.ellipse(p(50, 48).x, p(50, 48).y, Math.max(1, canvas.width * 0.045), Math.max(1, canvas.height * 0.045), true);
  canvas.ellipse(p(50, 60).x, p(50, 60).y, Math.max(1, canvas.width * 0.045), Math.max(1, canvas.height * 0.045), true);
  canvas.ellipse(p(50, 72).x, p(50, 72).y, Math.max(1, canvas.width * 0.045), Math.max(1, canvas.height * 0.045), true);

  drawSymmetric(canvas, [p(43, 41), p(17, 28), p(4, 20), p(7, 39), p(38, 58)], true);
  drawSymmetric(canvas, [p(42, 65), p(13, 76), p(4, 88), p(7, 70), p(37, 58)], true);
  drawSymmetric(canvas, [p(39, 52), p(31, 48), p(28, 66), p(36, 75)], true);
  drawSymmetric(canvas, [p(36, 39), p(30, 38), p(30, 45), p(37, 45)], true);
  drawSymmetric(canvas, [p(36, 79), p(30, 78), p(30, 88), p(36, 88)], true);

  drawSymmetric(canvas, [p(6, 10), p(5, 30)], false);
  drawSymmetric(canvas, [p(3, 14), p(8, 14)], false);
  drawSymmetric(canvas, [p(4, 31), p(9, 31)], false);
  drawSymmetric(canvas, [p(6, 69), p(6, 99)], false);
  drawSymmetric(canvas, [p(3, 73), p(8, 73)], false);
  drawSymmetric(canvas, [p(3, 96), p(9, 90)], false);

  canvas.line(p(47, 94), p(47, 99));
  canvas.line(p(53, 94), p(53, 99));
  canvas.ellipse(p(50, 94).x, p(50, 94).y, Math.max(1, canvas.width * 0.055), Math.max(1, canvas.height * 0.035), false);
}

const shipStudies: ShipStudy[] = [
  {
    id: "x-wing-study",
    name: "X-Wing Study",
    tone: "cyan",
    role: "Split attack wings, needle nose, and rear thrust fork.",
    draw: drawXWingStudy
  },
  {
    id: "delta-interceptor",
    name: "Delta Interceptor",
    tone: "blue",
    role: "Readable wedge silhouette for fast player ships.",
    draw: drawDeltaInterceptor
  },
  {
    id: "long-needle",
    name: "Long Needle",
    tone: "lime",
    role: "Thin centerline hull with compact side fins.",
    draw: drawLongNeedle
  },
  {
    id: "ring-saucer",
    name: "Ring Saucer",
    tone: "purple",
    role: "Circular energy craft with a cockpit ring.",
    draw: drawRingSaucer
  },
  {
    id: "side-gun-wing",
    name: "Side-Gun Wing",
    tone: "amber",
    role: "Wide side wings, outer gun tips, and a dense center body.",
    draw: drawSideGunWing
  },
  {
    id: "talon-starfighter",
    name: "Talon Starfighter",
    tone: "green",
    role: "Reference-style wing sweep with four tall gun pylons.",
    draw: drawTalonStarfighter
  }
];

const defaultSizes = [
  { width: 4, height: 2 },
  { width: 5, height: 3 },
  { width: 6, height: 3 },
  { width: 8, height: 4 },
  { width: 10, height: 5 }
] as const;

function renderTile(study: ShipStudy, width: number, height: number, color: boolean): string {
  const frame = renderStudyFrame(study, { width, height, color });
  const contentWidth = Math.max(18, Math.max(frame.width, visibleLength(study.name)) + 4);
  const body = [
    fitAnsi(rgb(study.name, toneColors[study.tone], color), contentWidth - 4),
    fitAnsi(dim(`${frame.width}x${frame.height} cells`, color), contentWidth - 4),
    "",
    ...paintFrame(frame, study.tone, color).map((line) => centerAnsi(line, contentWidth - 4)),
    "",
    fitAnsi(dim(study.role, color), contentWidth - 4)
  ];
  return box(`${width}x${height}`, body, { width: contentWidth, color, accent: toneColors[study.tone], paddingX: 1, titleAlign: "left" });
}

function centerAnsi(value: string, width: number): string {
  const left = Math.max(0, Math.floor((width - visibleLength(value)) / 2));
  return fitAnsi(`${" ".repeat(left)}${value}`, width);
}

function renderStudyRow(study: ShipStudy, color: boolean): string {
  return hstack(defaultSizes.map((size) => renderTile(study, size.width, size.height, color)), 1);
}

function spriteLiteral(study: ShipStudy, width: number, height: number): string {
  const frame = renderStudyFrame(study, { width, height, color: false });
  const lines = frame.lines.map((line) => JSON.stringify(line)).join(", ");
  return `${study.id.replaceAll("-", "_")}_${width}x${height}: { width: ${frame.width}, height: ${frame.height}, lines: [${lines}] }`;
}

function exportRows(color: boolean): string[] {
  return shipStudies.flatMap((study) => [
    rgb(`// ${study.name}`, toneColors[study.tone], color),
    spriteLiteral(study, 5, 3),
    spriteLiteral(study, 8, 4),
    spriteLiteral(study, 10, 5),
    ""
  ]);
}

function renderExportSection(color: boolean): string {
  const rows = exportRows(color);
  return box("COPYABLE SPRITE FRAMES", rows, { width: 120, color, accent: theme.amber, paddingX: 1, titleAlign: "left" });
}

function parseArgs(argv: string[]): { color: boolean; exportsOnly: boolean; width: number } {
  const readNumber = (name: string, fallback: number): number => {
    const index = argv.indexOf(name);
    return index >= 0 ? Number(argv[index + 1] ?? fallback) : fallback;
  };
  return {
    color: !argv.includes("--no-color") && (argv.includes("--color") || process.stdout.isTTY),
    exportsOnly: argv.includes("--export"),
    width: Math.max(80, readNumber("--cols", process.stdout.columns || 140))
  };
}

export function renderShipPlayground(options: { color?: boolean; width?: number; exportsOnly?: boolean } = {}): string {
  const color = options.color ?? true;
  if (options.exportsOnly) return exportRows(false).join("\n").trimEnd();

  const header = [
    bold(rgb("SHIP PLAYGROUND", theme.white, color), color),
    dim("drawille-style dot canvas -> static braille SpriteFrame candidates", color)
  ].join("  ");
  const rows = [
    fitAnsi(header, options.width ?? 140),
    rgb("─".repeat(Math.min(options.width ?? 140, 140)), theme.border, color),
    ...shipStudies.flatMap((study) => [renderStudyRow(study, color), ""]),
    renderExportSection(color)
  ];
  return normalizeFrame(rows.join("\n"), options.width ?? 140, rows.join("\n").split("\n").length);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  process.stdout.write(`${renderShipPlayground(options)}\n`);
}
