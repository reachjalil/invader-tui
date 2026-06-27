import { enemySpecies, shipFamily, turboEnemySpecies, type GameAssetVariant, type SpriteFrame } from "../assets/index.js";
import { fitAnsi, rgb, theme, visibleLength } from "../tui/ansi.js";

const toneColors = {
  green: theme.green,
  red: theme.red,
  amber: theme.amber,
  cyan: theme.cyan,
  blue: theme.blue,
  purple: theme.purple,
  slate: theme.slate,
  lime: theme.lime,
  white: theme.white
} as const;

export function validateSpriteFrame(frame: SpriteFrame): string[] {
  const errors: string[] = [];
  if (frame.lines.length !== frame.height) {
    errors.push(`expected ${frame.height} lines, received ${frame.lines.length}`);
  }
  frame.lines.forEach((line, index) => {
    const length = visibleLength(line);
    if (length !== frame.width) {
      errors.push(`line ${index + 1} expected width ${frame.width}, received ${length}: ${JSON.stringify(line)}`);
    }
  });
  return errors;
}

export function validateAssetCatalog(): string[] {
  const errors: string[] = [];
  for (const variant of [...enemySpecies.variants, ...turboEnemySpecies.variants, ...shipFamily.variants]) {
    const frames = [variant.sprite, ...(variant.idle ?? [])];
    frames.forEach((frame, index) => {
      for (const error of validateSpriteFrame(frame)) {
        errors.push(`${variant.id}${index ? ` idle ${index}` : ""}: ${error}`);
      }
    });
  }
  return errors;
}

export function renderSprite(variant: GameAssetVariant, color = true, pulse = 0): string[] {
  const accent = toneColors[variant.tone];
  const animated = variant as GameAssetVariant & { idle?: SpriteFrame[] };
  const source = animated.idle?.[pulse % animated.idle.length] ?? variant.sprite;
  return source.lines.map((line: string) => fitAnsi(rgb(line, accent, color), source.width));
}

export function renderBareSprite(frame: SpriteFrame, width: number): string[] {
  return frame.lines.map((line) => fitAnsi(line, width));
}
