import type { SpriteFrame } from "./types.js";

// Braille dot bit layout per cell column/row (U+2800 base):
// (0,0)=0x01 (1,0)=0x08
// (0,1)=0x02 (1,1)=0x10
// (0,2)=0x04 (1,2)=0x20
// (0,3)=0x40 (1,3)=0x80
const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80]
] as const;

/**
 * Compiles dot-matrix pixel art into a Braille SpriteFrame.
 *
 * Each row is a string where `#` marks a lit dot and `.` (or space) marks an
 * empty dot. Rows must share one length that is a multiple of 2, and the row
 * count must be a multiple of 4, so the art maps exactly onto Braille cells:
 * one output character per 2x4 dot block. Empty cells become U+2800 so every
 * line keeps its full visible width.
 */
export function brailleFrame(art: string[]): SpriteFrame {
  const rows = art.length;
  const cols = art[0]?.length ?? 0;
  if (rows === 0 || rows % 4 !== 0) {
    throw new Error(`brailleFrame: row count ${rows} must be a positive multiple of 4`);
  }
  if (cols === 0 || cols % 2 !== 0) {
    throw new Error(`brailleFrame: column count ${cols} must be a positive multiple of 2`);
  }
  for (const [index, row] of art.entries()) {
    if (row.length !== cols) {
      throw new Error(`brailleFrame: row ${index + 1} length ${row.length} differs from first row length ${cols}`);
    }
  }

  const width = cols / 2;
  const height = rows / 4;
  const lines: string[] = [];
  for (let cellY = 0; cellY < height; cellY += 1) {
    let line = "";
    for (let cellX = 0; cellX < width; cellX += 1) {
      let mask = 0;
      for (let dotY = 0; dotY < 4; dotY += 1) {
        for (let dotX = 0; dotX < 2; dotX += 1) {
          if (art[cellY * 4 + dotY]![cellX * 2 + dotX] === "#") {
            mask |= DOT_BITS[dotY]![dotX]!;
          }
        }
      }
      line += String.fromCharCode(0x2800 + mask);
    }
    lines.push(line);
  }

  return { width, height, lines };
}
