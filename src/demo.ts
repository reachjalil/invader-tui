import { box, hstack } from "./tui/layout.js";
import { rgb, theme, bold, fitAnsi, visibleLength, formatNumber, dim, joinAligned, type Rgb } from "./tui/ansi.js";
import {
  buildDefaultShipDesign,
  enemySpecies,
  getCosmeticPartsForSlot,
  getModulesForDesignSlot,
  getSelectedCosmeticPart,
  getSelectedDesignModule,
  getShipDesignWeaponName,
  resolveShipDesign,
  shipCallsigns,
  shipClassConfigs,
  shipDesignPresets,
  shipPaintSchemes,
  type ShipCosmeticSlotId,
  type ShipDesign,
  type ShipDesignModuleSlotId,
  type SpriteFrame
} from "./assets/index.js";
import { renderArcadeHud, renderShipDesignBuilder, type ArcadeHudState, type ShipBuilderSection } from "./render/widgets.js";
import { renderSprite } from "./render/sprites.js";

// Types
type Tone = "green" | "red" | "amber" | "cyan" | "blue" | "purple" | "slate" | "lime" | "white";

type Cell = {
  char: string;
  color: Rgb | null;
  bold?: boolean;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: Rgb;
  char: string;
  isEnemy: boolean;
  damage: number;
};

type ProjectileVisualStyle = {
  head: string;
  trail: string;
  trailLength: number;
  radius: 0 | 1 | 2;
  side?: string;
  coreColor?: Rgb;
};

type Enemy = {
  id: string;
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  variant: any;
  shootCooldown: number;
  isBoss?: boolean;
  bossPattern?: "monarch" | "titan" | "leviathan";
  turboKind?: TurboEntityKind;
  rotation?: number;
  spin?: number;
  damage?: number;
  phase?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: Rgb;
  life: number;
  maxLife: number;
};

type Star = {
  x: number;
  y: number;
  char: string;
  speed: number;
};

type CollectibleKind = "star" | "bonus" | "shield" | "cloak" | "cache";

type Collectible = {
  id: number;
  kind: CollectibleKind;
  x: number;
  y: number;
  vy: number;
  char: string;
  color: Rgb;
  value: number;
};

type PlayerShip = {
  classId: string;
  name: string;
  design: ShipDesign;
  variant: any;
  hp: number;
  shield: number;
  speed: number;
  cooldown: number;
  weapon: string;
  desc: string;
};

type PlayerSelectionSlot = "p1" | "com";
type GameMode = "classic" | "turbo";
type StartScreenMode = "select" | "customize";
type TurboEntityKind = "asteroid" | "raider" | "rotor" | "mine" | "comet" | "dreadnought";
type TurboHeading = 0 | 1 | 2 | 3;

type GameModeConfig = {
  label: string;
  boardWidth: number;
  boardHeight: number;
  accent: Rgb;
};

type ComWingmate = {
  ship: PlayerShip;
  x: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shootCooldown: number;
  shieldPowerTicks: number;
  level: number;
  destroyed: boolean;
};

type StartGameOptions = {
  preserveScore?: boolean;
  advanceDifficulty?: boolean;
  comShip?: PlayerShip | null;
};

type TurboSpecialEffect = {
  kind: "laser" | "blast";
  x: number;
  y: number;
  radius: number;
  color: Rgb;
  life: number;
  maxLife: number;
};

// Tone colors mapping
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

// Game Config
const CLASSIC_BOARD_WIDTH = 83;
const CLASSIC_BOARD_HEIGHT = 18;
const TURBO_BOARD_WIDTH = 120;
const TURBO_BOARD_HEIGHT = 28;
const MIN_BOARD_WIDTH = CLASSIC_BOARD_WIDTH;
const MIN_BOARD_HEIGHT = CLASSIC_BOARD_HEIGHT;
const MIN_PLAYFIELD_WIDTH = MIN_BOARD_WIDTH + 2;
const MIN_VIEWPORT_HEIGHT = 24;
const GAMEPLAY_HUD_HEIGHT = 4;
const TURBO_SPECIAL_MAX_CHARGE = 100;
let BOARD_WIDTH = MIN_BOARD_WIDTH;
let BOARD_HEIGHT = MIN_BOARD_HEIGHT;
let PLAYFIELD_WIDTH = MIN_PLAYFIELD_WIDTH;
const SPLASH_HEIGHT = 18;
const FRAME_INTERVAL = 40; // 25 FPS
const MAX_SHIP_LEVEL = 3;
const BASE_UPGRADE_POINTS = 500;
const SHIELD_POWER_TICKS = 600;
const CLOAK_POWER_TICKS = 360;
const gameModeOrder: GameMode[] = ["classic", "turbo"];
const gameModeConfigs: Record<GameMode, GameModeConfig> = {
  classic: {
    label: "Classic",
    boardWidth: CLASSIC_BOARD_WIDTH,
    boardHeight: CLASSIC_BOARD_HEIGHT,
    accent: theme.cyan
  },
  turbo: {
    label: "Turbo",
    boardWidth: TURBO_BOARD_WIDTH,
    boardHeight: TURBO_BOARD_HEIGHT,
    accent: theme.amber
  }
};

const turboEntityVariants: Record<TurboEntityKind, any> = {
  asteroid: {
    id: "turbo-sidewall-asteroid",
    name: "Sidewall Asteroid",
    role: "large slow rotating side hazard",
    tone: "slate",
    sprite: { width: 7, height: 4, lines: [" ╓───╖ ", "▞▒▓██▓▚", "▚██▓▒░▞", " ╙───╜ "] },
    idle: [
      { width: 7, height: 4, lines: [" ╓───╖ ", "▞▒▓██▓▚", "▚██▓▒░▞", " ╙───╜ "] },
      { width: 7, height: 4, lines: [" ╓───╖ ", "▞▓██▓▒▚", "▚█▓▒░░▞", " ╙───╜ "] },
      { width: 7, height: 4, lines: [" ╓───╖ ", "▞██▓▒░▚", "▚▓▒░░█▞", " ╙───╜ "] },
      { width: 7, height: 4, lines: [" ╓───╖ ", "▞█▓▒░░▚", "▚▒░░██▞", " ╙───╜ "] }
    ],
    tags: ["turbo", "asteroid"],
    attachmentPoints: [{ id: "core", label: "Core", x: 3, y: 2, accepts: ["armor"] }]
  },
  raider: {
    id: "turbo-needle-raider",
    name: "Needle Raider",
    role: "pursuit fighter",
    tone: "red",
    sprite: { width: 5, height: 2, lines: ["<▲═> ", "▞██▚"] },
    idle: [
      { width: 5, height: 2, lines: ["<▲═> ", "▞██▚"] },
      { width: 5, height: 2, lines: ["<▼═> ", "▚██▞"] }
    ],
    tags: ["turbo", "raider"],
    attachmentPoints: [{ id: "nose", label: "Nose", x: 2, y: 0, accepts: ["cannon"] }]
  },
  rotor: {
    id: "turbo-rotor-drone",
    name: "Rotor Drone",
    role: "rotating ambusher",
    tone: "purple",
    sprite: { width: 5, height: 2, lines: ["═o═o═", " ╱║╲ "] },
    idle: [
      { width: 5, height: 2, lines: ["═o═o═", " ╱║╲ "] },
      { width: 5, height: 2, lines: ["╓o─o╖", " ═╬═ "] },
      { width: 5, height: 2, lines: ["╢o─o╟", " ╲║╱ "] }
    ],
    tags: ["turbo", "rotor"],
    attachmentPoints: [{ id: "hub", label: "Hub", x: 2, y: 0, accepts: ["engine"] }]
  },
  mine: {
    id: "turbo-static-mine",
    name: "Static Mine",
    role: "space lane obstacle",
    tone: "amber",
    sprite: { width: 3, height: 3, lines: [" ┿ ", "┿█┿", " ┿ "] },
    idle: [
      { width: 3, height: 3, lines: [" ┿ ", "┿█┿", " ┿ "] },
      { width: 3, height: 3, lines: [" ╳ ", "╳▓╳", " ╳ "] }
    ],
    tags: ["turbo", "mine"],
    attachmentPoints: [{ id: "charge", label: "Charge", x: 1, y: 1, accepts: ["reactor"] }]
  },
  comet: {
    id: "turbo-razor-comet",
    name: "Razor Comet",
    role: "high speed crossing hazard",
    tone: "lime",
    sprite: { width: 6, height: 2, lines: ["═══▶o ", "  ░░  "] },
    idle: [
      { width: 6, height: 2, lines: ["═══▶o ", "  ░░  "] },
      { width: 6, height: 2, lines: ["───▷O ", " ░░░  "] }
    ],
    tags: ["turbo", "comet"],
    attachmentPoints: [{ id: "tail", label: "Tail", x: 0, y: 0, accepts: ["engine"] }]
  },
  dreadnought: {
    id: "turbo-dreadnought-v2",
    name: "Dread Gate V2",
    role: "version two boss",
    tone: "red",
    sprite: { width: 11, height: 4, lines: ["  ╭═════╮  ", "<║ █ █ █ ║>", "  ╰═╦═╦═╯  ", "   ▞███▚   "] },
    idle: [
      { width: 11, height: 4, lines: ["  ╭═════╮  ", "<║ █ █ █ ║>", "  ╰═╦═╦═╯  ", "   ▞███▚   "] },
      { width: 11, height: 4, lines: ["  ╭═════╮  ", "<║ ▓ ▓ ▓ ║>", "  ╰═╩═╩═╯  ", "   ▚███▞   "] }
    ],
    tags: ["turbo", "boss"],
    attachmentPoints: [{ id: "core", label: "Core", x: 5, y: 1, accepts: ["cannon"] }]
  }
};

function cloneShipDesign(design: ShipDesign): ShipDesign {
  return {
    ...design,
    modules: { ...design.modules },
    ...(design.cosmetics ? { cosmetics: { ...design.cosmetics } } : {})
  };
}

function buildPlayerShipFromDesign(design: ShipDesign, level = 1): PlayerShip {
  const resolved = resolveShipDesign(design, level);
  return {
    classId: resolved.classId,
    name: resolved.name,
    design: cloneShipDesign(design),
    variant: resolved.variant,
    hp: resolved.stats.hull,
    shield: resolved.stats.shield,
    speed: Math.max(1, resolved.stats.speed / 4),
    cooldown: Math.max(3, 10 - resolved.stats.fireRate),
    weapon: getShipDesignWeaponName(design, level),
    desc: resolved.description
  };
}

// Player ships are generated from editable designs so the builder and gameplay share stats.
const playerShips: PlayerShip[] = shipClassConfigs.map((config) => buildPlayerShipFromDesign(buildDefaultShipDesign(config.id)));

