import { enemySpecies, shipFamily } from "../assets/index.js";

export type KitchenSinkFocus = "enemies" | "ships" | "counters";

export type BorderStyle = "single" | "double" | "heavy" | "arcade" | "block" | "ornamental" | "cyberpunk" | "dashed" | "terminal" | "cryptic";
export type BackgroundStyle =
  | "empty" | "stars" | "nebula" | "warp" | "asteroids" | "matrix" | "nova"
  | "blackhole" | "pulsar" | "radar" | "hyperspace" | "aurora"
  | "fire" | "ice" | "crt"
  | "sine" | "spiral" | "rain";

export type KitchenSinkRenderOptions = {
  width: number;
  height: number;
  color?: boolean;
  tick?: number;
  paused?: boolean;
  focus?: KitchenSinkFocus;
  borderStyle?: BorderStyle;
  backgroundStyle?: BackgroundStyle;
};

export type KitchenSinkState = {
  tick: number;
  viewport: {
    width: number;
    height: number;
  };
  paused: boolean;
  selectedEnemyIndex: number;
  selectedShipIndex: number;
  focus: KitchenSinkFocus;
  borderStyle: BorderStyle;
  backgroundStyle: BackgroundStyle;
  counters: {
    score: number;
    wave: number;
    combo: number;
    enemiesRemaining: number;
    shotsFired: number;
    accuracy: number;
  };
  bars: {
    hull: number;
    shield: number;
    heat: number;
    waveProgress: number;
    threat: number;
  };
};

export function buildKitchenSinkState(options: KitchenSinkRenderOptions): KitchenSinkState {
  const tick = Math.max(0, Math.floor(options.tick ?? 0));
  const selectedEnemyIndex = Math.floor(tick / 4) % enemySpecies.variants.length;
  const selectedShipIndex = Math.floor(tick / 5) % shipFamily.variants.length;
  const wave = 1 + Math.floor(tick / 40);
  const combo = 1 + (Math.floor(tick / 7) % 9);
  const shotsFired = 24 + tick * 3;
  const accuracy = 68 + ((tick * 7) % 27);
  const borderStyle = options.borderStyle ?? "single";
  const backgroundStyle = options.backgroundStyle ?? "stars";
  
  return {
    tick,
    viewport: {
      width: options.width,
      height: options.height
    },
    paused: options.paused ?? false,
    selectedEnemyIndex,
    selectedShipIndex,
    focus: options.focus ?? "enemies",
    borderStyle,
    backgroundStyle,
    counters: {
      score: 1200 + tick * 73 + combo * 40,
      wave,
      combo,
      enemiesRemaining: Math.max(0, 64 - ((tick * 2) % 65)),
      shotsFired,
      accuracy
    },
    bars: {
      hull: 74 + Math.round(Math.sin(tick / 8) * 14),
      shield: 55 + ((tick * 5) % 36),
      heat: 18 + ((tick * 9) % 78),
      waveProgress: (tick * 4) % 101,
      threat: 25 + ((tick * 6) % 72)
    }
  };
}
