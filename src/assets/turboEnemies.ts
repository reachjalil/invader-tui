import type { EnemySpecies, EnemyVariant } from "./types.js";

// Turbo-mode hazards rendered in the same pure-Braille style as the classic
// Swarm Armada (see enemies.ts) so both modes share one coherent art language.
// Each variant carries a subtle two-frame idle that shifts a single row, matching
// the cadence of the classic enemies rather than redrawing the whole body.

export type TurboEntityKind = "asteroid" | "raider" | "rotor" | "mine" | "comet" | "dreadnought";

const turboEnemyVariants: Record<TurboEntityKind, EnemyVariant> = {
  asteroid: {
    id: "turbo-sidewall-asteroid",
    name: "Sidewall Asteroid",
    role: "large slow rotating side hazard",
    tone: "slate",
    sprite: { width: 7, height: 4, lines: [" ⢀⣴⣶⣦⡀ ", "⢠⣾⣿⣿⣿⣷⡄", "⠘⣿⣿⣿⣿⣿⠃", " ⠙⠛⠿⠛⠋ "] },
    idle: [
      { width: 7, height: 4, lines: [" ⢀⣴⣶⣦⡀ ", "⢠⣾⣿⣿⣿⣷⡄", "⠘⣿⣿⣿⣿⣿⠃", " ⠙⠛⠿⠛⠋ "] },
      { width: 7, height: 4, lines: [" ⢀⣴⣶⣦⡀ ", "⢠⣾⣿⣿⣿⣷⡄", "⠘⣿⣷⣿⣶⣿⠃", " ⠙⠻⠿⠟⠋ "] }
    ],
    tags: ["turbo", "asteroid"],
    attachmentPoints: [{ id: "core", label: "Core", x: 3, y: 2, accepts: ["armor"] }],
    stats: {
      hp: 80,
      armor: 6,
      speed: 2,
      collisionDamage: 18,
      scoreValue: 220,
      fireRate: 0,
      swarmWeight: 6,
      specialTrait: "Drifts across the lane; heavy hull soaks fire.",
      weakness: "Sustained centered fire"
    }
  },
  raider: {
    id: "turbo-needle-raider",
    name: "Needle Raider",
    role: "pursuit fighter",
    tone: "red",
    sprite: { width: 5, height: 2, lines: ["⠰⣾⣿⣷⠆", " ⠙⣿⠋ "] },
    idle: [
      { width: 5, height: 2, lines: ["⠰⣾⣿⣷⠆", " ⠙⣿⠋ "] },
      { width: 5, height: 2, lines: ["⠰⣾⣿⣷⠆", " ⠘⣿⠃ "] }
    ],
    tags: ["turbo", "raider"],
    attachmentPoints: [{ id: "nose", label: "Nose", x: 2, y: 0, accepts: ["cannon"] }],
    stats: {
      hp: 40,
      armor: 1,
      speed: 9,
      collisionDamage: 14,
      scoreValue: 320,
      fireRate: 2,
      swarmWeight: 3,
      specialTrait: "Fast interceptor that leads its shots.",
      weakness: "Thin hull"
    }
  },
  rotor: {
    id: "turbo-rotor-drone",
    name: "Rotor Drone",
    role: "rotating ambusher",
    tone: "purple",
    sprite: { width: 5, height: 2, lines: ["⢾⣦⣿⣴⡷", " ⠈⠛⠁ "] },
    idle: [
      { width: 5, height: 2, lines: ["⢾⣦⣿⣴⡷", " ⠈⠛⠁ "] },
      { width: 5, height: 2, lines: ["⢼⣶⣿⣶⡾", " ⠈⠿⠁ "] }
    ],
    tags: ["turbo", "rotor"],
    attachmentPoints: [{ id: "hub", label: "Hub", x: 2, y: 0, accepts: ["engine"] }],
    stats: {
      hp: 48,
      armor: 2,
      speed: 7,
      collisionDamage: 16,
      scoreValue: 420,
      fireRate: 2,
      swarmWeight: 4,
      specialTrait: "Spinning ambusher that flanks the lane.",
      weakness: "Predictable arc"
    }
  },
  mine: {
    id: "turbo-static-mine",
    name: "Static Mine",
    role: "space lane obstacle",
    tone: "amber",
    sprite: { width: 3, height: 3, lines: [" ⡆ ", "⢾⣿⡷", " ⠓ "] },
    idle: [
      { width: 3, height: 3, lines: [" ⡆ ", "⢾⣿⡷", " ⠓ "] },
      { width: 3, height: 3, lines: [" ⠆ ", "⢾⣶⡷", " ⠒ "] }
    ],
    tags: ["turbo", "mine"],
    attachmentPoints: [{ id: "charge", label: "Charge", x: 1, y: 1, accepts: ["reactor"] }],
    stats: {
      hp: 36,
      armor: 3,
      speed: 1,
      collisionDamage: 28,
      scoreValue: 220,
      fireRate: 0,
      swarmWeight: 2,
      specialTrait: "Stationary charge that detonates on contact.",
      weakness: "Destroyed before arming"
    }
  },
  comet: {
    id: "turbo-razor-comet",
    name: "Razor Comet",
    role: "high speed crossing hazard",
    tone: "lime",
    sprite: { width: 6, height: 2, lines: ["⢀⣀⣠⣴⣾⡆", " ⠁⠂⠄⠙⠃"] },
    idle: [
      { width: 6, height: 2, lines: ["⢀⣀⣠⣴⣾⡆", " ⠁⠂⠄⠙⠃"] },
      { width: 6, height: 2, lines: ["⢀⣀⣠⣴⣾⡆", "⠁⠂⠄⠁⠛⠃"] }
    ],
    tags: ["turbo", "comet"],
    attachmentPoints: [{ id: "tail", label: "Tail", x: 0, y: 0, accepts: ["engine"] }],
    stats: {
      hp: 30,
      armor: 0,
      speed: 12,
      collisionDamage: 18,
      scoreValue: 260,
      fireRate: 0,
      swarmWeight: 2,
      specialTrait: "Streaks across the lane at high speed.",
      weakness: "Fragile core"
    }
  },
  dreadnought: {
    id: "turbo-dreadnought-v2",
    name: "Dread Gate V2",
    role: "version two boss",
    tone: "red",
    sprite: { width: 11, height: 4, lines: ["  ⣠⣴⣶⣶⣶⣦⣄  ", "⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆", "⠸⣿⣿⠿⣿⠿⣿⠿⣿⣿⠇", "  ⠙⠛⠉⠉⠉⠛⠋  "] },
    idle: [
      { width: 11, height: 4, lines: ["  ⣠⣴⣶⣶⣶⣦⣄  ", "⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆", "⠸⣿⣿⠿⣿⠿⣿⠿⣿⣿⠇", "  ⠙⠛⠉⠉⠉⠛⠋  "] },
      { width: 11, height: 4, lines: ["  ⣠⣴⣶⣶⣶⣦⣄  ", "⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆", "⠸⣿⣿⣶⣿⣶⣿⣶⣿⣿⠇", "  ⠙⠛⠿⠿⠿⠛⠋  "] }
    ],
    tags: ["turbo", "boss"],
    attachmentPoints: [{ id: "core", label: "Core", x: 5, y: 1, accepts: ["cannon"] }],
    stats: {
      hp: 420,
      armor: 10,
      speed: 2,
      collisionDamage: 34,
      scoreValue: 4200,
      fireRate: 4,
      swarmWeight: 12,
      specialTrait: "Armored flagship that anchors the boss gate.",
      weakness: "Exposed cannon ports"
    }
  }
};

export const turboEntityVariants = turboEnemyVariants;

export const turboEnemySpecies: EnemySpecies = {
  id: "turbo-hazards",
  displayName: "Turbo Hazard Run",
  lore: "Fast-lane obstacles and raiders encountered on the Turbo drive route.",
  variants: Object.values(turboEnemyVariants)
};