// Terminal controls escape sequences
const terminal = {
  disableMouse: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l",
  enterLiveScreen: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[2J\x1b[H",
  exitLiveScreen: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[?25h\x1b[?1049l",
  frameStart: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[H",
  frameEnd: "\x1b[J"
} as const;

// Global Game State
let screen: "splash" | "mode" | "start" | "playing" | "gameover" | "victory" = "splash";
let selectedGameMode: GameMode = "classic";
let menuAnimationTick = 0;
let selectedShipIndex = 0;
let selectedPlayerCount: 1 | 2 = 1;
let selectedComShipIndex = 1;
let selectedLoadoutSlot: PlayerSelectionSlot = "p1";
let startScreenMode: StartScreenMode = "select";
const builderSections: ShipBuilderSection[] = [
  "color",
  "nose",
  "leftWing",
  "rightWing",
  "tail",
  "interior",
  "gun",
  "wings",
  "engine",
  "core",
  "defense",
  "support",
  "callsign"
];
let builderSectionIndex = 0;
let builderSlotIndex = 0;
let builderPresetIndex = 0;
let score = 0;
let highScore = 15000;
let wave = 1;
let playerX = Math.floor(BOARD_WIDTH / 2) - 2;
let playerY = BOARD_HEIGHT - 3;
let playerHp = 100;
let playerMaxHp = 100;
let playerShield = 50;
let playerMaxShield = 50;
let playerSpeed = 1.5;
let playerShootCooldown = 0;
let activeShip = playerShips[0]!;
let activeComShip: PlayerShip | null = null;
let comWingmate: ComWingmate | null = null;

let enemies: Enemy[] = [];
let bullets: Bullet[] = [];
let particles: Particle[] = [];
let stars: Star[] = [];
let collectibles: Collectible[] = [];
let turboSpecialEffects: TurboSpecialEffect[] = [];
let tick = 0;
let shotsFired = 0;
let shotsHit = 0;
let enemiesDestroyed = 0;
let collectibleId = 0;
let playerLevel = 1;
let upgradePoints = 0;
let shieldPowerTicks = 0;
let cloakPowerTicks = 0;
let turboSpecialCharge = TURBO_SPECIAL_MAX_CHARGE;
let turboWaveQuota = 0;
let turboWaveSpawned = 0;
let turboWaveCleared = 0;
let turboSpawnCooldown = 0;
let turboPlayerBank = 0;
let turboPlayerLift = 0;
let playerMotionBank = 0;
let playerMotionLift = 0;
let playerMotionTicks = 0;
let turboPlayerRotation = 0;
let turboPlayerHeading: TurboHeading = 0;
let turboEngineTicks = 0;
let turboGateDistance = 0;
let turboGateStartDistance = 0;
let turboRouteX = 0;
let turboBossDestroyed = false;
let statusMessage = "READY";
let statusMessageTicks = 0;
let gameOverReason = "SHIP DESTROYED";
let campaignLoop = 1;

let enemyDirection = 1;
let enemyMoveTimer = 0;
let enemyBaseMoveCooldown = 20; // in ticks
let enemyStepCount = 0;

let shakeIntensity = 0;
let flashTicks = 0;
const colorEnabled = true;
let closed = false;
let gameInterval: NodeJS.Timeout;

function isTurboMode(): boolean {
  return selectedGameMode === "turbo";
}

function getGameModeConfig(mode: GameMode = selectedGameMode): GameModeConfig {
  return gameModeConfigs[mode];
}

function getStarCount(): number {
  const density = isTurboMode() ? 24 : 45;
  const minimum = isTurboMode() ? 70 : 35;
  return Math.max(minimum, Math.floor((BOARD_WIDTH * BOARD_HEIGHT) / density));
}

function clampShipX(x: number, shipWidth: number): number {
  return Math.max(1, Math.min(BOARD_WIDTH - shipWidth - 1, x));
}

function getPlayerHomeY(shipHeight = activeShip.variant.sprite.height): number {
  return Math.max(1, BOARD_HEIGHT - Math.max(3, shipHeight));
}

function getTurboPlayerMinY(): number {
  return Math.max(3, Math.floor(BOARD_HEIGHT * 0.32));
}

function clampShipY(y: number, shipHeight: number): number {
  const homeY = getPlayerHomeY(shipHeight);
  if (!isTurboMode()) return homeY;
  return Math.max(getTurboPlayerMinY(), Math.min(homeY, y));
}

function getInvasionLineY(): number {
  return getPlayerHomeY(activeShip.variant.sprite.height);
}

function shiftTurboWorld(deltaX: number, deltaY: number) {
  if (!isTurboMode() || (deltaX === 0 && deltaY === 0)) return;

  for (const star of stars) {
    star.x += deltaX * 0.45;
    star.y += deltaY * 0.45;
  }
  for (const pickup of collectibles) {
    pickup.x += deltaX;
    pickup.y += deltaY;
  }
  for (const bullet of bullets) {
    bullet.x += deltaX;
    bullet.y += deltaY;
  }
  for (const particle of particles) {
    particle.x += deltaX;
    particle.y += deltaY;
  }
  for (const effect of turboSpecialEffects) {
    effect.x += deltaX;
    effect.y += deltaY;
  }
  for (const enemy of enemies) {
    enemy.x += deltaX;
    enemy.y += deltaY;
  }
  if (comWingmate && !comWingmate.destroyed) {
    comWingmate.x += deltaX;
  }

  const routeLimit = getTurboRouteLimit();
  turboRouteX = Math.max(-routeLimit, Math.min(routeLimit, turboRouteX - deltaX * 0.45));
  if (wave < 3 && turboGateStartDistance > 0) {
    const maxDistance = Math.max(turboGateStartDistance * 1.28, turboGateDistance + 40, 900);
    turboGateDistance = Math.max(0, Math.min(maxDistance, turboGateDistance - deltaY * 3));
  }
}

function applyTurboCameraFollow(shipWidth: number, shipHeight: number) {
  if (!isTurboMode()) return;

  const leftSoft = Math.max(12, Math.floor(BOARD_WIDTH * 0.28));
  const rightSoft = Math.max(leftSoft + 1, BOARD_WIDTH - shipWidth - leftSoft);
  const topSoft = Math.max(getTurboPlayerMinY(), Math.floor(BOARD_HEIGHT * 0.42));
  const bottomSoft = Math.min(getPlayerHomeY(shipHeight), Math.max(topSoft + 1, Math.floor(BOARD_HEIGHT * 0.72)));
  let deltaX = 0;
  let deltaY = 0;

  if (playerX < leftSoft) deltaX = leftSoft - playerX;
  else if (playerX > rightSoft) deltaX = rightSoft - playerX;

  if (playerY < topSoft) deltaY = topSoft - playerY;
  else if (playerY > bottomSoft) deltaY = bottomSoft - playerY;

  if (deltaX === 0 && deltaY === 0) return;
  playerX += deltaX;
  playerY += deltaY;
  shiftTurboWorld(deltaX, deltaY);
}

function applyGameModeDimensions(mode: GameMode = selectedGameMode) {
  const config = getGameModeConfig(mode);
  if (mode === "turbo") {
    const terminalWidth = process.stdout.columns || config.boardWidth + 2;
    const terminalHeight = process.stdout.rows || config.boardHeight + GAMEPLAY_HUD_HEIGHT + 3;
    BOARD_WIDTH = Math.max(config.boardWidth, terminalWidth - 2);
    BOARD_HEIGHT = Math.max(config.boardHeight, terminalHeight - GAMEPLAY_HUD_HEIGHT - 3);
  } else {
    BOARD_WIDTH = config.boardWidth;
    BOARD_HEIGHT = config.boardHeight;
  }
  PLAYFIELD_WIDTH = BOARD_WIDTH + 2;
  normalizeViewportState();
}

function normalizeViewportState() {
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;
  applyTurboCameraFollow(pWidth, pHeight);
  playerX = clampShipX(playerX, pWidth);
  playerY = clampShipY(playerY, pHeight);

  if (comWingmate && !comWingmate.destroyed) {
    comWingmate.x = clampShipX(comWingmate.x, comWingmate.ship.variant.sprite.width);
  }

  for (const star of stars) {
    if (star.x < 0 || star.x >= BOARD_WIDTH || star.y < 0 || star.y >= BOARD_HEIGHT) {
      star.x = Math.floor(Math.random() * BOARD_WIDTH);
      star.y = Math.floor(Math.random() * BOARD_HEIGHT);
    }
  }

  while (stars.length < getStarCount()) {
    stars.push({
      x: Math.floor(Math.random() * BOARD_WIDTH),
      y: Math.floor(Math.random() * BOARD_HEIGHT),
      char: ["·", ".", "·", ".", "·"][Math.floor(Math.random() * 5)]!,
      speed: Math.random() > 0.8 ? 0.5 : 0.2
    });
  }
  if (stars.length > getStarCount()) stars.length = getStarCount();

  for (const enemy of enemies) {
    if (isTurboMode() && enemy.turboKind) continue;
    enemy.x = Math.max(1, Math.min(BOARD_WIDTH - enemy.width - 1, enemy.x));
    enemy.y = Math.max(0, Math.min(BOARD_HEIGHT - enemy.height - 1, enemy.y));
  }
}

function syncViewportSize() {
  applyGameModeDimensions();
}

// Initialize background stars
function initStars() {
  stars = [];
  for (let i = 0; i < getStarCount(); i++) {
    stars.push({
      x: Math.floor(Math.random() * BOARD_WIDTH),
      y: Math.floor(Math.random() * BOARD_HEIGHT),
      char: ["·", ".", "·", ".", "·"][Math.floor(Math.random() * 5)]!,
      speed: Math.random() > 0.8 ? 0.5 : 0.2
    });
  }
}

// Center text helper
function centerText(text: string, width: number): string {
  const len = visibleLength(text);
  if (len >= width) return text;
  const left = Math.floor((width - len) / 2);
  const right = width - len - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function getWaveStartEnemiesCount(waveNum = wave): number {
  if (waveNum === 1) return isTurboMode() ? 32 : 18;
  if (waveNum === 2) return isTurboMode() ? 28 : 15;
  return isTurboMode() ? 7 : 5;
}

function getDifficultyMultiplier(): number {
  return 1 + (campaignLoop - 1) * 0.25;
}

function getEnemyTempoMultiplier(): number {
  return Math.max(0.55, 1 - (campaignLoop - 1) * 0.08);
}

function scaleEnemyHp(value: number): number {
  return Math.max(1, Math.round(value * getDifficultyMultiplier()));
}

function scaleEnemyDamage(value: number): number {
  return Math.max(1, Math.round(value * (1 + (campaignLoop - 1) * 0.18)));
}

function scaleEnemyCooldown(value: number): number {
  return Math.max(8, Math.floor(value * getEnemyTempoMultiplier()));
}

function applyCampaignDifficultyToWave() {
  if (campaignLoop <= 1) return;

  for (const enemy of enemies) {
    const scaledHp = scaleEnemyHp(enemy.maxHp);
    enemy.hp = scaledHp;
    enemy.maxHp = scaledHp;
    enemy.scoreValue = Math.round(enemy.scoreValue * getDifficultyMultiplier());
    enemy.shootCooldown = scaleEnemyCooldown(enemy.shootCooldown);
  }

  enemyBaseMoveCooldown = Math.max(6, Math.floor(enemyBaseMoveCooldown * getEnemyTempoMultiplier()));
}

function getNextUpgradeAt(): number | null {
  return playerLevel >= MAX_SHIP_LEVEL ? null : BASE_UPGRADE_POINTS * playerLevel;
}

function buildLeveledShip(ship: PlayerShip, level: number): PlayerShip {
  return buildPlayerShipFromDesign(ship.design, level);
}

function syncComWingmateLevel(heal = false) {
  if (!comWingmate || comWingmate.destroyed) return;

  const hpRatio = comWingmate.maxHp > 0 ? comWingmate.hp / comWingmate.maxHp : 1;
  const leveledShip = buildLeveledShip(comWingmate.ship, playerLevel);
  comWingmate.ship = leveledShip;
  comWingmate.level = playerLevel;
  comWingmate.maxHp = leveledShip.hp;
  comWingmate.maxShield = leveledShip.shield;
  comWingmate.hp = heal
    ? Math.min(comWingmate.maxHp, Math.max(comWingmate.hp, Math.round(comWingmate.maxHp * hpRatio)) + 16)
    : Math.min(comWingmate.hp, comWingmate.maxHp);
  comWingmate.shield = Math.min(comWingmate.shield, comWingmate.maxShield);
}

function setStatus(message: string, ticks = 90) {
  statusMessage = message;
  statusMessageTicks = ticks;
}

function applyShipLevel(heal = false) {
  const hpRatio = playerMaxHp > 0 ? playerHp / playerMaxHp : 1;
  activeShip = buildLeveledShip(activeShip, playerLevel);

  playerMaxHp = activeShip.hp;
  playerMaxShield = activeShip.shield;
  playerSpeed = activeShip.speed;
  playerHp = heal ? Math.min(playerMaxHp, Math.max(playerHp, Math.round(playerMaxHp * hpRatio)) + 20) : playerMaxHp;
  playerShield = Math.min(playerShield, playerMaxShield);
  syncComWingmateLevel(heal);
}

function addUpgradePoints(value: number) {
  upgradePoints += value;
  chargeTurboSpecial(value * 0.05);
  let next = getNextUpgradeAt();
  while (next !== null && upgradePoints >= next) {
    upgradePoints -= next;
    playerLevel++;
    applyShipLevel(true);
    shakeIntensity = 3;
    setStatus(`LEVEL ${playerLevel} ${activeShip.weapon.toUpperCase()}`, 140);
    spawnExplosion(playerX + activeShip.variant.sprite.width / 2, playerY, toneColors[activeShip.variant.tone as Tone] ?? theme.cyan, 28);
    next = getNextUpgradeAt();
  }
}

function activateShield() {
  playerShield = playerMaxShield;
  shieldPowerTicks = SHIELD_POWER_TICKS;
  setStatus("SHIELD ONLINE", 120);
  spawnExplosion(playerX + activeShip.variant.sprite.width / 2, playerY, theme.blue, 18);
}

function activateCloak() {
  cloakPowerTicks = CLOAK_POWER_TICKS;
  setStatus("CLOAK FIELD ONLINE", 120);
  spawnExplosion(playerX + activeShip.variant.sprite.width / 2, playerY, theme.purple, 16);
}

function activateComShield() {
  if (!comWingmate || comWingmate.destroyed) {
    activateShield();
    return;
  }

  comWingmate.shield = comWingmate.maxShield;
  comWingmate.shieldPowerTicks = SHIELD_POWER_TICKS;
  setStatus("COM SHIELD ONLINE", 120);
  spawnExplosion(comWingmate.x + comWingmate.ship.variant.sprite.width / 2, playerY, theme.blue, 16);
}

function buildDemoHudState(): ArcadeHudState {
  const boss = enemies.find((enemy) => enemy.isBoss);
  const hudState: ArcadeHudState = {
    score,
    highScore,
    wave,
    level: playerLevel,
    upgradePoints,
    nextUpgradeAt: getNextUpgradeAt(),
    enemiesRemaining: getTurboEnemiesRemaining(),
    hp: playerHp,
    maxHp: playerMaxHp,
    shield: playerShield,
    maxShield: playerMaxShield,
    shieldActive: playerShield > 0 || shieldPowerTicks > 0,
    gameMode: selectedGameMode.toUpperCase()
  };
  if (isTurboMode()) {
    hudState.specialName = getTurboSpecialName();
    hudState.specialCharge = turboSpecialCharge;
  }
  if (boss) {
    hudState.boss = { name: boss.name.replace(" (BOSS)", ""), hp: boss.hp, maxHp: boss.maxHp };
  }
  return hudState;
}

function renderComHudText(): string {
  if (!activeComShip) return "";
  if (!comWingmate || comWingmate.destroyed) {
    return `${rgb("COM", theme.amber, colorEnabled)} ${rgb("LOST", theme.red, colorEnabled)}`;
  }

  const shipCode = comWingmate.ship.name.split(" ")[0]?.toUpperCase() ?? "ALLY";
  const hp = `${Math.max(0, Math.ceil(comWingmate.hp))}/${comWingmate.maxHp}`;
  const shield = comWingmate.shield > 0 ? `  ${rgb("SH", theme.blue, colorEnabled)} ${Math.ceil(comWingmate.shield)}` : "";
  return `${rgb("COM", theme.amber, colorEnabled)} ${shipCode} ${rgb("HP", theme.green, colorEnabled)} ${hp}${shield}`;
}

function renderGameplaySupportLine(width: number): string {
  const comText = renderComHudText();
  const statusText = statusMessageTicks > 0 ? rgb(statusMessage, theme.amber, colorEnabled) : "";
  const objectiveText = isTurboMode() ? rgb(renderTurboObjectiveText(), theme.cyan, colorEnabled) : "";
  const cloakText = cloakPowerTicks > 0 ? rgb(`CLOAK ${Math.ceil(cloakPowerTicks / 25)}`, theme.purple, colorEnabled) : "";
  const leftText = [comText, objectiveText, cloakText].filter(Boolean).join("  ");

  if (leftText && statusText) return fitAnsi(joinAligned(leftText, statusText, width, 3), width);
  if (leftText) return centerText(leftText, width);
  if (statusText) return centerText(statusText, width);
  return "";
}

function getTurboHeadingName(): string {
  if (turboPlayerHeading === 1) return "EAST";
  if (turboPlayerHeading === 2) return "AWAY";
  if (turboPlayerHeading === 3) return "WEST";
  return "GATE";
}

function getTurboHeadingX(): number {
  if (turboPlayerHeading === 1) return 1;
  if (turboPlayerHeading === 3) return -1;
  return 0;
}

function getTurboHeadingY(): number {
  if (turboPlayerHeading === 0) return -1;
  if (turboPlayerHeading === 2) return 1;
  return 0;
}

function syncTurboRotationForLegacySystems() {
  turboPlayerRotation = getTurboHeadingX() * 2;
}

function getTurboBearingArrow(): string {
  if (turboPlayerHeading === 1) return ">>";
  if (turboPlayerHeading === 2) return "vv";
  if (turboPlayerHeading === 3) return "<<";
  return "^^";
}

function renderTurboObjectiveText(): string {
  const remaining = getTurboEnemiesRemaining();
  if (wave >= 3) {
    const boss = enemies.find((enemy) => enemy.isBoss);
    return boss ? `${getTurboBearingArrow()} BOSS GATE ${Math.max(0, Math.ceil(boss.hp))}HP` : `${getTurboBearingArrow()} BOSS GATE OPEN`;
  }
  const distance = Math.ceil(turboGateDistance);
  const gateText = distance <= 0 ? "GATE OPEN" : `GATE ${String(distance).padStart(4, "0")}m`;
  return `${getTurboBearingArrow()} ${getTurboHeadingName()}  ${gateText}  ${renderTurboRouteText()}  THREATS ${remaining}`;
}

function getTurboWaveQuota(waveNum = wave): number {
  if (waveNum === 1) return 16;
  if (waveNum === 2) return 22;
  return 30;
}

function getTurboEnemiesRemaining(): number {
  if (!isTurboMode()) return enemies.length;
  return Math.max(0, turboWaveQuota - turboWaveCleared);
}

function getTurboRouteLimit(): number {
  return 180 + wave * 20;
}

function getTurboRouteProgress(): number {
  if (wave >= 3 || turboGateStartDistance <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - turboGateDistance / turboGateStartDistance));
}

function renderTurboRouteText(): string {
  if (wave >= 3) return "AT GATE";
  const offset = Math.round(turboRouteX);
  if (Math.abs(offset) < 14) return "ON ROUTE";
  return `DRIFT ${offset < 0 ? "W" : "E"}${String(Math.abs(offset)).padStart(2, "0")}`;
}

function updateTurboRouteProgress() {
  if (!isTurboMode() || wave >= 3 || turboGateDistance <= 0) return;
  const heading = getTurboHeadingX();
  const headingY = getTurboHeadingY();
  const enginePush = turboEngineTicks > 0 ? 8.5 : 1.15;
  const cleanLaneBonus = Math.max(0, 1 - enemies.length / 14);
  const lift = Math.max(-1, Math.min(1, turboPlayerLift * 0.65 + playerMotionLift));
  const routeLimit = getTurboRouteLimit();
  const routePenalty = Math.min(0.7, Math.abs(turboRouteX) / routeLimit);
  const routeCorrection = Math.sign(turboRouteX) !== Math.sign(heading) && Math.abs(heading) > 0.12 ? 0.94 : 0.995;
  const lateralPush = heading * (turboEngineTicks > 0 ? 4.8 : 1.65) + turboPlayerBank * 0.7;
  const towardGate = Math.max(0, -lift) * (turboEngineTicks > 0 ? 2.4 : 1.1);
  const awayFromGate = Math.max(0, lift) * (turboEngineTicks > 0 ? 3.2 : 3);
  const headingTowardGate = Math.max(0, -headingY);
  const headingAwayFromGate = Math.max(0, headingY);
  const cruiseFactor = lift > 0 ? 0.25 : 1;
  const headingStep = enginePush * (headingTowardGate - headingAwayFromGate * 1.15);
  const forwardStep = headingStep * cruiseFactor * (1 - routePenalty) * (1 + cleanLaneBonus * 0.35) + towardGate - awayFromGate;
  const maxDistance = Math.max(turboGateStartDistance * 1.28, turboGateDistance + 40, 900);

  turboRouteX = Math.max(-routeLimit, Math.min(routeLimit, turboRouteX * routeCorrection + lateralPush));
  turboGateDistance = Math.max(0, Math.min(maxDistance, turboGateDistance - forwardStep));

  if (lift > 0.55 && tick % 80 === 0) {
    setStatus("FALLING BACK FROM GATE", 45);
  } else if (Math.abs(turboRouteX) > routeLimit * 0.72 && tick % 90 === 0) {
    setStatus("OFF ROUTE - STEER BACK", 55);
  }
}

function chooseTurboEntityKind(): TurboEntityKind {
  const roll = Math.random();
  if (wave >= 3 && turboWaveSpawned === 0) return "dreadnought";
  if (roll < 0.24) return "asteroid";
  if (roll < 0.36) return "comet";
  if (roll < 0.58) return "raider";
  if (roll < 0.78) return "rotor";
  return "mine";
}

function spawnTurboEntity(kind: TurboEntityKind = chooseTurboEntityKind()) {
  if (turboWaveSpawned >= turboWaveQuota) return;

  const variant = turboEntityVariants[kind];
  const width = variant.sprite.width;
  const height = variant.sprite.height;
  const fromLeft = Math.random() < 0.5;
  const centerX = playerX + activeShip.variant.sprite.width / 2;
  const centerY = playerY + activeShip.variant.sprite.height / 2;
  const forwardX = Math.max(
    1,
    Math.min(
      BOARD_WIDTH - width - 1,
      centerX + getTurboHeadingX() * BOARD_WIDTH * 0.22 + (Math.random() - 0.5) * BOARD_WIDTH * 0.22
    )
  );
  let x = forwardX;
  let y = -height - Math.floor(Math.random() * 5);
  let vx = (Math.random() - 0.5) * 0.18;
  let vy = 0.34 + wave * 0.05 + Math.random() * 0.16;
  let hp = 28 + wave * 8;
  let scoreValue = 180 + wave * 70;
  let damage = 14 + wave * 3;
  let shootCooldown = Math.floor(Math.random() * 70) + 55;

  if (kind === "asteroid" || kind === "comet") {
    x = fromLeft ? -width - Math.floor(Math.random() * 8) : BOARD_WIDTH + Math.floor(Math.random() * 8);
    y = Math.max(2, Math.min(BOARD_HEIGHT - height - 3, Math.floor(2 + Math.random() * (BOARD_HEIGHT - height - 5))));
    vx = (fromLeft ? 1 : -1) * (kind === "comet" ? 0.48 + Math.random() * 0.2 : 0.16 + Math.random() * 0.12);
    vy = (Math.random() - 0.5) * (kind === "comet" ? 0.12 : 0.06);
    hp = kind === "comet" ? 30 + wave * 7 : 68 + wave * 14;
    scoreValue = kind === "comet" ? 260 + wave * 90 : 160 + wave * 55;
    damage = kind === "comet" ? 18 + wave * 4 : 16 + wave * 3;
    shootCooldown = 9999;
  } else if (kind === "mine") {
    const fromBack = Math.random() < 0.12;
    x = Math.floor(Math.max(5, Math.min(BOARD_WIDTH - width - 5, forwardX)));
    y = fromBack ? BOARD_HEIGHT + height + Math.floor(Math.random() * 4) : -height - Math.floor(Math.random() * 6);
    vx = (Math.random() - 0.5) * 0.16;
    vy = (fromBack ? -1 : 1) * (0.18 + wave * 0.025);
    hp = 36 + wave * 8;
    scoreValue = 220 + wave * 60;
    damage = 28 + wave * 6;
    shootCooldown = 9999;
  } else if (kind === "dreadnought") {
    x = Math.floor((BOARD_WIDTH - width) / 2);
    y = 1;
    vx = 0.12;
    vy = 0.03;
    hp = scaleEnemyHp(420 + wave * 80);
    scoreValue = Math.round(4200 * getDifficultyMultiplier());
    damage = 34 + wave * 6;
    shootCooldown = 24;
  } else {
    const fromBack = Math.random() < 0.14;
    const fromSide = !fromBack && Math.random() < 0.24;
    if (fromSide) {
      x = fromLeft ? -width - 2 : BOARD_WIDTH + 2;
      y = Math.floor(2 + Math.random() * Math.max(1, getTurboPlayerMinY() - 2));
    } else if (fromBack) {
      x = forwardX;
      y = BOARD_HEIGHT + height + Math.floor(Math.random() * 5);
    }
    const targetDx = centerX - (x + width / 2);
    const targetDy = centerY - (y + height / 2);
    const targetDistance = Math.max(1, Math.hypot(targetDx, targetDy));
    const speed = kind === "raider" ? 0.28 + wave * 0.035 : 0.23 + wave * 0.03;
    vx = (targetDx / targetDistance) * speed;
    vy = fromBack ? Math.min(-0.16, (targetDy / targetDistance) * speed) : Math.max(0.18, (targetDy / targetDistance) * speed);
    hp = kind === "raider" ? 34 + wave * 12 : 48 + wave * 14;
    scoreValue = kind === "raider" ? 320 + wave * 100 : 420 + wave * 120;
    damage = kind === "raider" ? 14 + wave * 3 : 16 + wave * 3;
  }

  enemies.push({
    id: `turbo-${kind}-${tick}-${turboWaveSpawned}`,
    name: variant.name,
    x,
    y,
    vx,
    vy,
    width,
    height,
    hp,
    maxHp: hp,
    scoreValue,
    variant,
    shootCooldown,
    isBoss: kind === "dreadnought",
    turboKind: kind,
    rotation: Math.random() * 10,
    spin: (Math.random() > 0.5 ? 1 : -1) * (kind === "asteroid" ? 0.12 : kind === "rotor" ? 0.28 : 0.16),
    damage,
    phase: Math.floor(Math.random() * 30)
  });
  turboWaveSpawned++;
}

function startTurboWave(waveNum: number) {
  turboWaveQuota = getTurboWaveQuota(waveNum);
  turboWaveSpawned = 0;
  turboWaveCleared = 0;
  turboSpawnCooldown = 0;
  turboGateStartDistance = waveNum < 3 ? 850 + waveNum * 520 : 0;
  turboGateDistance = turboGateStartDistance;
  turboRouteX = 0;
  turboBossDestroyed = false;
  enemyBaseMoveCooldown = 0;
  setStatus(waveNum === 3 ? "BOSS GATE LOCKED" : `GATE ${waveNum} VECTOR LOCK`, 140);

  if (waveNum === 3) spawnTurboEntity("dreadnought");
  const initialCount = waveNum === 1 ? 5 : waveNum === 2 ? 7 : 8;
  for (let index = 0; index < initialCount; index++) {
    spawnTurboEntity();
  }
}

// Generate Wave
function startWave(waveNum: number) {
  enemies = [];
  bullets = [];
  particles = [];
  collectibles = [];
  enemyDirection = 1;
  enemyStepCount = 0;
  if (isTurboMode()) {
    startTurboWave(waveNum);
    return;
  }
  setStatus(waveNum === 3 ? "BOSS WARNING" : `WAVE ${waveNum}`, 120);

  if (waveNum === 1) {
    const columns = isTurboMode() ? 8 : 6;
    const rows = isTurboMode() ? 4 : 3;
    const spawnWidth = columns * 8;
    const startX = Math.floor((BOARD_WIDTH - spawnWidth) / 2);
    
    const variants = [
      { type: "enemy-spore-pod-l1", hp: 30, score: 80 },
      { type: "enemy-tick-drone-l1", hp: 18, score: 120 },
      { type: "enemy-mite-grunt-l1", hp: 24, score: 100 }
    ];

    for (let r = 0; r < rows; r++) {
      const spec = variants[r % variants.length]!;
      const variantAsset = enemySpecies.variants.find(v => v.id === spec.type) || enemySpecies.variants[0]!;
      
      for (let c = 0; c < columns; c++) {
        enemies.push({
          id: `${spec.type}-${r}-${c}`,
          name: variantAsset.name,
          x: startX + c * 8,
          y: 1 + r * 3,
          width: variantAsset.sprite.width,
          height: variantAsset.sprite.height,
          hp: spec.hp,
          maxHp: spec.hp,
          scoreValue: spec.score,
          variant: variantAsset,
          shootCooldown: Math.floor(Math.random() * 100) + 50
        });
      }
    }
    enemyBaseMoveCooldown = isTurboMode() ? 16 : 22;
  } else if (waveNum === 2) {
    const columns = isTurboMode() ? 7 : 5;
    const rows = isTurboMode() ? 4 : 3;
    const spawnWidth = columns * 10;
    const startX = Math.floor((BOARD_WIDTH - spawnWidth) / 2);
    
    const variants = [
      { type: "enemy-warden-sentinel-l2", hp: 55, score: 300 },
      { type: "enemy-stinger-elite-l2", hp: 42, score: 280 },
      { type: "enemy-mite-hunter-l2", hp: 48, score: 250 }
    ];

    for (let r = 0; r < rows; r++) {
      const spec = variants[r % variants.length]!;
      const variantAsset = enemySpecies.variants.find(v => v.id === spec.type) || enemySpecies.variants[0]!;
      
      for (let c = 0; c < columns; c++) {
        enemies.push({
          id: `${spec.type}-${r}-${c}`,
          name: variantAsset.name,
          x: startX + c * 10 + 2,
          y: 1 + r * 3,
          width: variantAsset.sprite.width,
          height: variantAsset.sprite.height,
          hp: spec.hp,
          maxHp: spec.hp,
          scoreValue: spec.score,
          variant: variantAsset,
          shootCooldown: Math.floor(Math.random() * 80) + 30
        });
      }
    }
    enemyBaseMoveCooldown = isTurboMode() ? 13 : 18;
  } else {
    // Wave 3: BOSS WAVE
    const bossConfigs = [
      { id: "enemy-mite-monarch-l3", label: "Mite Monarch", hp: 220, score: 2200, pattern: "monarch" as const },
      { id: "enemy-behemoth-titan-l3", label: "Behemoth Titan", hp: 260, score: 2600, pattern: "titan" as const },
      { id: "enemy-leviathan-core-l3", label: "Leviathan Core", hp: 210, score: 3000, pattern: "leviathan" as const }
    ];
    const bossConfig = bossConfigs[Math.floor(Math.random() * bossConfigs.length)]!;
    const bossAsset = enemySpecies.variants.find(v => v.id === bossConfig.id) || enemySpecies.variants[6]!;
    
    enemies.push({
      id: `boss-${bossConfig.pattern}`,
      name: `${bossConfig.label} (BOSS)`,
      x: Math.floor((BOARD_WIDTH - 6) / 2),
      y: 2,
      width: bossAsset.sprite.width,
      height: bossAsset.sprite.height,
      hp: bossConfig.hp,
      maxHp: bossConfig.hp,
      scoreValue: bossConfig.score,
      variant: bossAsset,
      shootCooldown: 20,
      isBoss: true,
      bossPattern: bossConfig.pattern
    });
    setStatus(`${bossConfig.label.toUpperCase()} APPROACHES`, 180);

    const hunterAsset = enemySpecies.variants.find(v => v.id === "enemy-mite-hunter-l2") || enemySpecies.variants[3]!;
    const escorts = [
      { x: 10, y: 3 },
      { x: 22, y: 5 },
      { x: BOARD_WIDTH - 26, y: 5 },
      { x: BOARD_WIDTH - 14, y: 3 }
    ];
    if (isTurboMode()) {
      escorts.push(
        { x: 34, y: 7 },
        { x: BOARD_WIDTH - 38, y: 7 }
      );
    }

    escorts.forEach((esc, idx) => {
      enemies.push({
        id: `escort-hunter-${idx}`,
        name: hunterAsset.name,
        x: esc.x,
        y: esc.y,
        width: hunterAsset.sprite.width,
        height: hunterAsset.sprite.height,
        hp: 48,
        maxHp: 48,
        scoreValue: 250,
        variant: hunterAsset,
        shootCooldown: Math.floor(Math.random() * 60) + 40
      });
    });
    enemyBaseMoveCooldown = isTurboMode() ? 10 : 15;
  }

  applyCampaignDifficultyToWave();
}

function createComWingmate(ship: PlayerShip): ComWingmate {
  const leveledShip = buildLeveledShip(ship, playerLevel);
  const playerWidth = activeShip.variant.sprite.width;
  const comWidth = leveledShip.variant.sprite.width;
  const rightSideX = playerX + playerWidth + 10;
  const leftSideX = playerX - comWidth - 10;
  const preferredX = rightSideX + comWidth < BOARD_WIDTH - 1 ? rightSideX : leftSideX;

  return {
    ship: leveledShip,
    x: clampShipX(preferredX, comWidth),
    hp: leveledShip.hp,
    maxHp: leveledShip.hp,
    shield: 0,
    maxShield: leveledShip.shield,
    shootCooldown: Math.max(8, Math.floor(leveledShip.cooldown * 1.5)),
    shieldPowerTicks: 0,
    level: playerLevel,
    destroyed: false
  };
}

// Start Game with Selected Ship
function startGame(ship: PlayerShip, options: StartGameOptions = {}) {
  applyGameModeDimensions();
  activeShip = { ...ship };
  if (options.advanceDifficulty) campaignLoop++;
  if (!options.preserveScore) {
    score = 0;
    campaignLoop = 1;
  }
  wave = 1;
  playerLevel = 1;
  upgradePoints = 0;
  shieldPowerTicks = 0;
  cloakPowerTicks = 0;
  turboSpecialCharge = isTurboMode() ? TURBO_SPECIAL_MAX_CHARGE : 0;
  playerShield = 0;
  comWingmate = null;
  applyShipLevel(false);
  activeComShip = options.comShip ? { ...options.comShip } : null;
  if (activeComShip) {
    const pairWidth = activeShip.variant.sprite.width + activeComShip.variant.sprite.width + 12;
    playerX = Math.floor((BOARD_WIDTH - pairWidth) / 2);
  } else {
    playerX = Math.floor(BOARD_WIDTH / 2) - Math.floor(activeShip.variant.sprite.width / 2);
  }
  playerX = clampShipX(playerX, activeShip.variant.sprite.width);
  playerY = clampShipY(getPlayerHomeY(activeShip.variant.sprite.height), activeShip.variant.sprite.height);
  comWingmate = activeComShip ? createComWingmate(activeComShip) : null;
  playerShootCooldown = 0;
  shotsFired = 0;
  shotsHit = 0;
  enemiesDestroyed = 0;
  collectibleId = 0;
  turboSpecialEffects = [];
  turboWaveQuota = 0;
  turboWaveSpawned = 0;
  turboWaveCleared = 0;
  turboSpawnCooldown = 0;
  turboPlayerBank = 0;
  turboPlayerLift = 0;
  playerMotionBank = 0;
  playerMotionLift = 0;
  playerMotionTicks = 0;
  turboPlayerRotation = 0;
  turboPlayerHeading = 0;
  turboEngineTicks = 0;
  turboGateDistance = 0;
  turboGateStartDistance = 0;
  turboRouteX = 0;
  turboBossDestroyed = false;
  enemyStepCount = 0;
  gameOverReason = "SHIP DESTROYED";
  setStatus(
    isTurboMode()
      ? `${campaignLoop > 1 ? `LOOP ${campaignLoop} ` : ""}TURBO DRIVE ARMED`
      : campaignLoop > 1
      ? `LOOP ${campaignLoop} THREAT LEVEL ${Math.round(getDifficultyMultiplier() * 100)}%`
      : activeComShip
        ? "PLAYER-01 + COM-02 READY"
        : "PLAYER-01 READY",
    140
  );
  
  initStars();
  startWave(wave);
  screen = "playing";
}

function getAnimatedFrame(variant: any, currentTick: number): SpriteFrame {
  const animated = variant as any;
  const frames = animated.idle && animated.idle.length > 0 ? animated.idle : [variant.sprite];
  if (variant.id && variant.id.startsWith("enemy-")) {
    if (!isTurboMode()) {
      return frames[enemyStepCount % frames.length] || variant.sprite;
    }
  }
  return frames[Math.floor(currentTick / 6) % frames.length] || variant.sprite;
}

function drawFrame(grid: Cell[][], x: number, y: number, frame: SpriteFrame, tone: Tone, boldSprite = true) {
  const color = toneColors[tone] || theme.text;

  for (let r = 0; r < frame.height; r++) {
    const targetY = Math.floor(y + r);
    if (targetY < 0 || targetY >= grid.length) continue;
    const line = frame.lines[r] || "";
    const chars = line.split("");
    for (let c = 0; c < chars.length; c++) {
      const targetX = Math.floor(x + c);
      if (targetX < 0 || targetX >= BOARD_WIDTH) continue;
      const char = chars[c] || " ";
      if (char !== " " && char !== "⠀") {
        const row = grid[targetY];
        if (row) {
          row[targetX] = { char, color, bold: boldSprite };
        }
      }
    }
  }
}

// Helper to draw sprites inside the grid
function drawSprite(grid: Cell[][], x: number, y: number, variant: any, currentTick: number) {
  const frame = getAnimatedFrame(variant, currentTick);
  drawFrame(grid, x, y, frame, variant.tone as Tone);
}

function shiftFrameLine(line: string, width: number, offset: number): string {
  const chars = Array.from(line);
  while (chars.length < width) chars.push(" ");
  const normalized = chars.slice(0, width).join("");
  if (offset > 0) return `${" ".repeat(offset)}${normalized}`.slice(0, width);
  if (offset < 0) return `${normalized.slice(Math.abs(offset))}${" ".repeat(Math.abs(offset))}`.slice(0, width);
  return normalized;
}

function putFrameChar(lines: string[][], x: number, y: number, char: string) {
  const row = lines[y];
  if (!row || x < 0 || x >= row.length) return;
  row[x] = char;
}

function getPlayerBankStep(): -2 | -1 | 0 | 1 | 2 {
  const combined = isTurboMode()
    ? getTurboHeadingX() * 1.05 + turboPlayerBank * 0.25 + playerMotionBank * 0.55
    : playerMotionBank;
  if (combined <= -1.05) return -2;
  if (combined < -0.18) return -1;
  if (combined >= 1.05) return 2;
  if (combined > 0.18) return 1;
  return 0;
}

function getPlayerLiftStep(): -1 | 0 | 1 {
  const combined = isTurboMode()
    ? getTurboHeadingY() * 0.75 + turboPlayerLift * 0.35 + playerMotionLift * 0.55 - (turboEngineTicks > 0 ? 0.35 : 0)
    : playerMotionLift;
  if (combined < -0.2) return -1;
  if (combined > 0.2) return 1;
  return 0;
}

function buildPlayerMotionFrame(frame: SpriteFrame, bank: -2 | -1 | 0 | 1 | 2, lift: -1 | 0 | 1, thrust: boolean, currentTick: number): SpriteFrame {
  const direction = Math.sign(bank);
  const strong = Math.abs(bank) === 2;
  const lines = frame.lines.map((line) => Array.from(shiftFrameLine(line, frame.width, 0)));
  const centerX = Math.floor(frame.width / 2);
  const wingY = Math.max(0, Math.min(frame.height - 1, frame.height >= 4 ? frame.height - 2 : Math.floor(frame.height / 2)));
  const tailY = frame.height - 1;
  const phase = Math.floor(currentTick / 4) % 2;

  if (direction < 0) {
    putFrameChar(lines, Math.max(0, centerX - (strong ? 1 : 0)), 0, strong ? "\\" : "/");
    putFrameChar(lines, 0, wingY, "\\");
    putFrameChar(lines, frame.width - 1, Math.min(frame.height - 1, wingY + (strong ? 1 : 0)), "|");
    putFrameChar(lines, Math.min(frame.width - 1, centerX + 1), tailY, strong ? "/" : "v");
  } else if (direction > 0) {
    putFrameChar(lines, Math.min(frame.width - 1, centerX + (strong ? 1 : 0)), 0, strong ? "/" : "\\");
    putFrameChar(lines, frame.width - 1, wingY, "/");
    putFrameChar(lines, 0, Math.min(frame.height - 1, wingY + (strong ? 1 : 0)), "|");
    putFrameChar(lines, Math.max(0, centerX - 1), tailY, strong ? "\\" : "v");
  } else if (lift < 0) {
    putFrameChar(lines, centerX, 0, "^");
  }

  if (lift < 0) {
    putFrameChar(lines, centerX, tailY, thrust ? (phase === 0 ? "W" : "V") : "v");
  } else if (lift > 0) {
    putFrameChar(lines, centerX, tailY, "_");
  } else if (thrust) {
    putFrameChar(lines, centerX, tailY, phase === 0 ? "V" : "W");
  }

  return {
    ...frame,
    lines: lines.map((line) => line.join(""))
  };
}

// Spawns particle explosion
function spawnExplosion(x: number, y: number, color: Rgb, count = 8) {
  const chars = ["+", "*", "·", "°", "x", "o"];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.8 + 0.2;
    const life = Math.floor(Math.random() * 8) + 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.5,
      char: chars[Math.floor(Math.random() * chars.length)]!,
      color,
      life,
      maxLife: life
    });
  }
}

function chargeTurboSpecial(value: number) {
  if (!isTurboMode()) return;
  turboSpecialCharge = Math.min(TURBO_SPECIAL_MAX_CHARGE, turboSpecialCharge + value);
}

function getTurboSpecialName(): string {
  if (activeShip.classId === "delta") return "ION NUKE";
  if (activeShip.classId === "ring") return "VOID LASER";
  if (activeShip.classId === "wedge") return "SUNBREAKER";
  return "NOVA LANCE";
}

function getTurboSpecialColor(): Rgb {
  if (activeShip.classId === "delta") return theme.blue;
  if (activeShip.classId === "ring") return theme.purple;
  if (activeShip.classId === "wedge") return theme.amber;
  return theme.white;
}

function getTurboSpecialTarget(muzzleX: number): { x: number; y: number } {
  if (enemies.length === 0) return { x: muzzleX, y: Math.max(2, playerY - 12) };

  const target = enemies.reduce((best, enemy) => {
    const enemyCenterX = enemy.x + enemy.width / 2;
    const bestCenterX = best.x + best.width / 2;
    const enemyScore = Math.abs(enemyCenterX - muzzleX) - enemy.y * 0.4 - (enemy.isBoss ? 8 : 0);
    const bestScore = Math.abs(bestCenterX - muzzleX) - best.y * 0.4 - (best.isBoss ? 8 : 0);
    return enemyScore < bestScore ? enemy : best;
  });

  return {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2
  };
}

function damageEnemiesWithTurboSpecial(muzzleX: number, blastX: number, blastY: number, radius: number) {
  const baseDamage = 90 + playerLevel * 35 + (activeShip.variant.stats?.projectileDamage ?? 10) * 3;
  let enemiesHit = 0;

  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    if (!enemy) continue;

    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    const beamDistance = Math.abs(centerX - muzzleX);
    const blastDistance = Math.hypot(centerX - blastX, (centerY - blastY) * 1.45);
    const inBeam = beamDistance <= Math.max(2.5, enemy.width / 2 + 1);
    const inBlast = blastDistance <= radius;
    if (!inBeam && !inBlast) continue;

    const beamDamage = inBeam ? baseDamage * 1.15 : 0;
    const blastFalloff = inBlast ? Math.max(0.35, 1 - blastDistance / Math.max(1, radius)) : 0;
    const blastDamage = inBlast ? baseDamage * blastFalloff : 0;
    const damage = Math.max(beamDamage, blastDamage);
    enemy.hp -= damage;
    enemiesHit++;

    const enemyColor = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
    spawnExplosion(centerX, centerY, enemyColor, enemy.isBoss ? 18 : 10);

    if (enemy.hp <= 0) {
      enemies.splice(index, 1);
      score += enemy.scoreValue;
      enemiesDestroyed++;
      chargeTurboSpecial(enemy.isBoss ? 35 : 12);
      spawnExplosion(centerX, centerY, enemyColor, enemy.isBoss ? 32 : 16);
    }
  }

  if (enemiesHit > 0) shotsHit++;
}

function fireTurboSpecial() {
  if (!isTurboMode()) {
    setStatus("SPECIALS REQUIRE TURBO", 70);
    return;
  }

  if (turboSpecialCharge < TURBO_SPECIAL_MAX_CHARGE) {
    setStatus(`SPECIAL CHARGING ${Math.floor(turboSpecialCharge)}%`, 55);
    return;
  }

  const shipWidth = activeShip.variant.sprite.width;
  const muzzleX = getSpriteMuzzleX(playerX, shipWidth);
  const target = getTurboSpecialTarget(muzzleX);
  const color = getTurboSpecialColor();
  const radius = isTurboMode() ? 9 : 10;

  turboSpecialCharge = 0;
  shotsFired++;
  shakeIntensity = Math.max(shakeIntensity, 10);
  flashTicks = 8;
  setStatus(`${getTurboSpecialName()} FIRED`, 130);
  turboSpecialEffects.push(
    { kind: "laser", x: muzzleX, y: playerY, radius: 2, color, life: 9, maxLife: 9 },
    { kind: "blast", x: target.x, y: target.y, radius, color, life: 16, maxLife: 16 }
  );

  const beforeBulletCount = bullets.length;
  bullets = bullets.filter((bullet) => {
    if (!bullet.isEnemy) return true;
    const beamDistance = Math.abs(bullet.x - muzzleX);
    const blastDistance = Math.hypot(bullet.x - target.x, (bullet.y - target.y) * 1.3);
    return beamDistance > 4 && blastDistance > radius;
  });
  if (beforeBulletCount !== bullets.length) {
    spawnExplosion(muzzleX, Math.max(2, playerY - 5), theme.cyan, Math.min(28, beforeBulletCount - bullets.length + 8));
  }

  damageEnemiesWithTurboSpecial(muzzleX, target.x, target.y, radius);
  spawnExplosion(target.x, target.y, color, 24);
}

function getSpriteMuzzleX(spriteLeft: number, spriteWidth: number): number {
  return Math.floor(spriteLeft) + Math.floor((spriteWidth - 1) / 2);
}

function getTurboAimOffset(): number {
  if (!isTurboMode()) return 0;
  return Math.max(-0.42, Math.min(0.42, getTurboHeadingX() * 0.32));
}

function fireFriendlyShip(ship: PlayerShip, level: number, shipX: number, shipY: number, damageMultiplier = 1, aimOffset = 0): number {
  const bulletCountBefore = bullets.length;
  const shipWidth = ship.variant.sprite.width;
  const muzzleX = getSpriteMuzzleX(shipX, shipWidth);
  const leftMuzzleX = Math.max(Math.floor(shipX), muzzleX - 1);
  const rightMuzzleX = Math.min(Math.floor(shipX) + shipWidth - 1, muzzleX + 1);
  const pairedMuzzleX = Math.min(Math.floor(shipX) + shipWidth - 1, muzzleX + 1);
  const baseDamage = (ship.variant.stats?.projectileDamage ?? 10) * damageMultiplier;
  const fire = (x: number, y: number, vx: number, vy: number, char: string, color: Rgb, damage = baseDamage) => {
    bullets.push({ x, y, vx: vx + aimOffset, vy, color, char, isEnemy: false, damage });
  };

  if (ship.classId === "bar") {
    if (level === 1) {
      fire(muzzleX, shipY - 1, 0, -1.05, "║", theme.cyan);
    } else if (level === 2) {
      fire(muzzleX, shipY - 1, 0, -1.1, "║", theme.cyan, baseDamage * 0.9);
      fire(pairedMuzzleX, shipY - 1, 0, -1.1, "║", theme.cyan, baseDamage * 0.9);
    } else {
      fire(leftMuzzleX, shipY - 1, -0.1, -1.15, "║", theme.cyan, baseDamage * 0.8);
      fire(muzzleX, shipY - 1, 0, -1.25, "┃", theme.white, baseDamage);
      fire(pairedMuzzleX, shipY - 1, 0, -1.25, "┃", theme.white, baseDamage);
      fire(rightMuzzleX, shipY - 1, 0.1, -1.15, "║", theme.cyan, baseDamage * 0.8);
    }
  } else if (ship.classId === "delta") {
    fire(muzzleX, shipY - 1, 0, -1.35, "┿", theme.blue, baseDamage);
    if (level >= 2) {
      fire(leftMuzzleX, shipY - 1, -0.15, -1.15, "╱", theme.blue, baseDamage * 0.65);
      fire(rightMuzzleX, shipY - 1, 0.15, -1.15, "╲", theme.blue, baseDamage * 0.65);
    }
    if (level >= 3) {
      fire(muzzleX - 1, shipY - 1, -0.25, -1.25, "⟋", theme.white, baseDamage * 0.6);
      fire(muzzleX + 1, shipY - 1, 0.25, -1.25, "⟍", theme.white, baseDamage * 0.6);
    }
  } else if (ship.classId === "ring") {
    fire(muzzleX, shipY - 1, 0, level >= 3 ? -0.8 : -0.7, "❂", theme.purple, baseDamage * 1.25);
    if (level >= 2) {
      fire(leftMuzzleX, shipY - 1, -0.2, -0.85, "°", theme.purple, baseDamage * 0.45);
      fire(rightMuzzleX, shipY - 1, 0.2, -0.85, "°", theme.purple, baseDamage * 0.45);
    }
    if (level >= 3) {
      fire(muzzleX, shipY - 2, 0, -0.55, "●", theme.white, baseDamage * 0.9);
    }
  } else {
    fire(muzzleX, shipY - 1, 0, -1, "▲", theme.amber, baseDamage);
    if (level >= 2) {
      fire(leftMuzzleX, shipY - 1, -0.35, -0.9, "◤", theme.amber, baseDamage * 0.65);
      fire(rightMuzzleX, shipY - 1, 0.35, -0.9, "◥", theme.amber, baseDamage * 0.65);
    }
    if (level >= 3) {
      fire(leftMuzzleX, shipY - 1, -0.15, -1, "▴", theme.white, baseDamage * 0.7);
      fire(rightMuzzleX, shipY - 1, 0.15, -1, "▴", theme.white, baseDamage * 0.7);
    }
  }

  if (isTurboMode()) {
    fire(muzzleX, shipY - 2, 0, -1.35, "·", theme.white, baseDamage * 0.18);
  }

  return bullets.length - bulletCountBefore;
}

// Player shoot
function playerShoot() {
  if (playerShootCooldown > 0) return;
  playerShootCooldown = isTurboMode() ? Math.max(2, activeShip.cooldown - 2) : activeShip.cooldown;
  shotsFired += fireFriendlyShip(activeShip, playerLevel, playerX, playerY, 1, getTurboAimOffset());
  if (isTurboMode()) shakeIntensity = Math.max(shakeIntensity, 1.2);
}

function comShoot() {
  if (!comWingmate || comWingmate.destroyed || comWingmate.shootCooldown > 0) return;
  comWingmate.shootCooldown = Math.max(7, Math.floor(comWingmate.ship.cooldown * 1.45));
  shotsFired += fireFriendlyShip(comWingmate.ship, comWingmate.level, comWingmate.x, playerY, 0.72);
}

function spawnCollectible(kind: CollectibleKind) {
  const bonusColors = [theme.amber, theme.cyan, theme.purple, theme.lime];
  const color = kind === "star"
    ? theme.white
    : kind === "shield"
      ? theme.blue
      : kind === "cloak"
        ? theme.purple
        : kind === "cache"
          ? theme.lime
          : bonusColors[Math.floor(Math.random() * bonusColors.length)]!;
  const margin = kind === "star" ? 2 : 3;

  collectibles.push({
    id: collectibleId++,
    kind,
    x: margin + Math.floor(Math.random() * Math.max(1, BOARD_WIDTH - margin * 2)),
    y: 0,
    vy: kind === "bonus" ? 0.28 : kind === "cloak" || kind === "cache" ? 0.2 : 0.22,
    char: kind === "star" ? "*" : kind === "shield" ? "◆" : kind === "cloak" ? "◌" : kind === "cache" ? "◈" : "✦",
    color,
    value: kind === "star" ? 25 : kind === "bonus" ? 150 : kind === "cache" ? 320 : 0
  });
}

function maybeSpawnCollectible() {
  if (tick % (isTurboMode() ? 26 : 42) === 0) spawnCollectible("star");
  if (tick % (isTurboMode() ? 150 : 240) === 0) spawnCollectible("bonus");
  if (tick % (isTurboMode() ? 300 : 420) === 0) spawnCollectible("shield");
  if (tick % (isTurboMode() ? 460 : 620) === 0) spawnCollectible("cloak");
  if (isTurboMode() && tick % 560 === 0) spawnCollectible("cache");
}

function collectPickup(pickup: Collectible, collector: PlayerSelectionSlot = "p1") {
  if (pickup.kind === "shield") {
    if (collector === "com") activateComShield();
    else activateShield();
    score += 500;
    return;
  }
  if (pickup.kind === "cloak") {
    if (collector === "p1") activateCloak();
    score += 650;
    return;
  }
  if (pickup.kind === "cache") {
    score += pickup.value * 14;
    addUpgradePoints(pickup.value);
    if (isTurboMode() && wave < 3) {
      turboGateDistance = Math.max(0, turboGateDistance - 90);
      turboRouteX *= 0.72;
    }
    setStatus(`${collector === "com" ? "COM " : ""}LOOT CACHE +${pickup.value}`, 100);
    spawnExplosion(pickup.x, pickup.y, pickup.color, 22);
    return;
  }

  score += pickup.value * (pickup.kind === "bonus" ? 12 : 8);
  addUpgradePoints(pickup.value);
  const collectorLabel = collector === "com" ? "COM " : "";
  setStatus(pickup.kind === "bonus" ? `${collectorLabel}BONUS STAR +${pickup.value}` : `${collectorLabel}STAR +${pickup.value}`, 70);
  spawnExplosion(pickup.x, pickup.y, pickup.color, pickup.kind === "bonus" ? 16 : 8);
}

function pickupOverlapsShip(pickup: Collectible, shipX: number, shipY: number, shipWidth: number, shipHeight: number): boolean {
  const cX = Math.floor(pickup.x);
  const cY = Math.floor(pickup.y);
  const pickupRadius = pickup.kind === "star" ? 0 : 1;

  return (
    cX + pickupRadius >= shipX - 1 &&
    cX - pickupRadius < shipX + shipWidth + 1 &&
    cY + pickupRadius >= shipY - 1 &&
    cY - pickupRadius < shipY + shipHeight + 1
  );
}

function updateCollectibles() {
  maybeSpawnCollectible();
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;

  collectibles.forEach((pickup) => {
    pickup.y += pickup.vy;
  });

  const remaining: Collectible[] = [];
  for (const pickup of collectibles) {
    const pickupRadius = pickup.kind === "star" ? 0 : 1;
    const isCollected = pickupOverlapsShip(pickup, playerX, playerY, pWidth, pHeight);
    const isComCollected = !!comWingmate && !comWingmate.destroyed && pickupOverlapsShip(
      pickup,
      comWingmate.x,
      playerY,
      comWingmate.ship.variant.sprite.width,
      comWingmate.ship.variant.sprite.height
    );

    if (isCollected) {
      collectPickup(pickup);
    } else if (isComCollected) {
      collectPickup(pickup, "com");
    } else if (pickup.y - pickupRadius < BOARD_HEIGHT) {
      remaining.push(pickup);
    }
  }
  collectibles = remaining;
}

function getClosestFriendlyCenterX(fromX: number): number {
  const targets = cloakPowerTicks > 0
    ? [Math.floor(BOARD_WIDTH / 2) + Math.sin(tick / 13) * BOARD_WIDTH * 0.25]
    : [playerX + activeShip.variant.sprite.width / 2];

  if (comWingmate && !comWingmate.destroyed) {
    targets.push(comWingmate.x + comWingmate.ship.variant.sprite.width / 2);
  }

  return targets.reduce((closest, candidate) =>
    Math.abs(candidate - fromX) < Math.abs(closest - fromX) ? candidate : closest
  );
}

function fireEnemy(enemy: Enemy) {
  const eColor = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
  const centerX = enemy.x + Math.floor(enemy.width / 2);
  const fromY = enemy.y + enemy.height;
  const pushEnemyBullet = (x: number, y: number, vx: number, vy: number, char: string, damage: number, color = eColor) => {
    bullets.push({ x, y, vx, vy, color, char, isEnemy: true, damage: scaleEnemyDamage(damage) });
  };

  if (!enemy.isBoss) {
    pushEnemyBullet(centerX, fromY, 0, 0.5, "v", 10);
    return;
  }

  if (enemy.bossPattern === "monarch") {
    pushEnemyBullet(centerX, fromY, 0, 0.65, "█", 16);
    pushEnemyBullet(enemy.x, fromY, -0.25, 0.55, "v", 12);
    pushEnemyBullet(enemy.x + enemy.width - 1, fromY, 0.25, 0.55, "v", 12);

    const escortCount = enemies.filter((candidate) => !candidate.isBoss).length;
    if (escortCount < 4 && Math.random() < 0.35) {
      const hunterAsset = enemySpecies.variants.find(v => v.id === "enemy-mite-hunter-l2") || enemySpecies.variants[3]!;
      enemies.push({
        id: `royal-guard-${tick}-${escortCount}`,
        name: "Royal Guard",
        x: Math.max(2, Math.min(BOARD_WIDTH - hunterAsset.sprite.width - 2, enemy.x + Math.floor(Math.random() * 13) - 6)),
        y: enemy.y + enemy.height + 1,
        width: hunterAsset.sprite.width,
        height: hunterAsset.sprite.height,
        hp: scaleEnemyHp(36),
        maxHp: scaleEnemyHp(36),
        scoreValue: Math.round(300 * getDifficultyMultiplier()),
        variant: hunterAsset,
        shootCooldown: scaleEnemyCooldown(55)
      });
      setStatus("ROYAL GUARD DEPLOYED", 80);
    }
    return;
  }

  if (enemy.bossPattern === "titan") {
    pushEnemyBullet(centerX, fromY, 0, 0.8, "█", 22, theme.red);
    pushEnemyBullet(centerX - 2, fromY, 0, 0.65, "▌", 16, theme.red);
    pushEnemyBullet(centerX + 2, fromY, 0, 0.65, "▐", 16, theme.red);
    enemy.y = Math.min(enemy.y + 0.35, 6);
    setStatus("TITAN RAM", 55);
    return;
  }

  const playerCenter = getClosestFriendlyCenterX(centerX);
  const aim = Math.max(-0.45, Math.min(0.45, (playerCenter - centerX) / 20));
  pushEnemyBullet(centerX, fromY, aim, 0.72, "◆", 18, theme.purple);
  pushEnemyBullet(enemy.x, fromY, -0.2, 0.5, "·", 10, theme.purple);
  pushEnemyBullet(enemy.x + enemy.width - 1, fromY, 0.2, 0.5, "·", 10, theme.purple);
  setStatus("LEVIATHAN LOCK", 55);
}

function getComTargetEnemy(): Enemy | null {
  if (!comWingmate || enemies.length === 0) return null;
  const comCenter = comWingmate.x + comWingmate.ship.variant.sprite.width / 2;
  return enemies.reduce((best, enemy) => {
    const enemyCenter = enemy.x + enemy.width / 2;
    const bestCenter = best.x + best.width / 2;
    const enemyScore = Math.abs(enemyCenter - comCenter) - enemy.y * 0.25;
    const bestScore = Math.abs(bestCenter - comCenter) - best.y * 0.25;
    return enemyScore < bestScore ? enemy : best;
  });
}

function getIncomingThreatForCom(): Bullet | null {
  if (!comWingmate) return null;
  const comCenter = comWingmate.x + comWingmate.ship.variant.sprite.width / 2;
  const comY = playerY;
  let closest: Bullet | null = null;

  for (const bullet of bullets) {
    if (!bullet.isEnemy || bullet.vy <= 0 || bullet.y < comY - 9) continue;
    if (Math.abs(bullet.x - comCenter) > 4) continue;
    if (!closest || bullet.y > closest.y) closest = bullet;
  }

  return closest;
}

function updateComWingmate() {
  if (!comWingmate || comWingmate.destroyed) return;

  if (comWingmate.level !== playerLevel) syncComWingmateLevel();
  if (comWingmate.shootCooldown > 0) comWingmate.shootCooldown--;
  if (comWingmate.shieldPowerTicks > 0) {
    comWingmate.shieldPowerTicks--;
    if (comWingmate.shieldPowerTicks === 0) {
      comWingmate.shield = 0;
      setStatus("COM SHIELD DOWN", 70);
    }
  }

  const comWidth = comWingmate.ship.variant.sprite.width;
  const comCenter = comWingmate.x + comWidth / 2;
  const targetEnemy = getComTargetEnemy();
  const incomingThreat = getIncomingThreatForCom();
  let targetX = comWingmate.x;

  if (incomingThreat) {
    const dodgeDirection = incomingThreat.x < comCenter ? 1 : -1;
    targetX = comWingmate.x + dodgeDirection * 10;
  } else if (targetEnemy) {
    targetX = targetEnemy.x + targetEnemy.width / 2 - comWidth / 2;
  }

  const playerCenter = playerX + activeShip.variant.sprite.width / 2;
  if (Math.abs(comCenter - playerCenter) < 6) {
    targetX += comCenter < playerCenter ? -5 : 5;
  }

  const delta = targetX - comWingmate.x;
  if (Math.abs(delta) > 0.35) {
    const direction = delta > 0 ? 1 : -1;
    const step = Math.min(Math.abs(delta), Math.max(0.6, comWingmate.ship.speed * 0.55));
    comWingmate.x = clampShipX(comWingmate.x + direction * step, comWidth);
  }

  if (!targetEnemy || incomingThreat) return;

  const updatedCenter = comWingmate.x + comWidth / 2;
  const enemyCenter = targetEnemy.x + targetEnemy.width / 2;
  const firingWindow = Math.max(4, targetEnemy.width / 2 + 2);
  if (Math.abs(updatedCenter - enemyCenter) <= firingWindow) {
    comShoot();
  }
}

function rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function applyPlayerDamage(damage: number, x: number, y: number, reason = "SHIP DESTROYED") {
  shakeIntensity = Math.max(shakeIntensity, isTurboMode() ? 2.5 : 4);
  flashTicks = 3;
  spawnExplosion(x, y, theme.red, isTurboMode() ? 14 : 10);

  if (playerShield > 0) {
    playerShield -= damage;
    if (playerShield <= 0) {
      playerHp += playerShield;
      playerShield = 0;
      shieldPowerTicks = 0;
      setStatus("SHIELD BROKEN", 80);
    }
  } else {
    playerHp -= damage;
  }

  if (playerHp <= 0) {
    playerHp = 0;
    screen = "gameover";
    gameOverReason = reason;
    if (score > highScore) highScore = score;
    spawnExplosion(
      playerX + activeShip.variant.sprite.width / 2,
      playerY + activeShip.variant.sprite.height / 2,
      theme.red,
      35
    );
  }
}

function applyComDamage(damage: number, x: number, y: number) {
  if (!comWingmate || comWingmate.destroyed) return;
  shakeIntensity = Math.max(shakeIntensity, 2);
  spawnExplosion(x, y, theme.red, 8);

  if (comWingmate.shield > 0) {
    comWingmate.shield -= damage;
    if (comWingmate.shield <= 0) {
      comWingmate.hp += comWingmate.shield;
      comWingmate.shield = 0;
      comWingmate.shieldPowerTicks = 0;
      setStatus("COM SHIELD BROKEN", 80);
    }
  } else {
    comWingmate.hp -= damage;
  }

  if (comWingmate.hp <= 0) {
    comWingmate.hp = 0;
    comWingmate.destroyed = true;
    setStatus("COM-02 DESTROYED", 120);
    spawnExplosion(
      comWingmate.x + comWingmate.ship.variant.sprite.width / 2,
      playerY + comWingmate.ship.variant.sprite.height / 2,
      theme.amber,
      28
    );
  }
}

function clearTurboEnemy(index: number, destroyed: boolean) {
  const enemy = enemies[index];
  if (!enemy) return;
  const enemyColor = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
  const centerX = enemy.x + enemy.width / 2;
  const centerY = enemy.y + enemy.height / 2;
  enemies.splice(index, 1);
  turboWaveCleared = Math.min(turboWaveQuota, turboWaveCleared + 1);
  if (enemy.isBoss) turboBossDestroyed = true;

  if (!destroyed) return;
  score += enemy.scoreValue;
  enemiesDestroyed++;
  chargeTurboSpecial(enemy.isBoss ? 35 : enemy.turboKind === "asteroid" ? 6 : 10);
  if (wave < 3) {
    const routeBonus = enemy.turboKind === "asteroid" ? 18 : enemy.turboKind === "mine" ? 26 : 42;
    turboGateDistance = Math.max(0, turboGateDistance - routeBonus);
  }
  shakeIntensity = Math.max(shakeIntensity, enemy.isBoss ? 5 : 1.4);
  spawnExplosion(centerX, centerY, enemyColor, enemy.isBoss ? 38 : enemy.turboKind === "mine" ? 22 : 12);
}

function pushTurboEnemyBullet(enemy: Enemy) {
  const centerX = enemy.x + enemy.width / 2;
  const centerY = enemy.y + enemy.height;
  const target = getTurboInterceptTarget(enemy, 9);
  const targetX = target.x;
  const targetY = target.y;
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const speed = enemy.isBoss ? 0.72 : enemy.turboKind === "rotor" ? 0.58 : 0.5;
  const color = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;

  bullets.push({
    x: centerX,
    y: centerY,
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
    color,
    char: enemy.isBoss ? "◆" : "•",
    isEnemy: true,
    damage: scaleEnemyDamage(enemy.isBoss ? 20 : 12)
  });

  if (enemy.isBoss) {
    bullets.push(
      { x: centerX - 3, y: centerY, vx: -0.16, vy: 0.58, color: theme.red, char: "v", isEnemy: true, damage: scaleEnemyDamage(14) },
      { x: centerX + 3, y: centerY, vx: 0.16, vy: 0.58, color: theme.red, char: "v", isEnemy: true, damage: scaleEnemyDamage(14) }
    );
  }
}

function getTurboInterceptTarget(enemy: Enemy, leadTicks = 14): { x: number; y: number } {
  if (cloakPowerTicks > 0) {
    return {
      x: Math.floor(BOARD_WIDTH / 2) + Math.sin((tick + (enemy.phase ?? 0)) / 12) * BOARD_WIDTH * 0.25,
      y: Math.max(2, getTurboPlayerMinY() - 3)
    };
  }

  const headingX = getTurboHeadingX();
  const engineFactor = turboEngineTicks > 0 ? 1.7 : 0.8;
  const baseX = playerX + activeShip.variant.sprite.width / 2;
  const baseY = playerY + activeShip.variant.sprite.height / 2;
  const flank = enemy.turboKind === "raider"
    ? Math.sign(Math.sin((enemy.phase ?? 0) + tick / 16)) * 6
    : enemy.turboKind === "rotor"
      ? Math.sign(Math.cos((enemy.phase ?? 0) + tick / 18)) * 9
      : 0;

  return {
    x: Math.max(2, Math.min(BOARD_WIDTH - 3, baseX + headingX * leadTicks * engineFactor + flank)),
    y: Math.max(2, Math.min(BOARD_HEIGHT - 3, baseY - (turboEngineTicks > 0 ? leadTicks * 0.38 : leadTicks * 0.12)))
  };
}

function steerTurboEnemy(enemy: Enemy) {
  enemy.rotation = (enemy.rotation ?? 0) + (enemy.spin ?? 0);

  if (enemy.turboKind === "raider" || enemy.turboKind === "rotor" || enemy.turboKind === "dreadnought") {
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;
    const target = getTurboInterceptTarget(enemy, enemy.turboKind === "raider" ? 18 : 12);
    const targetX = target.x;
    const targetY = target.y;
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const accel = enemy.turboKind === "dreadnought" ? 0.01 : enemy.turboKind === "rotor" ? 0.016 : 0.02;
    enemy.vx = (enemy.vx ?? 0) + (dx / distance) * accel;
    enemy.vy = (enemy.vy ?? 0) + (dy / distance) * accel;

    const maxSpeed = enemy.turboKind === "dreadnought" ? 0.28 : enemy.turboKind === "raider" ? 0.42 : 0.34;
    const speed = Math.max(0.01, Math.hypot(enemy.vx ?? 0, enemy.vy ?? 0));
    if (speed > maxSpeed) {
      enemy.vx = ((enemy.vx ?? 0) / speed) * maxSpeed;
      enemy.vy = ((enemy.vy ?? 0) / speed) * maxSpeed;
    }
    if (enemy.turboKind !== "dreadnought") enemy.vy = Math.max(0.16, enemy.vy ?? 0);
  }

  if (enemy.turboKind === "mine") {
    enemy.vx = (enemy.vx ?? 0) + Math.sin((tick + (enemy.phase ?? 0)) / 11) * 0.012;
  }

  if (enemy.turboKind === "dreadnought") {
    enemy.x += Math.sin((tick + (enemy.phase ?? 0)) / 18) * 0.18;
    enemy.y = Math.max(1, Math.min(7, enemy.y));
  }
}

function isTurboEnemyOffscreen(enemy: Enemy): boolean {
  const margin = enemy.turboKind === "asteroid" || enemy.turboKind === "comet" ? 12 : 6;
  if (enemy.isBoss) return false;
  return enemy.x < -enemy.width - margin ||
    enemy.x > BOARD_WIDTH + margin ||
    enemy.y > BOARD_HEIGHT + margin ||
    enemy.y < -enemy.height - margin;
}

function updateTurboSpawns() {
  if (turboWaveSpawned >= turboWaveQuota) return;
  const cap = Math.min(8 + wave * 2, Math.max(6, Math.floor((BOARD_WIDTH * BOARD_HEIGHT) / 440)));
  if (enemies.length >= cap) return;

  if (tick % Math.max(28, 54 - wave * 6) === 0) {
    spawnTurboEntity(Math.random() < 0.72 ? "asteroid" : "comet");
  }

  if (turboSpawnCooldown > 0) {
    turboSpawnCooldown--;
    return;
  }

  spawnTurboEntity();
  turboSpawnCooldown = Math.max(12, 30 - wave * 4 - campaignLoop);
}

function updateTurboEnemies() {
  updateTurboSpawns();

  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    if (!enemy) continue;
    steerTurboEnemy(enemy);
    enemy.x += enemy.vx ?? 0;
    enemy.y += enemy.vy ?? 0;

    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    } else if (enemy.turboKind === "raider" || enemy.turboKind === "rotor" || enemy.turboKind === "dreadnought") {
      pushTurboEnemyBullet(enemy);
      enemy.shootCooldown = Math.floor(Math.random() * (enemy.isBoss ? 30 : 70)) + (enemy.isBoss ? 22 : 45);
    }

    if (isTurboEnemyOffscreen(enemy)) {
      clearTurboEnemy(index, false);
    }
  }
}

function updateTurboBulletEnemyCollisions() {
  for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
    const bullet = bullets[bIdx];
    if (!bullet || bullet.isEnemy) continue;

    for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
      const enemy = enemies[eIdx];
      if (!enemy) continue;
      if (!rectsOverlap(bullet.x, bullet.y, 1, 1, enemy.x, enemy.y, enemy.width, enemy.height)) continue;

      enemy.hp -= bullet.damage;
      shotsHit++;
      bullets.splice(bIdx, 1);
      const enemyColor = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
      spawnExplosion(bullet.x, bullet.y, enemyColor, enemy.turboKind === "asteroid" ? 6 : 4);

      if (enemy.hp <= 0) clearTurboEnemy(eIdx, true);
      break;
    }
  }
}

function updateTurboEnemyFriendlyCollisions() {
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;

  for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
    const enemy = enemies[eIdx];
    if (!enemy) continue;
    const damage = enemy.damage ?? 18;
    const centerX = enemy.x + enemy.width / 2;
    const centerY = enemy.y + enemy.height / 2;

    if (rectsOverlap(enemy.x, enemy.y, enemy.width, enemy.height, playerX, playerY, pWidth, pHeight)) {
      applyPlayerDamage(damage, centerX, centerY, enemy.turboKind === "asteroid" || enemy.turboKind === "comet" ? "ASTEROID IMPACT" : "TURBO COLLISION");
      if (!enemy.isBoss) clearTurboEnemy(eIdx, false);
      continue;
    }

    if (
      comWingmate &&
      !comWingmate.destroyed &&
      rectsOverlap(
        enemy.x,
        enemy.y,
        enemy.width,
        enemy.height,
        comWingmate.x,
        playerY,
        comWingmate.ship.variant.sprite.width,
        comWingmate.ship.variant.sprite.height
      )
    ) {
      applyComDamage(damage, centerX, centerY);
      if (!enemy.isBoss) clearTurboEnemy(eIdx, false);
    }
  }
}

function updateTurboEnemyBulletFriendlyCollisions() {
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;

  for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
    const bullet = bullets[bIdx];
    if (!bullet || !bullet.isEnemy) continue;
    const hitPlayer = cloakPowerTicks <= 0 && rectsOverlap(bullet.x, bullet.y, 1, 1, playerX, playerY, pWidth, pHeight);
    const hitCom = !!comWingmate && !comWingmate.destroyed && rectsOverlap(
      bullet.x,
      bullet.y,
      1,
      1,
      comWingmate.x,
      playerY,
      comWingmate.ship.variant.sprite.width,
      comWingmate.ship.variant.sprite.height
    );

    if (hitPlayer) {
      bullets.splice(bIdx, 1);
      applyPlayerDamage(bullet.damage, bullet.x, bullet.y);
    } else if (hitCom) {
      bullets.splice(bIdx, 1);
      applyComDamage(bullet.damage, bullet.x, bullet.y);
    }
  }
}

function finishTurboWaveIfCleared() {
  if (wave < 3 && turboGateDistance <= 0) {
    wave++;
    enemies = [];
    bullets = bullets.filter((bullet) => !bullet.isEnemy);
    startWave(wave);
    score += 1400 * (wave - 1);
    playerHp = Math.min(playerMaxHp, playerHp + 18);
    setStatus(wave === 3 ? "BOSS GATE REACHED" : `GATE ${wave} VECTOR`, 130);
    return;
  }

  if (wave >= 3 && turboBossDestroyed) {
    enemies = enemies.filter((enemy) => enemy.isBoss);
    score += 6500;
    if (score > highScore) highScore = score;
    screen = "victory";
  }
}

function updateTurboGame() {
  updateTurboRouteProgress();
  updateTurboEnemies();
  updateTurboBulletEnemyCollisions();
  updateTurboEnemyFriendlyCollisions();
  updateTurboEnemyBulletFriendlyCollisions();
  finishTurboWaveIfCleared();
}

// Game physics updates
function updateGame() {
  tick++;

  if (playerShootCooldown > 0) playerShootCooldown--;
  if (flashTicks > 0) flashTicks--;
  if (statusMessageTicks > 0) statusMessageTicks--;
  if (turboEngineTicks > 0) turboEngineTicks--;
  if (isTurboMode()) chargeTurboSpecial(0.28 + playerLevel * 0.03);
  if (cloakPowerTicks > 0) {
    cloakPowerTicks--;
    if (cloakPowerTicks === 0) setStatus("CLOAK FIELD DOWN", 70);
  }
  if (shieldPowerTicks > 0) {
    shieldPowerTicks--;
    if (shieldPowerTicks === 0) {
      playerShield = 0;
      setStatus("SHIELD DOWN", 70);
    }
  }
  if (isTurboMode()) {
    const pWidth = activeShip.variant.sprite.width;
    const pHeight = activeShip.variant.sprite.height;
    const engineBoost = turboEngineTicks > 0 ? 1 : 0;
    playerX = clampShipX(playerX + getTurboHeadingX() * playerSpeed * (engineBoost ? 0.68 : 0.18), pWidth);
    if (engineBoost) playerY = clampShipY(playerY + getTurboHeadingY() * Math.max(0.45, playerSpeed * 0.32), pHeight);
  }
  updateComWingmate();
  normalizeViewportState();

  stars.forEach(star => {
    const turboForwardSpeed = isTurboMode() ? (turboEngineTicks > 0 ? 2.15 : 1.18 + Math.sin(tick / 70) * 0.18) : 1;
    const headingY = isTurboMode() ? getTurboHeadingY() : -1;
    const routeScrollY = isTurboMode()
      ? headingY < 0 ? 1 : headingY > 0 ? -1 : 0.32
      : 1;
    star.y += star.speed * turboForwardSpeed * routeScrollY;
    if (isTurboMode()) star.x -= getTurboHeadingX() * 0.07 + turboPlayerBank * 0.02;
    if (star.y >= BOARD_HEIGHT) {
      star.y = 0;
      star.x = Math.floor(Math.random() * BOARD_WIDTH);
    } else if (star.y < 0) {
      star.y = BOARD_HEIGHT - 1;
      star.x = Math.floor(Math.random() * BOARD_WIDTH);
    } else if (isTurboMode() && star.x < 0) {
      star.x = BOARD_WIDTH - 1;
    } else if (isTurboMode() && star.x >= BOARD_WIDTH) {
      star.x = 0;
    }
  });
  updateCollectibles();

  bullets.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
  });
  bullets = bullets.filter(b => b.x >= 0 && b.x < BOARD_WIDTH && b.y >= 0 && b.y < BOARD_HEIGHT);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
  turboSpecialEffects.forEach(effect => {
    effect.life--;
  });
  turboSpecialEffects = turboSpecialEffects.filter(effect => effect.life > 0);
  if (playerMotionTicks > 0) playerMotionTicks--;
  playerMotionBank *= playerMotionTicks > 0 ? 0.9 : 0.72;
  playerMotionLift *= playerMotionTicks > 0 ? 0.9 : 0.72;
  if (Math.abs(playerMotionBank) < 0.05) playerMotionBank = 0;
  if (Math.abs(playerMotionLift) < 0.05) playerMotionLift = 0;
  if (isTurboMode()) {
    turboPlayerBank *= 0.86;
    turboPlayerLift *= 0.82;
    updateTurboGame();
    return;
  }

  enemyMoveTimer++;
  const activeEnemiesCount = enemies.length;
  const startEnemiesCount = getWaveStartEnemiesCount();
  const enemyMoveCooldown = Math.max(3, Math.floor(enemyBaseMoveCooldown * (activeEnemiesCount / startEnemiesCount)));

  if (enemyMoveTimer >= enemyMoveCooldown) {
    enemyMoveTimer = 0;
    enemyStepCount++;
    
    let hitEdge = false;
    for (const enemy of enemies) {
      const nextX = enemy.x + enemyDirection;
      if (nextX < 1 || nextX + enemy.width > BOARD_WIDTH - 1) {
        hitEdge = true;
        break;
      }
    }

    if (hitEdge) {
      enemyDirection *= -1;
      for (const enemy of enemies) {
        enemy.y += 1;
      }
    } else {
      for (const enemy of enemies) {
        enemy.x += enemyDirection;
      }
    }
  }

  if (enemies.some(e => e.y + e.height >= getInvasionLineY())) {
    screen = "gameover";
    gameOverReason = "INVASION LINE BREACHED";
    if (score > highScore) highScore = score;
    spawnExplosion(playerX + 2, playerY, theme.red, 30);
    return;
  }

  enemies.forEach(enemy => {
    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    } else {
      const bossCooldown = enemy.bossPattern === "titan" ? 48 : enemy.bossPattern === "leviathan" ? 38 : 44;
      const cooldownRange = scaleEnemyCooldown(enemy.isBoss ? bossCooldown : 150);
      const cooldownFloor = scaleEnemyCooldown(enemy.isBoss ? 34 : 60);
      enemy.shootCooldown = Math.floor(Math.random() * cooldownRange) + cooldownFloor;
      fireEnemy(enemy);
    }
  });

  // Collision Bullet vs Enemy
  bullets.forEach((bullet, bIdx) => {
    if (bullet.isEnemy) return;

    enemies.forEach((enemy, eIdx) => {
      const bX = Math.floor(bullet.x);
      const bY = Math.floor(bullet.y);
      if (
        bX >= enemy.x &&
        bX < enemy.x + enemy.width &&
        bY >= enemy.y &&
        bY < enemy.y + enemy.height
      ) {
        enemy.hp -= bullet.damage;
        shotsHit++;
        bullets.splice(bIdx, 1);
        
        const enemyColor = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
        spawnExplosion(bullet.x, bullet.y, enemyColor, 4);

        if (enemy.hp <= 0) {
          enemies.splice(eIdx, 1);
          score += enemy.scoreValue;
          enemiesDestroyed++;
          chargeTurboSpecial(enemy.isBoss ? 24 : 8);
          shakeIntensity = Math.min(3, shakeIntensity + 1);
          spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemyColor, 12);
        }
      }
    });
  });

  // Collision Bullet vs Friendly Ships
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;
  for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
    const bullet = bullets[bIdx];
    if (!bullet) continue;
    if (!bullet.isEnemy) continue;

    const bX = Math.floor(bullet.x);
    const bY = Math.floor(bullet.y);
    const hitPlayer = cloakPowerTicks <= 0 &&
      bX >= playerX &&
      bX < playerX + pWidth &&
      bY >= playerY &&
      bY < playerY + pHeight;
    const hitCom = !!comWingmate && !comWingmate.destroyed &&
      bX >= comWingmate.x &&
      bX < comWingmate.x + comWingmate.ship.variant.sprite.width &&
      bY >= playerY &&
      bY < playerY + comWingmate.ship.variant.sprite.height;

    if (hitPlayer) {
      bullets.splice(bIdx, 1);
      shakeIntensity = 4;
      flashTicks = 3;

      spawnExplosion(bullet.x, bullet.y, theme.red, 10);

      if (playerShield > 0) {
        playerShield -= bullet.damage;
        if (playerShield <= 0) {
          playerHp += playerShield;
          playerShield = 0;
          shieldPowerTicks = 0;
          setStatus("SHIELD BROKEN", 80);
        }
      } else {
        playerHp -= bullet.damage;
      }

      if (playerHp <= 0) {
        playerHp = 0;
        screen = "gameover";
        gameOverReason = "SHIP DESTROYED";
        if (score > highScore) highScore = score;
        spawnExplosion(playerX + pWidth / 2, playerY + pHeight / 2, theme.red, 35);
      }
      continue;
    }

    if (hitCom && comWingmate) {
      bullets.splice(bIdx, 1);
      shakeIntensity = Math.max(shakeIntensity, 2);
      spawnExplosion(bullet.x, bullet.y, theme.red, 8);

      if (comWingmate.shield > 0) {
        comWingmate.shield -= bullet.damage;
        if (comWingmate.shield <= 0) {
          comWingmate.hp += comWingmate.shield;
          comWingmate.shield = 0;
          comWingmate.shieldPowerTicks = 0;
          setStatus("COM SHIELD BROKEN", 80);
        }
      } else {
        comWingmate.hp -= bullet.damage;
      }

      if (comWingmate.hp <= 0) {
        comWingmate.hp = 0;
        comWingmate.destroyed = true;
        setStatus("COM-02 DESTROYED", 120);
        spawnExplosion(
          comWingmate.x + comWingmate.ship.variant.sprite.width / 2,
          playerY + comWingmate.ship.variant.sprite.height / 2,
          theme.amber,
          28
        );
      }
    }
  }

  if (enemies.length === 0) {
    if (wave < 3) {
      wave++;
      startWave(wave);
      score += 1000 * (wave - 1);
      playerHp = Math.min(playerMaxHp, playerHp + 20);
    } else {
      score += 5000;
      if (score > highScore) highScore = score;
      screen = "victory";
    }
  }
}

// Moves player within mode-specific limits.
function movePlayer(offsetX: number, offsetY = 0) {
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;
  playerX = clampShipX(playerX + offsetX * playerSpeed, pWidth);
  playerY = clampShipY(playerY + offsetY * Math.max(1, playerSpeed * 0.7), pHeight);
  playerMotionBank = Math.max(-1, Math.min(1, offsetX / 2));
  playerMotionLift = Math.max(-1, Math.min(1, offsetY / 2));
  playerMotionTicks = 10;
  if (isTurboMode()) {
    turboPlayerBank = Math.max(-1, Math.min(1, offsetX / 2));
    turboPlayerLift = Math.max(-1, Math.min(1, offsetY / 2));
  }
}

function rotateTurboPlayer(offset: number) {
  if (!isTurboMode()) return;
  const direction = offset < 0 ? -1 : 1;
  turboPlayerHeading = ((turboPlayerHeading + direction + 4) % 4) as TurboHeading;
  syncTurboRotationForLegacySystems();
  turboPlayerBank = getTurboHeadingX();
  turboPlayerLift = getTurboHeadingY();
  playerMotionBank = getTurboHeadingX();
  playerMotionLift = getTurboHeadingY();
  playerMotionTicks = 12;
  setStatus(`HEADING ${getTurboHeadingName()}`, 50);
}

function triggerTurboEngine() {
  if (!isTurboMode()) return;
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;
  turboEngineTicks = 12;
  turboPlayerLift = getTurboHeadingY();
  playerMotionLift = getTurboHeadingY();
  playerMotionBank = getTurboHeadingX();
  playerMotionTicks = 12;
  playerX = clampShipX(playerX + getTurboHeadingX() * playerSpeed * 2.2, pWidth);
  playerY = clampShipY(playerY + getTurboHeadingY() * Math.max(1.2, playerSpeed * 1.1), pHeight);
  shakeIntensity = Math.max(shakeIntensity, 0.8);
  setStatus(`ENGINE ${getTurboHeadingName()}`, 30);
}

function setBoardCell(grid: Cell[][], x: number, y: number, cell: Cell) {
  const targetX = Math.floor(x);
  const targetY = Math.floor(y);
  if (targetX < 0 || targetX >= BOARD_WIDTH || targetY < 0 || targetY >= BOARD_HEIGHT) return;
  const row = grid[targetY];
  if (row) row[targetX] = cell;
}

function getProjectileVisualStyle(bullet: Bullet): ProjectileVisualStyle {
  if (bullet.isEnemy) {
    if (bullet.char === "◆") return { head: tick % 8 < 4 ? "◆" : "◇", trail: "·", trailLength: 3, radius: 1, side: "•", coreColor: theme.white };
    if (bullet.char === "█") return { head: "█", trail: "▪", trailLength: 2, radius: 1, side: "▌", coreColor: theme.red };
    if (bullet.char === "▌" || bullet.char === "▐") return { head: bullet.char, trail: "·", trailLength: 2, radius: 0 };
    if (bullet.char === "v") return { head: "v", trail: ".", trailLength: 2, radius: 0 };
    return { head: tick % 10 < 5 ? "•" : "∙", trail: ".", trailLength: 2, radius: 0 };
  }

  if (bullet.char === "║" || bullet.char === "┃") {
    return { head: bullet.char, trail: bullet.char === "┃" ? "┃" : "│", trailLength: bullet.damage >= 18 ? 4 : 3, radius: bullet.damage >= 22 ? 1 : 0, side: "·", coreColor: theme.white };
  }
  if (bullet.char === "┿") return { head: tick % 6 < 3 ? "┿" : "╂", trail: "│", trailLength: 3, radius: 0, coreColor: theme.white };
  if (bullet.char === "╱" || bullet.char === "╲" || bullet.char === "⟋" || bullet.char === "⟍") {
    return { head: bullet.char, trail: bullet.char === "╱" || bullet.char === "⟋" ? "╱" : "╲", trailLength: 2, radius: 0 };
  }
  if (bullet.char === "❂" || bullet.char === "●") return { head: bullet.char, trail: "°", trailLength: 2, radius: 1, side: "·", coreColor: theme.white };
  if (bullet.char === "°") return { head: "°", trail: ".", trailLength: 1, radius: 0 };
  if (bullet.char === "▲" || bullet.char === "◤" || bullet.char === "◥" || bullet.char === "▴") {
    return { head: bullet.char, trail: "▪", trailLength: bullet.damage >= 18 ? 3 : 2, radius: bullet.damage >= 24 ? 1 : 0, side: "▴", coreColor: theme.white };
  }

  return { head: bullet.char, trail: ".", trailLength: 1, radius: 0 };
}

function drawProjectile(grid: Cell[][], bullet: Bullet) {
  const style = getProjectileVisualStyle(bullet);
  const headX = Math.floor(bullet.x);
  const headY = Math.floor(bullet.y);
  const velocityX = Math.abs(bullet.vx) < 0.05 ? 0 : Math.sign(bullet.vx);
  const velocityY = Math.abs(bullet.vy) < 0.05 ? 0 : Math.sign(bullet.vy);
  const trailColor = bullet.isEnemy ? theme.red : bullet.color;

  for (let index = style.trailLength; index >= 1; index--) {
    const trailX = headX - velocityX * index;
    const trailY = headY - velocityY * index;
    setBoardCell(grid, trailX, trailY, { char: style.trail, color: trailColor, bold: index === 1 });
  }

  if (style.radius >= 1) {
    const side = style.side ?? "·";
    setBoardCell(grid, headX - 1, headY, { char: side, color: bullet.color, bold: false });
    setBoardCell(grid, headX + 1, headY, { char: side, color: bullet.color, bold: false });
    if (style.radius >= 2) {
      setBoardCell(grid, headX, headY - 1, { char: side, color: bullet.color, bold: false });
      setBoardCell(grid, headX, headY + 1, { char: side, color: bullet.color, bold: false });
    }
  }

  setBoardCell(grid, headX, headY, { char: style.head, color: style.coreColor ?? bullet.color, bold: true });
}

function drawCollectible(grid: Cell[][], pickup: Collectible) {
  const cX = Math.floor(pickup.x);
  const cY = Math.floor(pickup.y);

  if (pickup.kind === "star") {
    setBoardCell(grid, cX, cY, { char: pickup.char, color: pickup.color, bold: true });
    return;
  }

  const accent = pickup.kind === "shield" ? theme.cyan : pickup.color;
  const armChar = tick % 12 < 6 ? "✦" : "+";
  setBoardCell(grid, cX, cY - 1, { char: armChar, color: accent, bold: true });
  setBoardCell(grid, cX - 1, cY, { char: armChar, color: accent, bold: true });
  setBoardCell(grid, cX, cY, { char: pickup.char, color: pickup.color, bold: true });
  setBoardCell(grid, cX + 1, cY, { char: armChar, color: accent, bold: true });
  setBoardCell(grid, cX, cY + 1, { char: armChar, color: accent, bold: true });
}

function drawShipShield(grid: Cell[][], shipX: number, shipY: number, shipWidth: number, shipHeight: number, shield: number, color = theme.blue) {
  if (shield <= 0) return;
  const shieldY = shipY + Math.floor(shipHeight / 2);
  const row = grid[shieldY];
  if (!row) return;

  if (shipX > 0) row[Math.floor(shipX - 1)] = { char: tick % 8 < 4 ? "(" : "<", color, bold: true };
  const rightX = Math.floor(shipX + shipWidth);
  if (rightX < BOARD_WIDTH) row[rightX] = { char: tick % 8 < 4 ? ")" : ">", color, bold: true };
}

function drawCloakField(grid: Cell[][], shipX: number, shipY: number, shipWidth: number, shipHeight: number) {
  if (cloakPowerTicks <= 0) return;
  const shimmer = tick % 10 < 5 ? "." : "·";
  const topY = Math.floor(shipY - 1);
  const bottomY = Math.floor(shipY + shipHeight);
  for (let x = Math.floor(shipX - 1); x <= Math.floor(shipX + shipWidth); x++) {
    if ((x + tick) % 2 === 0) {
      setBoardCell(grid, x, topY, { char: shimmer, color: theme.purple });
      setBoardCell(grid, x, bottomY, { char: shimmer, color: theme.purple });
    }
  }
  setBoardCell(grid, shipX - 1, shipY + Math.floor(shipHeight / 2), { char: "(", color: theme.purple, bold: true });
  setBoardCell(grid, shipX + shipWidth, shipY + Math.floor(shipHeight / 2), { char: ")", color: theme.purple, bold: true });
}

function drawTurboSpecialEffect(grid: Cell[][], effect: TurboSpecialEffect) {
  const pulse = effect.life % 2 === 0;

  if (effect.kind === "laser") {
    const beamTop = 0;
    const beamBottom = Math.min(BOARD_HEIGHT - 1, Math.floor(effect.y));
    for (let y = beamTop; y <= beamBottom; y++) {
      setBoardCell(grid, effect.x, y, { char: pulse ? "│" : "┃", color: effect.color, bold: true });
      if (y % 5 === tick % 5) {
        setBoardCell(grid, effect.x - 1, y, { char: ".", color: theme.cyan });
        setBoardCell(grid, effect.x + 1, y, { char: ".", color: theme.cyan });
      }
    }
    return;
  }

  const progress = 1 - effect.life / effect.maxLife;
  const ringRadius = Math.max(2, effect.radius * progress);
  const verticalScale = 0.52;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.16) {
    const x = Math.round(effect.x + Math.cos(angle) * ringRadius);
    const y = Math.round(effect.y + Math.sin(angle) * ringRadius * verticalScale);
    setBoardCell(grid, x, y, { char: pulse ? "*" : "✦", color: effect.color, bold: true });
  }
  setBoardCell(grid, effect.x, effect.y, { char: pulse ? "◎" : "●", color: theme.white, bold: true });
}

function drawTurboBackdrop(grid: Cell[][]) {
  if (!isTurboMode()) return;

  const centerX = Math.floor(BOARD_WIDTH / 2 - turboRouteX * 0.08);
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const drift = (tick + y * 3) % 12;
    if ((y + tick) % 4 === 0) {
      for (let x = drift; x < BOARD_WIDTH; x += 12) {
        setBoardCell(grid, x, y, { char: "·", color: theme.purple });
      }
    }
    if (y % 3 === 0) {
      const left = Math.max(1, centerX - Math.floor(y * 1.4) - (tick % 4));
      const right = Math.min(BOARD_WIDTH - 2, centerX + Math.floor(y * 1.4) + (tick % 4));
      setBoardCell(grid, left, y, { char: "╱", color: theme.grid });
      setBoardCell(grid, right, y, { char: "╲", color: theme.grid });
    }
  }
}

function drawTurboMiniMap(grid: Cell[][]) {
  if (!isTurboMode() || BOARD_WIDTH < 72 || BOARD_HEIGHT < 18) return;

  const mapX = 2;
  const mapY = 2;
  const mapWidth = 19;
  const mapHeight = 7;
  const right = mapX + mapWidth - 1;
  const bottom = mapY + mapHeight - 1;
  const centerX = mapX + Math.floor(mapWidth / 2);
  const gateY = mapY + 1;
  const playerYOnMap = mapY + 1 + Math.round((1 - getTurboRouteProgress()) * (mapHeight - 3));
  const playerXOnMap = Math.max(mapX + 2, Math.min(right - 2, centerX + Math.round(turboRouteX / 32)));

  for (let x = mapX; x <= right; x++) {
    setBoardCell(grid, x, mapY, { char: x === mapX || x === right ? "+" : "-", color: theme.grid });
    setBoardCell(grid, x, bottom, { char: x === mapX || x === right ? "+" : "-", color: theme.grid });
  }
  for (let y = mapY + 1; y < bottom; y++) {
    setBoardCell(grid, mapX, y, { char: "|", color: theme.grid });
    setBoardCell(grid, right, y, { char: "|", color: theme.grid });
  }

  const label = " MAP ";
  Array.from(label).forEach((char, index) => {
    setBoardCell(grid, mapX + 2 + index, mapY, { char, color: theme.cyan, bold: true });
  });

  for (let y = gateY; y < bottom; y++) {
    setBoardCell(grid, centerX, y, { char: y % 2 === tick % 2 ? ":" : ".", color: theme.grid });
  }
  setBoardCell(grid, centerX, gateY, { char: wave >= 3 ? "B" : "G", color: wave >= 3 ? theme.red : theme.cyan, bold: true });
  setBoardCell(grid, playerXOnMap, playerYOnMap, { char: "P", color: theme.lime, bold: true });

  const driftLabel = Math.abs(turboRouteX) < 14 ? "ROUTE" : turboRouteX < 0 ? "WEST " : "EAST ";
  Array.from(driftLabel.slice(0, 5)).forEach((char, index) => {
    setBoardCell(grid, mapX + 2 + index, bottom, { char, color: Math.abs(turboRouteX) < 14 ? theme.green : theme.amber, bold: true });
  });
}

function drawTurboObjectiveBeacon(grid: Cell[][]) {
  if (!isTurboMode()) return;
  const label = wave >= 3 ? "BOSS" : "GATE";
  const targetX = Math.floor(Math.max(4, Math.min(BOARD_WIDTH - label.length - 4, BOARD_WIDTH / 2 - turboRouteX * 0.12 + getTurboHeadingX() * BOARD_WIDTH * 0.12)));
  const y = 1;
  const marker = getTurboBearingArrow();
  const text = `${marker} ${label}`;
  Array.from(text).forEach((char, index) => {
    setBoardCell(grid, targetX + index, y, { char, color: wave >= 3 ? theme.red : theme.cyan, bold: true });
  });
}

function drawTurboEnemy(grid: Cell[][], enemy: Enemy) {
  drawSprite(grid, enemy.x, enemy.y, enemy.variant, tick + (enemy.phase ?? 0));
  const centerX = Math.floor(enemy.x + enemy.width / 2);
  const centerY = Math.floor(enemy.y + enemy.height / 2);
  const color = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;

  if (enemy.turboKind === "asteroid") {
    const cores = ["O", "0", "@", "*"];
    const core = cores[Math.abs(Math.floor((enemy.rotation ?? 0) * 2)) % cores.length]!;
    setBoardCell(grid, centerX, centerY, { char: core, color, bold: true });
  } else if (enemy.turboKind === "comet") {
    const tail = (enemy.vx ?? 0) > 0 ? "<" : ">";
    const tailX = (enemy.vx ?? 0) > 0 ? Math.floor(enemy.x) - 1 : Math.floor(enemy.x + enemy.width);
    setBoardCell(grid, tailX, Math.floor(enemy.y), { char: tail, color: theme.lime, bold: true });
  } else if (enemy.turboKind === "mine") {
    const pulse = tick % 10 < 5 ? "x" : "+";
    setBoardCell(grid, centerX - 2, centerY, { char: pulse, color, bold: true });
    setBoardCell(grid, centerX + 2, centerY, { char: pulse, color, bold: true });
  } else if (enemy.turboKind === "raider" || enemy.turboKind === "rotor") {
    const bank = Math.sign(enemy.vx ?? 0);
    if (bank < 0) setBoardCell(grid, Math.floor(enemy.x) - 1, centerY, { char: "\\", color, bold: true });
    if (bank > 0) setBoardCell(grid, Math.floor(enemy.x + enemy.width), centerY, { char: "/", color, bold: true });
  } else if (enemy.turboKind === "dreadnought") {
    const glow = tick % 8 < 4 ? "!" : "|";
    setBoardCell(grid, centerX, centerY, { char: glow, color: theme.amber, bold: true });
  }
}

function drawEnemyDetails(grid: Cell[][], enemy: Enemy) {
  const centerX = Math.floor(enemy.x + enemy.width / 2);
  const centerY = Math.floor(enemy.y + enemy.height / 2);
  const color = toneColors[enemy.variant.tone as keyof typeof toneColors] || theme.red;
  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const heavy = enemy.isBoss || enemy.maxHp >= 90 || enemy.width >= 7;

  if (heavy) {
    const core = hpRatio < 0.35 ? "x" : tick % 10 < 5 ? "@" : "O";
    setBoardCell(grid, centerX, centerY, { char: core, color: hpRatio < 0.35 ? theme.red : theme.white, bold: true });
    setBoardCell(grid, centerX - Math.max(1, Math.floor(enemy.width / 3)), centerY, { char: "<", color, bold: true });
    setBoardCell(grid, centerX + Math.max(1, Math.floor(enemy.width / 3)), centerY, { char: ">", color, bold: true });
    return;
  }

  if (hpRatio < 0.45 && tick % 8 < 4) {
    setBoardCell(grid, centerX, centerY, { char: "x", color: theme.red, bold: true });
  }
}

function drawPlayerShip(grid: Cell[][], shipX: number, shipY: number) {
  const width = activeShip.variant.sprite.width;
  const height = activeShip.variant.sprite.height;
  const bank = getPlayerBankStep();
  const lift = getPlayerLiftStep();
  const baseFrame = getAnimatedFrame(activeShip.variant, tick);
  const motionFrame = buildPlayerMotionFrame(baseFrame, bank, lift, turboEngineTicks > 0, tick);
  drawFrame(grid, shipX, shipY, motionFrame, activeShip.variant.tone as Tone);

  const centerX = Math.floor(shipX + width / 2);
  const noseY = Math.floor(shipY - 1);
  const wingY = Math.floor(shipY + Math.max(1, Math.floor(height / 2)));
  const direction = Math.sign(bank);
  const showMotionStreak = isTurboMode() || playerMotionTicks > 0;

  if (isTurboMode()) {
    setBoardCell(grid, centerX + Math.sign(bank), noseY, { char: lift < 0 ? "^" : getTurboBearingArrow().slice(-1), color: theme.white, bold: true });
  }

  if (direction < 0 && showMotionStreak) {
    setBoardCell(grid, Math.floor(shipX) - 1, wingY, { char: "\\", color: theme.amber, bold: true });
    setBoardCell(grid, Math.floor(shipX + width), wingY + (Math.abs(bank) === 2 ? 1 : 0), { char: "|", color: theme.cyan, bold: true });
  } else if (direction > 0 && showMotionStreak) {
    setBoardCell(grid, Math.floor(shipX) - 1, wingY + (Math.abs(bank) === 2 ? 1 : 0), { char: "|", color: theme.cyan, bold: true });
    setBoardCell(grid, Math.floor(shipX + width), wingY, { char: "/", color: theme.amber, bold: true });
  } else if (isTurboMode()) {
    setBoardCell(grid, Math.floor(shipX) - 1, wingY, { char: "<", color: theme.cyan, bold: true });
    setBoardCell(grid, Math.floor(shipX + width), wingY, { char: ">", color: theme.cyan, bold: true });
  }

  if (lift > 0 || tick % 2 === 0) {
    setBoardCell(grid, centerX, Math.floor(shipY + height), { char: lift > 0 ? "V" : "v", color: theme.amber, bold: true });
  }
  if (turboEngineTicks > 0) {
    const flame = turboEngineTicks % 2 === 0 ? "*" : "+";
    setBoardCell(grid, centerX, Math.floor(shipY + height + 1), { char: flame, color: theme.amber, bold: true });
    setBoardCell(grid, centerX - Math.sign(getTurboHeadingX() || 1), Math.floor(shipY + height), { char: ".", color: theme.red, bold: true });
  }
}

// Renders the board content as string[]
function renderBoard(): string[] {
  const grid: Cell[][] = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ char: " ", color: null }))
  );

  drawTurboBackdrop(grid);

  stars.forEach(star => {
    const sX = Math.floor(star.x);
    const sY = Math.floor(star.y);
    if (sX >= 0 && sX < BOARD_WIDTH && sY >= 0 && sY < BOARD_HEIGHT) {
      const color = flashTicks > 0 ? theme.red : theme.muted;
      const row = grid[sY];
      if (row) {
        row[sX] = { char: star.char, color };
      }
    }
  });
  drawTurboObjectiveBeacon(grid);

  collectibles.forEach(pickup => {
    drawCollectible(grid, pickup);
  });

  enemies.forEach(enemy => {
    if (isTurboMode() && enemy.turboKind) drawTurboEnemy(grid, enemy);
    else drawSprite(grid, enemy.x, enemy.y, enemy.variant, tick);
    drawEnemyDetails(grid, enemy);
  });

  turboSpecialEffects.forEach(effect => {
    drawTurboSpecialEffect(grid, effect);
  });

  const pY = playerY;
  if (comWingmate && !comWingmate.destroyed) {
    drawSprite(grid, comWingmate.x, pY, comWingmate.ship.variant, tick);
    drawShipShield(
      grid,
      comWingmate.x,
      pY,
      comWingmate.ship.variant.sprite.width,
      comWingmate.ship.variant.sprite.height,
      comWingmate.shield,
      theme.amber
    );
  }

  drawPlayerShip(grid, playerX, pY);
  drawShipShield(grid, playerX, pY, activeShip.variant.sprite.width, activeShip.variant.sprite.height, playerShield);
  drawCloakField(grid, playerX, pY, activeShip.variant.sprite.width, activeShip.variant.sprite.height);

  bullets.forEach(bullet => {
    drawProjectile(grid, bullet);
  });

  particles.forEach(p => {
    const pX = Math.floor(p.x);
    const pY = Math.floor(p.y);
    if (pX >= 0 && pX < BOARD_WIDTH && pY >= 0 && pY < BOARD_HEIGHT) {
      const color = p.life < p.maxLife / 2 ? theme.muted : p.color;
      const row = grid[pY];
      if (row) {
        row[pX] = { char: p.char, color, bold: false };
      }
    }
  });

  drawTurboMiniMap(grid);

  const lines: string[] = [];
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    let lineStr = "";
    const row = grid[r];
    if (!row) continue;
    
    for (let c = 0; c < BOARD_WIDTH; c++) {
      const cell = row[c];
      if (!cell) continue;

      if (cell.color && colorEnabled) {
        let text = cell.char;
        if (cell.bold) {
          text = bold(rgb(text, cell.color, true), true);
        } else {
          text = rgb(text, cell.color, true);
        }
        lineStr += text;
      } else {
        lineStr += cell.char;
      }
    }
    lines.push(lineStr);
  }

  return lines;
}

function renderMissionResult(result: "gameover" | "victory"): string {
  const won = result === "victory";
  const accent = won ? theme.green : theme.red;
  const title = won ? " EARTH DEFENDED " : " MISSION FAILED ";
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 100;
  const rank = won
    ? playerLevel >= 3 ? "ACE COMMANDER" : "SECTOR CLEARED"
    : score >= highScore ? "NEW HIGH SCORE" : "DEFENSE BROKEN";
  const innerWidth = PLAYFIELD_WIDTH - 8;
  const bannerLines = won
    ? renderSplashLogo("VICTORY", theme.green, [0, 90, 55])
    : renderSplashLogo("GAME OVER", theme.red, [95, 24, 35]);
  const statLabel = (label: string, labelColor: Rgb) => bold(rgb(label.padEnd(6), labelColor, colorEnabled), colorEnabled);
  const statValue = (value: string, width: number) => rgb(value.padStart(width), theme.white, colorEnabled);
  const statCell = (label: string, value: string, labelColor: Rgb, valueWidth: number) =>
    `${statLabel(label, labelColor)} ${statValue(value, valueWidth)}`;
  const statRows = [
    `${statCell("SCORE", formatNumber(score), theme.green, 8)}   ${statCell("HI", formatNumber(highScore), theme.purple, 8)}`,
    `${statCell("MODE", selectedGameMode.toUpperCase(), theme.cyan, 8)}   ${statCell("PILOT", activeComShip ? "2P COM" : "1P SOLO", theme.lime, 8)}   ${statCell("COM", activeComShip ? comWingmate && !comWingmate.destroyed ? "ACTIVE" : "LOST" : "NONE", theme.amber, 8)}`,
    `${statCell("LOOP", String(campaignLoop).padStart(2, "0"), theme.amber, 8)}   ${statCell("WAVE", String(wave).padStart(2, "0"), theme.cyan, 8)}`,
    `${statCell("SHIP", `LV ${playerLevel} ${activeShip.weapon}`, theme.lime, 26)}`,
    `${statCell("STARS", String(upgradePoints), theme.amber, 8)}   ${statCell("BUGS", String(enemiesDestroyed), theme.red, 8)}   ${statCell("ACC", `${accuracy}%`, theme.green, 5)}`
  ];
  const reportRows = [
    ...bannerLines.map((line) => centerText(line, innerWidth)),
    centerText(rgb(won ? "THE INVASION LINE IS CLEAR" : gameOverReason.toUpperCase(), won ? theme.green : theme.red, colorEnabled), innerWidth),
    "",
    rgb("─".repeat(innerWidth), theme.border, colorEnabled),
    "",
    ...statRows.map((line) => centerText(fitAnsi(line, 56), innerWidth)),
    "",
    centerText(bold(rgb(rank, won ? theme.amber : theme.slate, colorEnabled), colorEnabled), innerWidth),
    "",
    rgb("─".repeat(innerWidth), theme.border, colorEnabled),
    centerText(bold(rgb("R: RESTART     Q: QUIT", theme.cyan, colorEnabled), colorEnabled), innerWidth)
  ];
  const resultHeight = 24;
  const resultContentHeight = resultHeight - 2;
  const resultTopPadding = Math.max(0, Math.floor((resultContentHeight - reportRows.length) / 2));
  const paddedReportRows = [...Array.from({ length: resultTopPadding }, () => ""), ...reportRows];

  return box(title, paddedReportRows, {
    width: PLAYFIELD_WIDTH,
    height: resultHeight,
    borderStyle: "arcade",
    accent,
    color: colorEnabled,
    paddingX: 2,
    titleAlign: "center"
  });
}

const splashLogoGlyphs: Record<string, string[]> = {
  A: [
    "01110",
    "10001",
    "10001",
    "11111",
    "10001",
    "10001",
    "10001"
  ],
  C: [
    "01111",
    "10000",
    "10000",
    "10000",
    "10000",
    "10000",
    "01111"
  ],
  D: [
    "11110",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "11110"
  ],
  E: [
    "11111",
    "10000",
    "10000",
    "11110",
    "10000",
    "10000",
    "11111"
  ],
  G: [
    "01111",
    "10000",
    "10000",
    "10011",
    "10001",
    "10001",
    "01111"
  ],
  I: [
    "11111",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
    "11111"
  ],
  M: [
    "10001",
    "11011",
    "10101",
    "10101",
    "10001",
    "10001",
    "10001"
  ],
  N: [
    "10001",
    "11001",
    "10101",
    "10011",
    "10001",
    "10001",
    "10001"
  ],
  O: [
    "01110",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "01110"
  ],
  R: [
    "11110",
    "10001",
    "10001",
    "11110",
    "10100",
    "10010",
    "10001"
  ],
  T: [
    "11111",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100",
    "00100"
  ],
  U: [
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "10001",
    "01110"
  ],
  V: [
    "10001",
    "10001",
    "10001",
    "10001",
    "01010",
    "01010",
    "00100"
  ],
  Y: [
    "10001",
    "10001",
    "01010",
    "00100",
    "00100",
    "00100",
    "00100"
  ]
};

function getSplashLogoWidth(text: string): number {
  let width = 0;
  for (const char of text.toUpperCase()) {
    if (char === " ") {
      width += 3;
      continue;
    }
    const glyph = splashLogoGlyphs[char];
    if (glyph) width += glyph[0]!.length + 1;
  }
  return Math.max(0, width);
}

function renderSplashLogo(text: string, foregroundColor: Rgb = theme.cyan, shadowColor: Rgb = [0, 119, 130]): string[] {
  const logoWidth = getSplashLogoWidth(text);
  const logoHeight = 8;
  const grid: Cell[][] = Array.from({ length: logoHeight }, () =>
    Array.from({ length: logoWidth }, () => ({ char: " ", color: null }))
  );

  let cursorX = 0;
  for (const char of text.toUpperCase()) {
    if (char === " ") {
      cursorX += 3;
      continue;
    }

    const glyph = splashLogoGlyphs[char];
    if (!glyph) continue;

    for (let y = 0; y < glyph.length; y++) {
      const row = glyph[y]!;
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== "1") continue;
        const shadowRow = grid[y + 1];
        if (shadowRow && cursorX + x + 1 < logoWidth) {
          shadowRow[cursorX + x + 1] = { char: "█", color: shadowColor };
        }
        grid[y]![cursorX + x] = { char: "█", color: foregroundColor, bold: true };
      }
    }

    cursorX += glyph[0]!.length + 1;
  }

  return grid.map((row) => row.map((cell) => {
    if (!cell.color) return cell.char;
    const colored = rgb(cell.char, cell.color, colorEnabled);
    return cell.bold ? bold(colored, colorEnabled) : colored;
  }).join(""));
}

const ansiShadowGlyphs: Record<string, string[]> = {
  A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
  D: ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
  E: ["███████╗", "██╔════╝", "█████╗  ", "██╔══╝  ", "███████╗", "╚══════╝"],
  I: ["██╗", "██║", "██║", "██║", "██║", "╚═╝"],
  N: ["███╗   ██╗", "████╗  ██║", "██╔██╗ ██║", "██║╚██╗██║", "██║ ╚████║", "╚═╝  ╚═══╝"],
  R: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██║  ██║", "╚═╝  ╚═╝"],
  T: ["████████╗", "╚══██╔══╝", "   ██║   ", "   ██║   ", "   ██║   ", "   ╚═╝   "],
  U: ["██╗   ██╗", "██║   ██║", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
  V: ["██╗   ██╗", "██║   ██║", "██║   ██║", "╚██╗ ██╔╝", " ╚████╔╝ ", "  ╚═══╝  "]
};

function renderAnsiShadowTitle(text: string): string[] {
  const rows = Array.from({ length: 6 }, () => "");
  for (const char of text.toUpperCase()) {
    if (char === " ") {
      for (let row = 0; row < rows.length; row++) rows[row] += "  ";
      continue;
    }

    const glyph = ansiShadowGlyphs[char];
    if (!glyph) continue;
    for (let row = 0; row < rows.length; row++) {
      rows[row] += glyph[row] ?? "";
    }
  }

  return rows.map((line) => bold(rgb(line, theme.cyan, colorEnabled), colorEnabled));
}

function renderSplashScreen(): string {
  const logoLines = renderAnsiShadowTitle("INVADER TUI");
  const splashWidth = Math.max(PLAYFIELD_WIDTH, Math.max(...logoLines.map(visibleLength)) + 6);
  const splashHeight = SPLASH_HEIGHT;
  const splashContentHeight = splashHeight - 2;
  const splashBodyHeight = logoLines.length + 5;
  const splashTopPadding = Math.max(1, Math.floor((splashContentHeight - splashBodyHeight) / 2));
  const rows: string[] = [];
  for (let index = 0; index < splashTopPadding; index++) rows.push("");
  for (const line of logoLines) {
    rows.push(centerText(line, splashWidth - 6));
  }
  rows.push("");
  rows.push(centerText(`${rgb("■", theme.amber, colorEnabled)} ${bold(rgb("PLAY", theme.white, colorEnabled), colorEnabled)}`, splashWidth - 6));
  rows.push("");
  rows.push(centerText(bold(rgb("ENTER / SPACE", theme.white, colorEnabled), colorEnabled), splashWidth - 6));
  rows.push("");

  return box("by whoElseButUmar", rows, {
    width: splashWidth,
    height: splashHeight,
    borderStyle: "block",
    accent: theme.cyan,
    color: colorEnabled,
    paddingX: 2
  });
}

function setSelectedGameMode(mode: GameMode) {
  if (selectedGameMode === mode) return;
  selectedGameMode = mode;
  menuAnimationTick = 0;
  applyGameModeDimensions(mode);
  initStars();

  if (mode === "turbo") {
    shakeIntensity = Math.max(shakeIntensity, 5);
    flashTicks = 6;
    setStatus("TURBO DRIVE ARMED", 80);
  } else {
    shakeIntensity = Math.max(shakeIntensity, 1.5);
    setStatus("CLASSIC VECTOR", 60);
  }
}

function cycleSelectedGameMode(offset: number) {
  const currentIndex = Math.max(0, gameModeOrder.indexOf(selectedGameMode));
  const nextMode = gameModeOrder[(currentIndex + offset + gameModeOrder.length) % gameModeOrder.length]!;
  setSelectedGameMode(nextMode);
}

function repeatPattern(pattern: string, width: number): string {
  if (width <= 0) return "";
  let output = "";
  while (visibleLength(output) < width) output += pattern;
  return fitAnsi(output, width);
}

function renderArcadeRail(label: string, width: number, tone: Rgb, pattern = "═"): string {
  const text = ` ${label} `;
  const textLength = visibleLength(text);
  const railWidth = Math.max(0, width - textLength);
  const left = Math.floor(railWidth / 2);
  const right = railWidth - left;
  return fitAnsi(`${rgb(repeatPattern(pattern, left), tone, colorEnabled)}${bold(rgb(text, tone, colorEnabled), colorEnabled)}${rgb(repeatPattern(pattern, right), tone, colorEnabled)}`, width);
}

function renderTurboRumbleText(text: string, tone: Rgb, strong = false, customTick = tick): string {
  const isSettled = menuAnimationTick >= 50;
  if (isSettled) {
    return bold(rgb(text, tone, colorEnabled), colorEnabled);
  }

  const chars = Array.from(text.toUpperCase());
  const rumble = chars.map((char, index) => {
    if (char === " ") return " ";
    const phase = (customTick + index * 2) % 8;
    const expanded = strong && phase === 0 ? `${char}${char}` : char;
    if (phase === 0) return bold(rgb(expanded, theme.white, colorEnabled), colorEnabled);
    if (phase === 3) return bold(rgb(expanded, theme.red, colorEnabled), colorEnabled);
    return bold(rgb(expanded, tone, colorEnabled), colorEnabled);
  });
  return rumble.join(strong ? " " : "");
}

function getBackdropEntityChar(x: number, row: number, width: number, menuTick: number): { char: string; tone: Tone } | null {
  return null;
}

function renderBackdropPadding(length: number, row: number, startX: number, width: number, menuTick: number): string {
  if (length <= 0) return "";
  if (selectedGameMode !== "turbo") {
    return " ".repeat(length);
  }

  const isSettled = menuAnimationTick >= 50;
  let result = "";
  for (let i = 0; i < length; i++) {
    const x = startX + i;
    
    if (!isSettled) {
      const matrixPhase = (menuTick + row * 2 - x) % 12;
      const starPhase = (menuTick - row + x * 3) % 20;
      
      if (matrixPhase === 0) {
        const glyphs = ["★", "◆", "▲", "✦", "▞", "▚", "·", "o"];
        const char = glyphs[(menuTick + x + row) % glyphs.length]!;
        result += bold(rgb(char, theme.amber, colorEnabled), colorEnabled);
      } else if (matrixPhase === 1 || matrixPhase === 2) {
        result += dim(rgb("·", theme.amber, colorEnabled), colorEnabled);
      } else if (starPhase === 0) {
        result += bold(rgb("✦", theme.white, colorEnabled), colorEnabled);
      } else if (starPhase === 10) {
        result += dim(rgb("·", theme.muted, colorEnabled), colorEnabled);
      } else if ((x + row) % 6 === 0 && menuTick % 12 < 4) {
        result += dim(rgb("░", theme.purple, colorEnabled), colorEnabled);
      } else {
        result += " ";
      }
    } else {
      // Settled background: very subtle, clean, slow drifting/twinkling stars. No matrix falling rain!
      const slowTick = Math.floor(tick / 4);
      const starPhase = (slowTick - row + x * 7) % 40;
      
      if (starPhase === 0) {
        result += dim(rgb("·", theme.muted, colorEnabled), colorEnabled);
      } else if (starPhase === 20) {
        result += rgb("·", theme.border, colorEnabled);
      } else if (starPhase === 10) {
        result += rgb("✦", theme.border, colorEnabled);
      } else {
        result += " ";
      }
    }
  }
  return result;
}

function centerWithBackdrop(content: string, width: number, row: number, menuTick: number): string {
  const visibleLen = visibleLength(content);
  if (visibleLen >= width) return content;
  const left = Math.floor((width - visibleLen) / 2);
  const right = width - visibleLen - left;
  const leftStr = renderBackdropPadding(left, row, 0, width, menuTick);
  const rightStr = renderBackdropPadding(right, row, left + visibleLen, width, menuTick);
  return leftStr + content + rightStr;
}

function renderModeBackdropLine(width: number, row: number, menuTick: number): string {
  if (!isTurboMode()) {
    return rgb(repeatPattern(row % 2 === 0 ? "· " : "  ", width), theme.grid, colorEnabled);
  }

  const isSettled = menuAnimationTick >= 50;
  let result = "";
  
  if (!isSettled) {
    const phase = (menuTick + row * 2) % 12;
    const starPhase = (menuTick - row) % 20;

    for (let col = 0; col < width; col++) {
      const colPhase = (col + phase) % 12;
      if (colPhase === 0) {
        const glyphs = ["★", "◆", "▲", "✦", "▞", "▚", "·", "o"];
        const glyph = glyphs[(menuTick + col + row) % glyphs.length]!;
        result += bold(rgb(glyph, theme.amber, colorEnabled), colorEnabled);
      } else if (colPhase === 1 || colPhase === 2) {
        result += dim(rgb("·", theme.amber, colorEnabled), colorEnabled);
      } else if ((col + starPhase) % 20 === 0) {
        result += bold(rgb("✦", theme.white, colorEnabled), colorEnabled);
      } else if ((col + starPhase) % 20 === 10) {
        result += dim(rgb("·", theme.muted, colorEnabled), colorEnabled);
      } else if ((col + row) % 6 === 0 && menuTick % 12 < 4) {
        result += dim(rgb("░", theme.purple, colorEnabled), colorEnabled);
      } else {
        result += " ";
      }
    }
  } else {
    // Settled: subtle stars on the grid line
    const slowTick = Math.floor(tick / 4);
    const starPhase = (slowTick - row) % 40;
    
    for (let col = 0; col < width; col++) {
      const colStarPhase = (col + starPhase) % 40;
      if (colStarPhase === 0) {
        result += dim(rgb("·", theme.muted, colorEnabled), colorEnabled);
      } else if (colStarPhase === 10) {
        result += rgb("✦", theme.border, colorEnabled);
      } else {
        result += " ";
      }
    }
  }
  return result;
}

function getShinedChar(char: string, idx: number, perimeter: number, menuTick: number): string {
  if (!colorEnabled) return char;
  
  const isSettled = menuAnimationTick >= 50;
  const speed = isSettled ? 0.35 : 1.5;
  const shineCenter = Math.floor(menuTick * speed) % perimeter;
  const diff = (idx - shineCenter + perimeter) % perimeter;
  
  if (diff === 0) {
    return bold(rgb(char, [255, 245, 180], colorEnabled), colorEnabled); // Bright Gold/White core
  } else if (diff === 1 || diff === perimeter - 1) {
    return bold(rgb(char, [255, 215, 0], colorEnabled), colorEnabled); // Gold inner tail
  } else if (diff === 2 || diff === perimeter - 2) {
    return rgb(char, [218, 165, 32], colorEnabled); // Goldenrod outer tail
  } else if (diff === 3 || diff === perimeter - 3) {
    return isSettled ? dim(rgb(char, theme.border, colorEnabled), colorEnabled) : rgb(char, theme.amber, colorEnabled);
  } else if (diff === 4 || diff === perimeter - 4) {
    return isSettled ? dim(rgb(char, theme.border, colorEnabled), colorEnabled) : dim(rgb(char, theme.amber, colorEnabled));
  } else {
    return dim(rgb(char, theme.border, colorEnabled), colorEnabled); // Default Border
  }
}

function renderModeOption(mode: GameMode, width: number, startRowIdx: number, menuTick: number): string[] {
  const selected = selectedGameMode === mode;
  const config = getGameModeConfig(mode);
  const cardWidth = Math.min(width, mode === "turbo" ? 54 : 48);
  const tone = selected ? config.accent : theme.border;
  
  let top = selected ? `╔${"═".repeat(cardWidth - 2)}╗` : `┌${"─".repeat(cardWidth - 2)}┐`;
  let bottom = selected ? `╚${"═".repeat(cardWidth - 2)}╝` : `└${"─".repeat(cardWidth - 2)}┘`;

  if (mode === "turbo" && selected) {
    const perimeter = 2 * cardWidth + 6;
    
    // Top line
    let topChars = "";
    for (let col = 0; col < cardWidth; col++) {
      const char = col === 0 ? "╔" : col === cardWidth - 1 ? "╗" : "═";
      topChars += getShinedChar(char, col, perimeter, menuTick);
    }
    
    // Bottom line
    let bottomChars = "";
    for (let col = 0; col < cardWidth; col++) {
      const char = col === 0 ? "╚" : col === cardWidth - 1 ? "╝" : "═";
      const idx = cardWidth + 3 + (cardWidth - 1 - col);
      bottomChars += getShinedChar(char, idx, perimeter, menuTick);
    }
    
    // Left and right border chars for middle lines
    const getLeftBorder = (row: number) => {
      const idx = 2 * cardWidth + 3 + (3 - row);
      return getShinedChar("║", idx, perimeter, menuTick);
    };
    
    const getRightBorder = (row: number) => {
      const idx = cardWidth + row - 1;
      return getShinedChar("║", idx, perimeter, menuTick);
    };
    
    const marker = "▶";
    const title = renderTurboRumbleText("TURBO MODE V2", theme.amber, true, menuTick);
    const dimensions = `${config.boardWidth}x${config.boardHeight}`;
    const feature = "V2 RUN  //  GATE BOSS  //  E ENGINE";
    const cabinet = "TURBO CABINET";
    
    const rawLines = [
      topChars,
      getLeftBorder(1) + rgb(` ${marker} `, tone, colorEnabled) + fitAnsi(title, cardWidth - 8) + rgb(` ${marker} `, tone, colorEnabled) + getRightBorder(1),
      getLeftBorder(2) + rgb(` `, tone, colorEnabled) + fitAnsi(`${cabinet}  ${dimensions}`, cardWidth - 4) + rgb(` `, tone, colorEnabled) + getRightBorder(2),
      getLeftBorder(3) + rgb(` `, tone, colorEnabled) + fitAnsi(feature, cardWidth - 4) + rgb(` `, tone, colorEnabled) + getRightBorder(3),
      bottomChars
    ];
    
    return rawLines.map((line, offset) => {
      return centerWithBackdrop(line, width, startRowIdx + offset, menuTick);
    });
  }

  const marker = selected ? "▶" : " ";
  const title = bold(rgb(config.label.toUpperCase(), selected ? config.accent : theme.muted, colorEnabled), colorEnabled);
  const dimensions = `${config.boardWidth}x${config.boardHeight}`;
  const feature = mode === "turbo"
    ? "V2 RUN  //  GATE BOSS  //  E ENGINE"
    : "ORIGINAL LANE  //  SPACE LASER";
  const cabinet = mode === "turbo" ? "TURBO CABINET" : "CLASSIC VECTOR";

  const rawLines = [
    rgb(top, tone, colorEnabled),
    rgb(`║ ${marker} `, tone, colorEnabled) + fitAnsi(title, cardWidth - 8) + rgb(` ${marker} ║`, tone, colorEnabled),
    rgb(`║ `, tone, colorEnabled) + fitAnsi(`${cabinet}  ${dimensions}`, cardWidth - 4) + rgb(` ║`, tone, colorEnabled),
    rgb(`║ `, tone, colorEnabled) + fitAnsi(feature, cardWidth - 4) + rgb(` ║`, tone, colorEnabled),
    rgb(bottom, tone, colorEnabled)
  ];

  return rawLines.map((line, offset) => {
    return centerWithBackdrop(line, width, startRowIdx + offset, menuTick);
  });
}

function renderModeSelectScreen(): string {
  const config = getGameModeConfig();
  const modeWidth = Math.max(MIN_PLAYFIELD_WIDTH, PLAYFIELD_WIDTH);
  const innerWidth = Math.max(1, modeWidth - 6);
  const title = selectedGameMode === "turbo"
    ? renderTurboRumbleText("TURBO MODE", theme.amber, shakeIntensity > 0, menuAnimationTick)
    : bold(rgb("SELECT PLAY MODE", config.accent, colorEnabled), colorEnabled);

  const rows: string[] = [];
  rows.push(renderArcadeRail(selectedGameMode === "turbo" ? "1UP  TURBO READY  HIGH VOLTAGE" : "1UP  CLASSIC READY", innerWidth, config.accent, selectedGameMode === "turbo" ? "▓" : "═"));
  rows.push(centerWithBackdrop(title, innerWidth, 1, tick));
  rows.push(renderArcadeRail("A/D OR ARROWS TO CHOOSE", innerWidth, theme.border, selectedGameMode === "turbo" ? "░" : "─"));
  rows.push(...renderModeOption("classic", innerWidth, 3, tick));
  rows.push(renderModeBackdropLine(innerWidth, 8, tick));
  rows.push(...renderModeOption("turbo", innerWidth, 9, tick));
  
  if (selectedGameMode === "turbo") {
    rows.push(renderArcadeRail("BACKGROUND RUMBLE  //  LOW MOTION SHAKE  //  NOVA SPECIAL", innerWidth, theme.amber, "░"));
  } else {
    rows.push(centerWithBackdrop(rgb("CLASSIC: ORIGINAL PLAY SPACE AND HORIZONTAL DODGE", theme.cyan, colorEnabled), innerWidth, 14, tick));
  }
  
  rows.push(centerWithBackdrop(bold(rgb("ENTER: CONTINUE     Q: QUIT", theme.white, colorEnabled), colorEnabled), innerWidth, 15, tick));
  
  return box(" MODE SELECT ", rows, {
    width: modeWidth,
    height: 19,
    borderStyle: selectedGameMode === "turbo" ? "cyberpunk" : "arcade",
    accent: flashTicks > 0 ? theme.red : config.accent,
    color: colorEnabled,
    paddingX: 2,
    titleAlign: "center"
  });
}

function frameFitsViewport(frame: string, termWidth: number, termHeight: number): boolean {
  const lines = frame.split("\n");
  if (lines.length > termHeight) return false;
  return lines.every((line) => visibleLength(line) <= termWidth);
}

function getRequiredViewportHeight(): number {
  if (screen === "playing") return BOARD_HEIGHT + GAMEPLAY_HUD_HEIGHT + 3;
  if (screen === "mode") return 19;
  if (screen === "start") return 24;
  if (screen === "gameover" || screen === "victory") return 24;
  return SPLASH_HEIGHT;
}

function renderViewportFallback(termWidth: number, termHeight: number): string {
  const width = Math.max(20, Math.min(PLAYFIELD_WIDTH, termWidth));
  const height = Math.max(4, Math.min(8, termHeight));
  const body = [
    centerText(bold(rgb("TERMINAL TOO SMALL", theme.amber, colorEnabled), colorEnabled), Math.max(1, width - 4)),
    centerText(rgb(`${PLAYFIELD_WIDTH}x${getRequiredViewportHeight()} required`, theme.muted, colorEnabled), Math.max(1, width - 4)),
    centerText(rgb(`${termWidth}x${termHeight} available`, theme.muted, colorEnabled), Math.max(1, width - 4)),
    centerText(bold(rgb("Q: QUIT", theme.cyan, colorEnabled), colorEnabled), Math.max(1, width - 4))
  ];

  if (width < 24 || height < 6) {
    return fitAnsi("TERMINAL TOO SMALL - Q: QUIT", width);
  }

  return box(" INVADER TUI ", body, {
    width,
    height,
    borderStyle: "arcade",
    accent: theme.amber,
    color: colorEnabled,
    paddingX: 1
  });
}

function getActiveSelectionIndex(): number {
  return selectedLoadoutSlot === "com" ? selectedComShipIndex : selectedShipIndex;
}

function setActiveSelectionIndex(index: number) {
  const normalized = (index + playerShips.length) % playerShips.length;
  if (selectedLoadoutSlot === "com") {
    selectedComShipIndex = normalized;
  } else {
    selectedShipIndex = normalized;
  }
  builderSectionIndex = 0;
  builderSlotIndex = 0;
}

function getActiveBuilderShip(): PlayerShip {
  return playerShips[getActiveSelectionIndex()] ?? playerShips[0]!;
}

function setActiveBuilderDesign(design: ShipDesign) {
  playerShips[getActiveSelectionIndex()] = buildPlayerShipFromDesign(design);
}

function getActiveBuilderSection(): ShipBuilderSection {
  return builderSections[builderSectionIndex] ?? "color";
}

function isShipCosmeticSlotId(section: ShipBuilderSection): section is ShipCosmeticSlotId {
  return section === "nose" || section === "leftWing" || section === "rightWing" || section === "tail" || section === "interior";
}

function isShipDesignModuleSlotId(section: ShipBuilderSection): section is ShipDesignModuleSlotId {
  return section === "gun" || section === "wings" || section === "engine" || section === "core" || section === "defense" || section === "support";
}

function moveBuilderSection(offset: number) {
  builderSectionIndex = (builderSectionIndex + offset + builderSections.length) % builderSections.length;
}

function moveBuilderSlot(offset: number) {
  moveBuilderSection(offset);
}

function cycleBuilderPaint(offset: number) {
  const activeDesign = getActiveBuilderShip().design;
  const currentIndex = Math.max(0, shipPaintSchemes.findIndex((paint) => paint.id === activeDesign.paintId));
  const nextPaint = shipPaintSchemes[(currentIndex + offset + shipPaintSchemes.length) % shipPaintSchemes.length]!;
  setActiveBuilderDesign({ ...activeDesign, paintId: nextPaint.id });
}

function cycleBuilderCallsign(offset: number) {
  const activeDesign = getActiveBuilderShip().design;
  const currentIndex = Math.max(0, shipCallsigns.findIndex((callsign) => callsign === activeDesign.name));
  const nextName = shipCallsigns[(currentIndex + offset + shipCallsigns.length) % shipCallsigns.length]!;
  setActiveBuilderDesign({ ...activeDesign, name: nextName });
}

function cycleBuilderModule(offset: number) {
  const activeSection = getActiveBuilderSection();
  if (!isShipDesignModuleSlotId(activeSection)) return;
  const activeDesign = getActiveBuilderShip().design;
  const options = [undefined, ...getModulesForDesignSlot(activeSection)];
  const selectedModule = getSelectedDesignModule(activeDesign, activeSection);
  const currentIndex = Math.max(0, options.findIndex((module) => module?.id === selectedModule?.id));
  const nextModule = options[(currentIndex + offset + options.length) % options.length];
  const modules = { ...activeDesign.modules };
  if (nextModule) {
    modules[activeSection] = nextModule.id;
  } else {
    delete modules[activeSection];
  }
  setActiveBuilderDesign({ ...activeDesign, modules });
}

function cycleBuilderCosmetic(offset: number) {
  const activeSection = getActiveBuilderSection();
  if (!isShipCosmeticSlotId(activeSection)) return;
  const activeDesign = getActiveBuilderShip().design;
  const options = getCosmeticPartsForSlot(activeSection);
  const selectedPart = getSelectedCosmeticPart(activeDesign, activeSection);
  const currentIndex = Math.max(0, options.findIndex((part) => part.id === selectedPart.id));
  const nextPart = options[(currentIndex + offset + options.length) % options.length]!;
  const cosmetics = { ...(activeDesign.cosmetics ?? {}) };
  cosmetics[activeSection] = nextPart.id;
  setActiveBuilderDesign({ ...activeDesign, cosmetics });
}

function changeBuilderOption(offset: number) {
  const activeSection = getActiveBuilderSection();
  if (activeSection === "color") {
    cycleBuilderPaint(offset);
  } else if (activeSection === "callsign") {
    cycleBuilderCallsign(offset);
  } else if (isShipCosmeticSlotId(activeSection)) {
    cycleBuilderCosmetic(offset);
  } else {
    cycleBuilderModule(offset);
  }
}

function resetActiveBuilderDesign() {
  const activeDesign = getActiveBuilderShip().design;
  setActiveBuilderDesign(buildDefaultShipDesign(activeDesign.classId));
  builderSlotIndex = 0;
  builderPresetIndex = 0;
}

function cycleBuilderPreset(offset: number) {
  builderPresetIndex = (builderPresetIndex + offset + shipDesignPresets.length) % shipDesignPresets.length;
  const preset = cloneShipDesign(shipDesignPresets[builderPresetIndex]!);
  const classIndex = Math.max(0, shipClassConfigs.findIndex((config) => config.id === preset.classId));
  setActiveSelectionIndex(classIndex);
  setActiveBuilderDesign(preset);
  builderSlotIndex = 0;
}

function toggleSelectedPlayerCount() {
  if (selectedPlayerCount === 1) {
    selectedPlayerCount = 2;
    selectedLoadoutSlot = "com";
    if (selectedComShipIndex === selectedShipIndex) {
      selectedComShipIndex = (selectedShipIndex + 1) % playerShips.length;
    }
  } else {
    selectedPlayerCount = 1;
    selectedLoadoutSlot = "p1";
  }
}

function toggleSelectedLoadoutSlot() {
  if (selectedPlayerCount === 1) return;
  selectedLoadoutSlot = selectedLoadoutSlot === "p1" ? "com" : "p1";
}

function renderSelectionModeLine(width: number): string {
  const gameMode = `${rgb("GAME", isTurboMode() ? theme.amber : theme.cyan, colorEnabled)} ${selectedGameMode.toUpperCase()}`;
  const mode = selectedPlayerCount === 2
    ? `${rgb("PILOT", theme.cyan, colorEnabled)} 2P + COM`
    : `${rgb("PILOT", theme.cyan, colorEnabled)} 1P SOLO`;
  const editing = selectedPlayerCount === 2
    ? `${rgb("EDIT", theme.amber, colorEnabled)} ${selectedLoadoutSlot === "com" ? "COM-02" : "P1"}`
    : `${rgb("EDIT", theme.amber, colorEnabled)} P1`;
  const p1Ship = playerShips[selectedShipIndex]?.name ?? "Unknown";
  const comShip = selectedPlayerCount === 2 ? `  ${rgb("COM", theme.amber, colorEnabled)} ${playerShips[selectedComShipIndex]?.name ?? "Unknown"}` : "";
  const loadoutKeys = selectedPlayerCount === 2 ? "  C: MODE  E: SLOT" : "  C: MODE";
  return fitAnsi(joinAligned(`${gameMode}  ${mode}  ${editing}${rgb(loadoutKeys, theme.muted, colorEnabled)}`, `${rgb("P1", theme.green, colorEnabled)} ${p1Ship}${comShip}`, width, 3), width);
}

function centerFit(text: string, width: number): string {
  return fitAnsi(centerText(visibleLength(text) > width ? fitAnsi(text, width) : text, width), width);
}

function renderShipSelectCard(ship: PlayerShip, index: number, width: number): string {
  const isP1Selected = index === selectedShipIndex;
  const isComSelected = selectedPlayerCount === 2 && index === selectedComShipIndex;
  const isActiveSelection =
    (selectedLoadoutSlot === "p1" && isP1Selected) ||
    (selectedLoadoutSlot === "com" && isComSelected);
  const accent = isActiveSelection ? theme.cyan : isComSelected ? theme.amber : isP1Selected ? theme.green : theme.border;
  
  const titleParts = [
    isP1Selected ? "P1" : "",
    isComSelected ? "COM" : "",
    isActiveSelection ? "EDITABLE" : ""
  ].filter(Boolean);

  const bodyWidth = Math.max(1, width - 2);
  const spriteRows = renderSprite(ship.variant, colorEnabled, tick % 2).map((line) => centerFit(line, bodyWidth));
  const stats = ship.variant.stats;
  
  const flashColor = tick % 10 < 5 ? theme.cyan : theme.white;
  const footerText = isActiveSelection ? "⚡ SPACE TO EDIT ⚡" : "A/D TO SELECT";

  const rows = [
    ...spriteRows,
    "",
    centerFit(bold(rgb(ship.name, isActiveSelection ? theme.cyan : theme.white, colorEnabled), colorEnabled), bodyWidth),
    centerFit(rgb(ship.weapon, isActiveSelection ? theme.amber : theme.muted, colorEnabled), bodyWidth),
    "",
    fitAnsi(`${rgb("HULL", theme.green, colorEnabled)} ${String(stats.hull).padStart(3)}  ${rgb("SHLD", theme.blue, colorEnabled)} ${String(stats.shield).padStart(3)}`, bodyWidth),
    fitAnsi(`${rgb("SPD", theme.amber, colorEnabled)}  ${String(stats.speed).padStart(3)}  ${rgb("DMG", theme.red, colorEnabled)}  ${String(stats.projectileDamage).padStart(3)}`, bodyWidth),
    "",
    centerFit(bold(rgb(footerText, isActiveSelection ? flashColor : theme.muted, colorEnabled), colorEnabled), bodyWidth)
  ];

  return box(titleParts.length > 0 ? ` ${titleParts.join(" ")} ` : "", rows, {
    width,
    height: 14,
    borderStyle: isP1Selected || isComSelected ? "arcade" : "single",
    accent,
    color: colorEnabled,
    paddingX: 0,
    titleAlign: "center"
  });
}

function renderShipSelectScreen(): string {
  const innerWidth = Math.max(1, PLAYFIELD_WIDTH - 4);
  const cardWidth = Math.max(18, Math.floor((innerWidth - 3) / playerShips.length));
  const cards = playerShips.map((ship, index) => renderShipSelectCard(ship, index, cardWidth));
  const cardBlock = hstack(cards, 1);
  
  const rows = [
    centerFit(bold(rgb("SELECT YOUR STARFIGHTER", theme.amber, colorEnabled), colorEnabled), innerWidth),
    centerFit(
      rgb("★ Press ", theme.text, colorEnabled) +
      bold(rgb("SPACEBAR", theme.cyan, colorEnabled), colorEnabled) +
      rgb(" or ", theme.text, colorEnabled) +
      bold(rgb("TAB", theme.cyan, colorEnabled), colorEnabled) +
      rgb(" to customize components, modules & cosmetics! ★", theme.text, colorEnabled),
      innerWidth
    ),
    "",
    ...cardBlock.split("\n").map((line) => centerFit(line, innerWidth)),
    "",
    centerFit(
      bold(
        rgb("SPACE/TAB", theme.cyan, colorEnabled) + rgb(" Customize  ", theme.text, colorEnabled) +
        rgb("A/D", theme.cyan, colorEnabled) + rgb(" Select  ", theme.text, colorEnabled) +
        rgb("ENTER", theme.green, colorEnabled) + rgb(" Launch  ", theme.text, colorEnabled) +
        rgb("C", theme.amber, colorEnabled) + rgb(" Mode  ", theme.text, colorEnabled) +
        rgb("E", theme.amber, colorEnabled) + rgb(" Swap P1/COM", theme.text, colorEnabled),
        colorEnabled
      ),
      innerWidth
    ),
    centerFit(rgb("Press R to reset the highlighted ship back to stock.", theme.muted, colorEnabled), innerWidth)
  ];

  return box(" SHIP SELECT ", rows, {
    width: PLAYFIELD_WIDTH,
    height: 23,
    borderStyle: "arcade",
    accent: theme.cyan,
    color: colorEnabled,
    paddingX: 1,
    titleAlign: "left"
  });
}

// Complete render wrapper
function render() {
  if (closed) return;

  const termWidth = process.stdout.columns || MIN_PLAYFIELD_WIDTH;
  const termHeight = process.stdout.rows || MIN_VIEWPORT_HEIGHT;
  syncViewportSize();

  const leftMargin = Math.max(0, Math.floor((termWidth - PLAYFIELD_WIDTH) / 2));
  const marginStr = " ".repeat(leftMargin);

  let frameString = "";

  if (screen === "splash") {
    const splashBox = renderSplashScreen();
    frameString = splashBox.split("\n").map(l => marginStr + l).join("\n");
  } else if (screen === "mode") {
    const modeBox = renderModeSelectScreen();
    if (shakeIntensity > 0) {
      shakeIntensity = Math.max(0, shakeIntensity - 0.6);
    }
    frameString = modeBox.split("\n").map(l => marginStr + l).join("\n");
  } else if (screen === "start") {
    const modeLine = renderSelectionModeLine(PLAYFIELD_WIDTH);
    if (startScreenMode === "select") {
      frameString = [modeLine, renderShipSelectScreen()].join("\n").split("\n").map(l => marginStr + l).join("\n");
    } else {
      const activeBuilderShip = getActiveBuilderShip();
      const builderBox = renderShipDesignBuilder(PLAYFIELD_WIDTH, 23, {
        design: activeBuilderShip.design,
        activeSection: getActiveBuilderSection(),
        activeSlotIndex: builderSlotIndex,
        tick,
        showControls: true
      }, colorEnabled);
      frameString = [modeLine, builderBox].join("\n").split("\n").map(l => marginStr + l).join("\n");
    }
  } else if (screen === "playing") {
    const hudLines = renderArcadeHud(PLAYFIELD_WIDTH, buildDemoHudState(), colorEnabled).split("\n");
    const supportLine = renderGameplaySupportLine(PLAYFIELD_WIDTH);
    if (supportLine) hudLines.push(supportLine);
    while (hudLines.length < GAMEPLAY_HUD_HEIGHT) hudLines.push("");
    const hud = hudLines.join("\n");

    const boardLines = renderBoard();
    const boardBox = box(isTurboMode() ? " TURBO V2 DANGER RUN " : " RETRO ARCADE INVASION ", boardLines, {
      width: PLAYFIELD_WIDTH,
      height: BOARD_HEIGHT + 2,
      borderStyle: isTurboMode() ? "cyberpunk" : "arcade",
      accent: flashTicks > 0 ? theme.red : isTurboMode() ? theme.amber : theme.cyan,
      color: colorEnabled
    });

    const turboControls = isTurboMode() ? "  •  W toward gate / S away  •  Shift+A/D: Rotate  •  E: Engine  •  X: Special" : "";
    const footerCopy = activeComShip
      ? `A/D or ◀/▶: Move Starfighter${turboControls}  •  SPACEBAR: Shoot Laser  •  COM-02: Auto  •  Q: Abort`
      : `A/D or ◀/▶: Move Starfighter${turboControls}  •  SPACEBAR: Shoot Laser  •  Q: Abort`;
    const footerText = dim(rgb(footerCopy, theme.muted, colorEnabled), colorEnabled);
    const footerLine = fitAnsi(footerText, PLAYFIELD_WIDTH);

    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0) {
      const motionIntensity = isTurboMode() ? Math.min(2, shakeIntensity * 0.32) : shakeIntensity;
      shakeX = Math.floor((Math.random() - 0.5) * motionIntensity * 2);
      shakeY = Math.floor((Math.random() - 0.5) * motionIntensity);
      shakeIntensity = Math.max(0, shakeIntensity - 0.5);
    }

    const finalMargin = " ".repeat(Math.max(0, leftMargin + (leftMargin > 0 ? shakeX : 0)));
    const layoutBlocks = [
      hud,
      boardBox,
      footerLine
    ];
    const layout = layoutBlocks.join("\n");
    const shakenLayout = layout.split("\n").map(l => finalMargin + l).join("\n");

    const layoutHeight = layout.split("\n").length;
    const verticalBasePadding = Math.max(0, Math.floor((termHeight - layoutHeight) / 2));
    const verticalPadding = "\n".repeat(Math.max(0, verticalBasePadding + (verticalBasePadding > 0 ? shakeY : 0)));
    frameString = verticalPadding + shakenLayout;

  } else if (screen === "gameover") {
    const goBox = renderMissionResult("gameover");
    frameString = goBox.split("\n").map(l => marginStr + l).join("\n");
  } else if (screen === "victory") {
    const vicBox = renderMissionResult("victory");
    frameString = vicBox.split("\n").map(l => marginStr + l).join("\n");
  }

  if (!frameFitsViewport(frameString, termWidth, termHeight)) {
    frameString = renderViewportFallback(termWidth, termHeight);
  }

  process.stdout.write(`${terminal.frameStart}${frameString}${terminal.frameEnd}`);
}

// Shutdown and reset terminal settings
function cleanupAndExit() {
  if (closed) return;
  closed = true;
  clearInterval(gameInterval);
  process.stdin.off("data", handleInput);
  process.stdout.off("resize", handleResize);
  process.stdout.write(terminal.exitLiveScreen);
  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.exit(0);
}

// Restart action
function restartGame(result: "gameover" | "victory") {
  const comShip = activeComShip ?? (selectedPlayerCount === 2 ? playerShips[selectedComShipIndex]! : null);
  if (result === "victory") {
    startGame(activeShip, { preserveScore: true, advanceDifficulty: true, comShip });
    return;
  }

  startGame(activeShip, { comShip });
}

// Input parsing dispatcher
function isShiftLeftInput(keyStr: string): boolean {
  return keyStr === "A" || keyStr === "\u001b[1;2D";
}

function isShiftRightInput(keyStr: string): boolean {
  return keyStr === "D" || keyStr === "\u001b[1;2C";
}

const handleInput = (key: Buffer | string) => {
  const keyStr = String(key);

  if (isIgnoredTerminalInput(keyStr)) {
    return;
  }

  if (keyStr === "q" || keyStr === "\u0003") {
    cleanupAndExit();
    return;
  }

  if (screen === "splash") {
    if (keyStr === "\r" || keyStr === "\n" || keyStr === " ") {
      screen = "mode";
      menuAnimationTick = 0;
      applyGameModeDimensions();
      render();
    }
  } else if (screen === "mode") {
    if (keyStr === "a" || keyStr === "\u001b[D") {
      cycleSelectedGameMode(-1);
      render();
    } else if (keyStr === "d" || keyStr === "\u001b[C") {
      cycleSelectedGameMode(1);
      render();
    } else if (keyStr === "w" || keyStr === "\u001b[A" || keyStr === "s" || keyStr === "\u001b[B") {
      cycleSelectedGameMode(1);
      render();
    } else if (keyStr === "\r" || keyStr === "\n" || keyStr === " ") {
      screen = "start";
      startScreenMode = "select";
      builderSectionIndex = 0;
      builderSlotIndex = 0;
      render();
    }
  } else if (screen === "start") {
    if (startScreenMode === "select" && (keyStr === "a" || keyStr === "\u001b[D")) {
      setActiveSelectionIndex(getActiveSelectionIndex() - 1);
      render();
    } else if (startScreenMode === "select" && (keyStr === "d" || keyStr === "\u001b[C")) {
      setActiveSelectionIndex(getActiveSelectionIndex() + 1);
      render();
    } else if (startScreenMode === "customize" && (keyStr === "a" || keyStr === "\u001b[D")) {
      changeBuilderOption(-1);
      render();
    } else if (startScreenMode === "customize" && (keyStr === "d" || keyStr === "\u001b[C")) {
      changeBuilderOption(1);
      render();
    } else if (startScreenMode === "customize" && (keyStr === "w" || keyStr === "\u001b[A")) {
      moveBuilderSection(-1);
      render();
    } else if (startScreenMode === "customize" && (keyStr === "s" || keyStr === "\u001b[B")) {
      moveBuilderSection(1);
      render();
    } else if (keyStr === "c" || keyStr === "C") {
      toggleSelectedPlayerCount();
      render();
    } else if (keyStr === "e" || keyStr === "E") {
      toggleSelectedLoadoutSlot();
      render();
    } else if (startScreenMode === "customize" && (keyStr === "n" || keyStr === "N")) {
      cycleBuilderPreset(1);
      render();
    } else if (keyStr === "r" || keyStr === "R") {
      resetActiveBuilderDesign();
      render();
    } else if (startScreenMode === "customize" && keyStr === "\t") {
      moveBuilderSection(1);
      render();
    } else if (keyStr === " " || (startScreenMode === "select" && keyStr === "\t")) {
      startScreenMode = startScreenMode === "select" ? "customize" : "select";
      render();
    } else if (keyStr === "\r" || keyStr === "\n") {
      startGame(playerShips[selectedShipIndex]!, {
        comShip: selectedPlayerCount === 2 ? playerShips[selectedComShipIndex]! : null
      });
      render();
    }
  } else if (screen === "playing") {
    let handled = false;

    // 1. Shift + arrow or Shift + A/D for rotation (Turbo Mode only)
    if (isTurboMode()) {
      if (keyStr.includes("A") || keyStr.includes("\u001b[1;2D")) {
        rotateTurboPlayer(-0.45);
        handled = true;
      }
      if (keyStr.includes("D") || keyStr.includes("\u001b[1;2C")) {
        rotateTurboPlayer(0.45);
        handled = true;
      }
    }

    // 2. Parse combined directional movements
    let moveX = 0;
    let moveY = 0;

    if (keyStr.includes("a") || keyStr.includes("\u001b[D")) {
      moveX = -2;
    } else if (keyStr.includes("d") || keyStr.includes("\u001b[C")) {
      moveX = 2;
    }

    if (isTurboMode()) {
      if (keyStr.includes("w") || keyStr.includes("\u001b[A")) {
        moveY = -2;
      } else if (keyStr.includes("s") || keyStr.includes("\u001b[B")) {
        moveY = 2;
      }
    }

    if (moveX !== 0 || moveY !== 0) {
      movePlayer(moveX, moveY);
      handled = true;
    }

    // 3. Actions: Shoot, Special, Engine Boost
    if (keyStr.includes(" ")) {
      playerShoot();
      handled = true;
    }
    if (keyStr.includes("x") || keyStr.includes("X")) {
      fireTurboSpecial();
      handled = true;
    }
    if (isTurboMode() && (keyStr.includes("e") || keyStr.includes("E"))) {
      triggerTurboEngine();
      handled = true;
    }

    if (handled) {
      render();
    }
  } else if (screen === "gameover" || screen === "victory") {
    if (keyStr === "r" || keyStr === "R") {
      restartGame(screen);
      render();
    }
  }
};

const handleResize = () => {
  syncViewportSize();
  render();
};

function isIgnoredTerminalInput(input: string): boolean {
  if (
    input.includes("\u001b[D") ||
    input.includes("\u001b[C") ||
    input.includes("\u001b[A") ||
    input.includes("\u001b[B")
  ) {
    return false;
  }
  if (/\u001b\[1;2[ABCD]/.test(input)) return false;

  if (input === "\u001b[I" || input === "\u001b[O") return true;
  if (/^\u001b\[(?:<\d+;\d+;\d+[mM]|M)/.test(input)) return true;
  if (/^\u001b\][\s\S]*(?:\u0007|\u001b\\)?$/.test(input)) return true;

  return input.includes("\u001b");
}

// Start Main Dispatcher Loop
function main() {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    process.stderr.write("Error: Playable demo requires an interactive TTY terminal environment.\n");
    process.exit(1);
  }

  syncViewportSize();
  process.stdout.write(terminal.disableMouse);
  process.stdout.write(terminal.enterLiveScreen);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleInput);
  process.stdout.on("resize", handleResize);

  initStars();

  gameInterval = setInterval(() => {
    if (screen === "playing") {
      updateGame();
      render();
    } else if (screen === "mode" || screen === "start") {
      tick++;
      if (menuAnimationTick < 50) menuAnimationTick++;
      if (flashTicks > 0) flashTicks--;
      if (statusMessageTicks > 0) statusMessageTicks--;
      if (tick % 3 === 0) render();
    }
  }, FRAME_INTERVAL);

  render();
}

// Graceful signal catching
process.on("SIGINT", cleanupAndExit);
process.on("SIGTERM", cleanupAndExit);

main();
