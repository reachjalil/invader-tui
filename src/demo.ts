import { box, hstack } from "./tui/layout.js";
import { rgb, theme, bold, fitAnsi, visibleLength, formatNumber, dim, type Rgb } from "./tui/ansi.js";
import { enemySpecies, shipFamily } from "./assets/index.js";
import { renderArcadeHud, renderBar, type ArcadeHudState } from "./render/widgets.js";

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

type Enemy = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  variant: any;
  shootCooldown: number;
  isBoss?: boolean;
  bossPattern?: "monarch" | "titan" | "leviathan";
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

type CollectibleKind = "star" | "bonus" | "shield";

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
  variant: any;
  hp: number;
  shield: number;
  speed: number;
  cooldown: number;
  weapon: string;
  desc: string;
};

type StartGameOptions = {
  preserveScore?: boolean;
  advanceDifficulty?: boolean;
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
const MIN_BOARD_WIDTH = 83;
const MIN_BOARD_HEIGHT = 18;
const MIN_PLAYFIELD_WIDTH = MIN_BOARD_WIDTH + 2;
const MIN_VIEWPORT_HEIGHT = 24;
const GAMEPLAY_HUD_HEIGHT = 4;
let BOARD_WIDTH = MIN_BOARD_WIDTH;
let BOARD_HEIGHT = MIN_BOARD_HEIGHT;
let PLAYFIELD_WIDTH = MIN_PLAYFIELD_WIDTH;
const SPLASH_HEIGHT = 18;
const FRAME_INTERVAL = 40; // 25 FPS
const MAX_SHIP_LEVEL = 3;
const BASE_UPGRADE_POINTS = 500;
const SHIELD_POWER_TICKS = 600;

// Player ships definitions derived from assets with custom weapons/stats
const playerShips: PlayerShip[] = [
  {
    classId: "bar",
    name: "Bar Fighter",
    variant: shipFamily.variants.find(v => v.id === "ship-bar-chassis-l1") || shipFamily.variants[0]!,
    hp: 40,
    shield: 20,
    speed: 2,
    cooldown: 6,
    weapon: "Single Laser",
    desc: "Balanced starter frame. Upgrades into paired beam cannons."
  },
  {
    classId: "delta",
    name: "Delta Scout",
    variant: shipFamily.variants.find(v => v.id === "ship-delta-chassis-l1") || shipFamily.variants[3]!,
    hp: 30,
    shield: 35,
    speed: 2.25,
    cooldown: 5,
    weapon: "Pulse Bolt",
    desc: "Fast scout frame. Upgrades into rapid tactical fire."
  },
  {
    classId: "ring",
    name: "Ring Vanguard",
    variant: shipFamily.variants.find(v => v.id === "ship-ring-chassis-l1") || shipFamily.variants[6]!,
    hp: 35,
    shield: 30,
    speed: 2,
    cooldown: 7,
    weapon: "Core Orb",
    desc: "Energy saucer frame. Upgrades into heavy plasma control."
  },
  {
    classId: "wedge",
    name: "Wedge Titan",
    variant: shipFamily.variants.find(v => v.id === "ship-wedge-chassis-l1") || shipFamily.variants[9]!,
    hp: 50,
    shield: 15,
    speed: 1.75,
    cooldown: 7,
    weapon: "Piercer",
    desc: "Armored striker frame. Upgrades into spread-fire armor."
  }
];

// Terminal controls escape sequences
const terminal = {
  disableMouse: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l",
  enterLiveScreen: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[2J\x1b[H",
  exitLiveScreen: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[?25h\x1b[?1049l",
  frameStart: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[H\x1b[2J",
  frameEnd: "\x1b[J"
} as const;

// Global Game State
let screen: "splash" | "start" | "playing" | "gameover" | "victory" = "splash";
let selectedShipIndex = 0;
let score = 0;
let highScore = 15000;
let wave = 1;
let playerX = Math.floor(BOARD_WIDTH / 2) - 2;
let playerHp = 100;
let playerMaxHp = 100;
let playerShield = 50;
let playerMaxShield = 50;
let playerSpeed = 1.5;
let playerShootCooldown = 0;
let activeShip = playerShips[0]!;

let enemies: Enemy[] = [];
let bullets: Bullet[] = [];
let particles: Particle[] = [];
let stars: Star[] = [];
let collectibles: Collectible[] = [];
let tick = 0;
let shotsFired = 0;
let shotsHit = 0;
let enemiesDestroyed = 0;
let collectibleId = 0;
let playerLevel = 1;
let upgradePoints = 0;
let shieldPowerTicks = 0;
let statusMessage = "READY";
let statusMessageTicks = 0;
let gameOverReason = "SHIP DESTROYED";
let campaignLoop = 1;

let enemyDirection = 1;
let enemyMoveTimer = 0;
let enemyBaseMoveCooldown = 20; // in ticks

let shakeIntensity = 0;
let flashTicks = 0;
const colorEnabled = true;
let closed = false;
let gameInterval: NodeJS.Timeout;

function getStarCount(): number {
  return Math.max(35, Math.floor((BOARD_WIDTH * BOARD_HEIGHT) / 45));
}

function normalizeViewportState() {
  const pWidth = activeShip.variant.sprite.width;
  playerX = Math.max(1, Math.min(BOARD_WIDTH - pWidth - 1, playerX));

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
    enemy.x = Math.max(1, Math.min(BOARD_WIDTH - enemy.width - 1, enemy.x));
    enemy.y = Math.max(0, Math.min(BOARD_HEIGHT - enemy.height - 1, enemy.y));
  }
}

function syncViewportSize() {
  normalizeViewportState();
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
  if (waveNum === 1) return 18;
  if (waveNum === 2) return 15;
  return 5;
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

function getShipVariant(classId: string, level: number) {
  return shipFamily.variants.find((variant) => variant.id === `ship-${classId}-chassis-l${level}`) ?? activeShip.variant;
}

function getWeaponName(classId: string, level: number): string {
  const names: Record<string, string[]> = {
    bar: ["Single Laser", "Double Laser", "Quad Lance"],
    delta: ["Pulse Bolt", "Rapid Blaster", "Twin Needler"],
    ring: ["Core Orb", "Heavy Core", "Singularity Shot"],
    wedge: ["Piercer", "Triple Spread", "Armor Storm"]
  };
  return names[classId]?.[level - 1] ?? activeShip.weapon;
}

function setStatus(message: string, ticks = 90) {
  statusMessage = message;
  statusMessageTicks = ticks;
}

function applyShipLevel(heal = false) {
  const variant = getShipVariant(activeShip.classId, playerLevel);
  const hpRatio = playerMaxHp > 0 ? playerHp / playerMaxHp : 1;
  activeShip.variant = variant;
  activeShip.weapon = getWeaponName(activeShip.classId, playerLevel);
  activeShip.cooldown = Math.max(3, 10 - (variant.stats.fireRate ?? 5));
  activeShip.speed = Math.max(1, variant.stats.speed / 4);
  activeShip.hp = variant.stats.hull;
  activeShip.shield = variant.stats.shield;

  playerMaxHp = variant.stats.hull;
  playerMaxShield = variant.stats.shield;
  playerSpeed = activeShip.speed;
  playerHp = heal ? Math.min(playerMaxHp, Math.max(playerHp, Math.round(playerMaxHp * hpRatio)) + 20) : playerMaxHp;
  playerShield = Math.min(playerShield, playerMaxShield);
}

function addUpgradePoints(value: number) {
  upgradePoints += value;
  let next = getNextUpgradeAt();
  while (next !== null && upgradePoints >= next) {
    upgradePoints -= next;
    playerLevel++;
    applyShipLevel(true);
    shakeIntensity = 3;
    setStatus(`LEVEL ${playerLevel} ${activeShip.weapon.toUpperCase()}`, 140);
    spawnExplosion(playerX + activeShip.variant.sprite.width / 2, BOARD_HEIGHT - 3, toneColors[activeShip.variant.tone as Tone] ?? theme.cyan, 28);
    next = getNextUpgradeAt();
  }
}

function activateShield() {
  playerShield = playerMaxShield;
  shieldPowerTicks = SHIELD_POWER_TICKS;
  setStatus("SHIELD ONLINE", 120);
  spawnExplosion(playerX + activeShip.variant.sprite.width / 2, BOARD_HEIGHT - 3, theme.blue, 18);
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
    enemiesRemaining: enemies.length,
    hp: playerHp,
    maxHp: playerMaxHp,
    shield: playerShield,
    maxShield: playerMaxShield,
    shieldActive: playerShield > 0 || shieldPowerTicks > 0
  };
  if (boss) {
    hudState.boss = { name: boss.name.replace(" (BOSS)", ""), hp: boss.hp, maxHp: boss.maxHp };
  }
  return hudState;
}

// Generate Wave
function startWave(waveNum: number) {
  enemies = [];
  bullets = [];
  particles = [];
  collectibles = [];
  enemyDirection = 1;
  setStatus(waveNum === 3 ? "BOSS WARNING" : `WAVE ${waveNum}`, 120);

  if (waveNum === 1) {
    const spawnWidth = 6 * 8;
    const startX = Math.floor((BOARD_WIDTH - spawnWidth) / 2);
    
    const variants = [
      { type: "enemy-spore-pod-l1", hp: 30, score: 80 },
      { type: "enemy-tick-drone-l1", hp: 18, score: 120 },
      { type: "enemy-mite-grunt-l1", hp: 24, score: 100 }
    ];

    for (let r = 0; r < 3; r++) {
      const spec = variants[r]!;
      const variantAsset = enemySpecies.variants.find(v => v.id === spec.type) || enemySpecies.variants[0]!;
      
      for (let c = 0; c < 6; c++) {
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
    enemyBaseMoveCooldown = 22;
  } else if (waveNum === 2) {
    const spawnWidth = 5 * 10;
    const startX = Math.floor((BOARD_WIDTH - spawnWidth) / 2);
    
    const variants = [
      { type: "enemy-warden-sentinel-l2", hp: 55, score: 300 },
      { type: "enemy-stinger-elite-l2", hp: 42, score: 280 },
      { type: "enemy-mite-hunter-l2", hp: 48, score: 250 }
    ];

    for (let r = 0; r < 3; r++) {
      const spec = variants[r]!;
      const variantAsset = enemySpecies.variants.find(v => v.id === spec.type) || enemySpecies.variants[0]!;
      
      for (let c = 0; c < 5; c++) {
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
    enemyBaseMoveCooldown = 18;
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
    enemyBaseMoveCooldown = 15;
  }

  applyCampaignDifficultyToWave();
}

// Start Game with Selected Ship
function startGame(ship: PlayerShip, options: StartGameOptions = {}) {
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
  playerShield = 0;
  applyShipLevel(false);
  playerX = Math.floor(BOARD_WIDTH / 2) - Math.floor(activeShip.variant.sprite.width / 2);
  playerShootCooldown = 0;
  shotsFired = 0;
  shotsHit = 0;
  enemiesDestroyed = 0;
  collectibleId = 0;
  gameOverReason = "SHIP DESTROYED";
  setStatus(campaignLoop > 1 ? `LOOP ${campaignLoop} THREAT LEVEL ${Math.round(getDifficultyMultiplier() * 100)}%` : "PLAYER-01 READY", 140);
  
  initStars();
  startWave(wave);
  screen = "playing";
}

// Helper to draw sprites inside the grid
function drawSprite(grid: Cell[][], x: number, y: number, variant: any, currentTick: number) {
  const animated = variant as any;
  const frames = animated.idle && animated.idle.length > 0 ? animated.idle : [variant.sprite];
  const frame = frames[Math.floor(currentTick / 6) % frames.length] || variant.sprite;
  const color = toneColors[variant.tone as keyof typeof toneColors] || theme.text;
  
  for (let r = 0; r < frame.height; r++) {
    const targetY = Math.floor(y + r);
    if (targetY < 0 || targetY >= grid.length) continue;
    const line = frame.lines[r] || "";
    const chars = line.split("");
    for (let c = 0; c < chars.length; c++) {
      const targetX = Math.floor(x + c);
      if (targetX < 0 || targetX >= BOARD_WIDTH) continue;
      const char = chars[c] || " ";
      if (char !== " " && char !== "⠀") { // Transparent background
        const row = grid[targetY];
        if (row) {
          row[targetX] = { char, color, bold: true };
        }
      }
    }
  }
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

function getSpriteMuzzleX(spriteLeft: number, spriteWidth: number): number {
  return Math.floor(spriteLeft) + Math.floor((spriteWidth - 1) / 2);
}

// Player shoot
function playerShoot() {
  if (playerShootCooldown > 0) return;
  playerShootCooldown = activeShip.cooldown;
  const bulletCountBefore = bullets.length;

  const pY = BOARD_HEIGHT - 3;
  const pWidth = activeShip.variant.sprite.width;
  const muzzleX = getSpriteMuzzleX(playerX, pWidth);
  const leftMuzzleX = Math.max(Math.floor(playerX), muzzleX - 1);
  const rightMuzzleX = Math.min(Math.floor(playerX) + pWidth - 1, muzzleX + 1);
  const pairedMuzzleX = Math.min(Math.floor(playerX) + pWidth - 1, muzzleX + 1);
  const baseDamage = activeShip.variant.stats?.projectileDamage ?? 10;
  const fire = (x: number, y: number, vx: number, vy: number, char: string, color: Rgb, damage = baseDamage) => {
    bullets.push({ x, y, vx, vy, color, char, isEnemy: false, damage });
  };

  if (activeShip.classId === "bar") {
    if (playerLevel === 1) {
      fire(muzzleX, pY - 1, 0, -1.05, "║", theme.cyan);
    } else if (playerLevel === 2) {
      fire(muzzleX, pY - 1, 0, -1.1, "║", theme.cyan, baseDamage * 0.9);
      fire(pairedMuzzleX, pY - 1, 0, -1.1, "║", theme.cyan, baseDamage * 0.9);
    } else {
      fire(leftMuzzleX, pY - 1, -0.1, -1.15, "║", theme.cyan, baseDamage * 0.8);
      fire(muzzleX, pY - 1, 0, -1.25, "┃", theme.white, baseDamage);
      fire(pairedMuzzleX, pY - 1, 0, -1.25, "┃", theme.white, baseDamage);
      fire(rightMuzzleX, pY - 1, 0.1, -1.15, "║", theme.cyan, baseDamage * 0.8);
    }
  } else if (activeShip.classId === "delta") {
    fire(muzzleX, pY - 1, 0, -1.35, "┿", theme.blue, baseDamage);
    if (playerLevel >= 2) {
      fire(leftMuzzleX, pY - 1, -0.15, -1.15, "╱", theme.blue, baseDamage * 0.65);
      fire(rightMuzzleX, pY - 1, 0.15, -1.15, "╲", theme.blue, baseDamage * 0.65);
    }
    if (playerLevel >= 3) {
      fire(muzzleX - 1, pY - 1, -0.25, -1.25, "⟋", theme.white, baseDamage * 0.6);
      fire(muzzleX + 1, pY - 1, 0.25, -1.25, "⟍", theme.white, baseDamage * 0.6);
    }
  } else if (activeShip.classId === "ring") {
    fire(muzzleX, pY - 1, 0, playerLevel >= 3 ? -0.8 : -0.7, "❂", theme.purple, baseDamage * 1.25);
    if (playerLevel >= 2) {
      fire(leftMuzzleX, pY - 1, -0.2, -0.85, "°", theme.purple, baseDamage * 0.45);
      fire(rightMuzzleX, pY - 1, 0.2, -0.85, "°", theme.purple, baseDamage * 0.45);
    }
    if (playerLevel >= 3) {
      fire(muzzleX, pY - 2, 0, -0.55, "●", theme.white, baseDamage * 0.9);
    }
  } else {
    fire(muzzleX, pY - 1, 0, -1, "▲", theme.amber, baseDamage);
    if (playerLevel >= 2) {
      fire(leftMuzzleX, pY - 1, -0.35, -0.9, "◤", theme.amber, baseDamage * 0.65);
      fire(rightMuzzleX, pY - 1, 0.35, -0.9, "◥", theme.amber, baseDamage * 0.65);
    }
    if (playerLevel >= 3) {
      fire(leftMuzzleX, pY - 1, -0.15, -1, "▴", theme.white, baseDamage * 0.7);
      fire(rightMuzzleX, pY - 1, 0.15, -1, "▴", theme.white, baseDamage * 0.7);
    }
  }

  shotsFired += bullets.length - bulletCountBefore;
}

function spawnCollectible(kind: CollectibleKind) {
  const bonusColors = [theme.amber, theme.cyan, theme.purple, theme.lime];
  const color = kind === "star"
    ? theme.white
    : kind === "shield"
      ? theme.blue
      : bonusColors[Math.floor(Math.random() * bonusColors.length)]!;
  const margin = kind === "star" ? 2 : 3;

  collectibles.push({
    id: collectibleId++,
    kind,
    x: margin + Math.floor(Math.random() * Math.max(1, BOARD_WIDTH - margin * 2)),
    y: 0,
    vy: kind === "bonus" ? 0.28 : 0.22,
    char: kind === "star" ? "*" : kind === "shield" ? "◆" : "✦",
    color,
    value: kind === "star" ? 25 : kind === "bonus" ? 150 : 0
  });
}

function maybeSpawnCollectible() {
  if (tick % 42 === 0) spawnCollectible("star");
  if (tick % 240 === 0) spawnCollectible("bonus");
  if (tick % 420 === 0) spawnCollectible("shield");
}

function collectPickup(pickup: Collectible) {
  if (pickup.kind === "shield") {
    activateShield();
    score += 500;
    return;
  }

  score += pickup.value * (pickup.kind === "bonus" ? 12 : 8);
  addUpgradePoints(pickup.value);
  setStatus(pickup.kind === "bonus" ? `BONUS STAR +${pickup.value}` : `STAR +${pickup.value}`, 70);
  spawnExplosion(pickup.x, pickup.y, pickup.color, pickup.kind === "bonus" ? 16 : 8);
}

function updateCollectibles() {
  maybeSpawnCollectible();
  const playerY = BOARD_HEIGHT - 3;
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;

  collectibles.forEach((pickup) => {
    pickup.y += pickup.vy;
  });

  const remaining: Collectible[] = [];
  for (const pickup of collectibles) {
    const cX = Math.floor(pickup.x);
    const cY = Math.floor(pickup.y);
    const pickupRadius = pickup.kind === "star" ? 0 : 1;
    const isCollected =
      cX + pickupRadius >= playerX - 1 &&
      cX - pickupRadius < playerX + pWidth + 1 &&
      cY + pickupRadius >= playerY - 1 &&
      cY - pickupRadius < playerY + pHeight + 1;

    if (isCollected) {
      collectPickup(pickup);
    } else if (pickup.y - pickupRadius < BOARD_HEIGHT) {
      remaining.push(pickup);
    }
  }
  collectibles = remaining;
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

  const playerCenter = playerX + activeShip.variant.sprite.width / 2;
  const aim = Math.max(-0.45, Math.min(0.45, (playerCenter - centerX) / 20));
  pushEnemyBullet(centerX, fromY, aim, 0.72, "◆", 18, theme.purple);
  pushEnemyBullet(enemy.x, fromY, -0.2, 0.5, "·", 10, theme.purple);
  pushEnemyBullet(enemy.x + enemy.width - 1, fromY, 0.2, 0.5, "·", 10, theme.purple);
  setStatus("LEVIATHAN LOCK", 55);
}

// Game physics updates
function updateGame() {
  tick++;

  if (playerShootCooldown > 0) playerShootCooldown--;
  if (flashTicks > 0) flashTicks--;
  if (statusMessageTicks > 0) statusMessageTicks--;
  if (shieldPowerTicks > 0) {
    shieldPowerTicks--;
    if (shieldPowerTicks === 0) {
      playerShield = 0;
      setStatus("SHIELD DOWN", 70);
    }
  }

  stars.forEach(star => {
    star.y += star.speed;
    if (star.y >= BOARD_HEIGHT) {
      star.y = 0;
      star.x = Math.floor(Math.random() * BOARD_WIDTH);
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

  enemyMoveTimer++;
  const activeEnemiesCount = enemies.length;
  const startEnemiesCount = getWaveStartEnemiesCount();
  const enemyMoveCooldown = Math.max(3, Math.floor(enemyBaseMoveCooldown * (activeEnemiesCount / startEnemiesCount)));

  if (enemyMoveTimer >= enemyMoveCooldown) {
    enemyMoveTimer = 0;
    
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

  const playerY = BOARD_HEIGHT - 3;
  if (enemies.some(e => e.y + e.height >= playerY)) {
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
          shakeIntensity = Math.min(3, shakeIntensity + 1);
          spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemyColor, 12);
        }
      }
    });
  });

  // Collision Bullet vs Player
  const pWidth = activeShip.variant.sprite.width;
  const pHeight = activeShip.variant.sprite.height;
  bullets.forEach((bullet, bIdx) => {
    if (!bullet.isEnemy) return;

    const bX = Math.floor(bullet.x);
    const bY = Math.floor(bullet.y);
    if (
      bX >= playerX &&
      bX < playerX + pWidth &&
      bY >= playerY &&
      bY < playerY + pHeight
    ) {
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
    }
  });

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

// Moves player within limits
function movePlayer(offset: number) {
  const pWidth = activeShip.variant.sprite.width;
  playerX = Math.max(1, Math.min(BOARD_WIDTH - pWidth - 1, playerX + offset * playerSpeed));
}

function setBoardCell(grid: Cell[][], x: number, y: number, cell: Cell) {
  const targetX = Math.floor(x);
  const targetY = Math.floor(y);
  if (targetX < 0 || targetX >= BOARD_WIDTH || targetY < 0 || targetY >= BOARD_HEIGHT) return;
  const row = grid[targetY];
  if (row) row[targetX] = cell;
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

// Renders the board content as string[]
function renderBoard(): string[] {
  const grid: Cell[][] = Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => ({ char: " ", color: null }))
  );

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

  collectibles.forEach(pickup => {
    drawCollectible(grid, pickup);
  });

  enemies.forEach(enemy => {
    drawSprite(grid, enemy.x, enemy.y, enemy.variant, tick);
  });

  const pY = BOARD_HEIGHT - 3;
  drawSprite(grid, playerX, pY, activeShip.variant, tick);
  if (playerShield > 0) {
    const shieldY = pY + Math.floor(activeShip.variant.sprite.height / 2);
    const row = grid[shieldY];
    if (row) {
      if (playerX > 0) row[Math.floor(playerX - 1)] = { char: tick % 8 < 4 ? "(" : "<", color: theme.blue, bold: true };
      const rightX = Math.floor(playerX + activeShip.variant.sprite.width);
      if (rightX < BOARD_WIDTH) row[rightX] = { char: tick % 8 < 4 ? ")" : ">", color: theme.blue, bold: true };
    }
  }

  bullets.forEach(bullet => {
    const bX = Math.floor(bullet.x);
    const bY = Math.floor(bullet.y);
    if (bX >= 0 && bX < BOARD_WIDTH && bY >= 0 && bY < BOARD_HEIGHT) {
      const row = grid[bY];
      if (row) {
        row[bX] = { char: bullet.char, color: bullet.color, bold: true };
      }
    }
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

function frameFitsViewport(frame: string, termWidth: number, termHeight: number): boolean {
  const lines = frame.split("\n");
  if (lines.length > termHeight) return false;
  return lines.every((line) => visibleLength(line) <= termWidth);
}

function renderViewportFallback(termWidth: number, termHeight: number): string {
  const width = Math.max(20, Math.min(PLAYFIELD_WIDTH, termWidth));
  const height = Math.max(4, Math.min(8, termHeight));
  const body = [
    centerText(bold(rgb("TERMINAL TOO SMALL", theme.amber, colorEnabled), colorEnabled), Math.max(1, width - 4)),
    centerText(rgb(`${PLAYFIELD_WIDTH}x25 required`, theme.muted, colorEnabled), Math.max(1, width - 4)),
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
  } else if (screen === "start") {
    const selectionLines: string[] = [];
    const selectionContentWidth = PLAYFIELD_WIDTH - 4;
    selectionLines.push(centerText(bold(rgb(" CHOOSE YOUR FIGHTER STARSHIP ", theme.amber, colorEnabled), colorEnabled), selectionContentWidth));
    selectionLines.push(centerText(rgb("━".repeat(Math.max(1, selectionContentWidth - 4)), theme.border, colorEnabled), selectionContentWidth));
    selectionLines.push("");

    // Build the 4 columns side-by-side
    const columns: string[] = [];
    playerShips.forEach((ship, idx) => {
      const isSelected = idx === selectedShipIndex;
      const variant = ship.variant;
      const frames = variant.idle && variant.idle.length > 0 ? variant.idle : [variant.sprite];
      const frame = isSelected ? frames[Math.floor(tick / 6) % frames.length] || variant.sprite : variant.sprite;
      const color = toneColors[variant.tone as keyof typeof toneColors] || theme.text;

      // 1. Initialize a 17x5 mini preview grid (5 rows, 17 cols)
      const previewGrid: Cell[][] = Array.from({ length: 5 }, () =>
        Array.from({ length: 17 }, () => ({ char: " ", color: null }))
      );

      // 2. Add mini stars background
      const starPositions = [
        { x: 3, y: 1, char: "·" },
        { x: 13, y: 0, char: "·" },
        { x: 8, y: 0, char: "·" }
      ];
      starPositions.forEach(star => {
        const row = previewGrid[star.y];
        if (row) {
          row[star.x] = { char: star.char, color: theme.muted };
        }
      });

      // 3. Draw ship sprite at the bottom of the grid
      const shipY = 5 - frame.height;
      const shipX = Math.floor((17 - frame.width) / 2);
      const muzzleX = getSpriteMuzzleX(shipX, frame.width);
      
      for (let r = 0; r < frame.height; r++) {
        const targetY = shipY + r;
        const row = previewGrid[targetY];
        if (!row) continue;
        const line = frame.lines[r] || "";
        const chars = line.split("");
        for (let c = 0; c < chars.length; c++) {
          const targetX = shipX + c;
          const char = chars[c] || " ";
          if (char !== " " && char !== "⠀") {
            row[targetX] = { char, color, bold: true };
          }
        }
      }

      // 4. Draw selected preview shooting bullets
      const bulletYBase = shipY - 1; // start above ship nose
      if (!isSelected) {
        // Inactive chassis stay static; only the highlighted choice animates.
      } else if (ship.classId === "bar") {
        const cycle = tick % 12;
        if (cycle < 9) {
          const d = Math.floor(cycle / 3) + 1;
          const targetY = bulletYBase - d + 1;
          if (targetY >= 0 && targetY < 5) {
            const row = previewGrid[targetY];
            if (row) {
              row[muzzleX] = { char: "║", color: theme.cyan, bold: true };
            }
          }
        }
      } else if (ship.classId === "delta") {
        const cycle = tick % 8;
        if (cycle < 6) {
          const d = Math.floor(cycle / 2) + 1;
          const targetY = bulletYBase - d + 1;
          if (targetY >= 0 && targetY < 5) {
            const row = previewGrid[targetY];
            if (row) {
              row[muzzleX] = { char: "┿", color: theme.blue, bold: true };
            }
          }
        }
      } else if (ship.classId === "ring") {
        const cycle = tick % 16;
        if (cycle < 12) {
          const d = Math.floor(cycle / 4) + 1;
          const targetY = bulletYBase - d + 1;
          if (targetY >= 0 && targetY < 5) {
            const row = previewGrid[targetY];
            if (row) {
              row[muzzleX] = { char: "❂", color: theme.purple, bold: true };
            }
          }
        }
      } else {
        const cycle = tick % 12;
        if (cycle < 9) {
          const d = Math.floor(cycle / 3) + 1;
          const targetY = bulletYBase - d + 1;
          if (targetY >= 0 && targetY < 5) {
            const row = previewGrid[targetY];
            if (row) {
              row[muzzleX] = { char: "▲", color: theme.amber, bold: true };
            }
          }
        }
      }

      // Convert preview grid to string[]
      const previewLines: string[] = [];
      for (let r = 0; r < 5; r++) {
        let lineStr = "";
        const row = previewGrid[r]!;
        for (let c = 0; c < 17; c++) {
          const cell = row[c]!;
          if (cell.color && colorEnabled) {
            lineStr += cell.bold ? bold(rgb(cell.char, cell.color, true), true) : rgb(cell.char, cell.color, true);
          } else {
            lineStr += cell.char;
          }
        }
        previewLines.push(lineStr);
      }

      // Name line (centered to 17 chars)
      const shortName = ship.name.replace(/ \(.*\)/, "");
      const nameLine = centerText(bold(rgb(shortName, isSelected ? theme.cyan : theme.white, colorEnabled), colorEnabled), 17);
      
      // Role line
      const roleWord = variant.role.split(" ").slice(-1)[0] || "";
      const roleLine = centerText(dim(rgb(roleWord.toUpperCase(), theme.muted, colorEnabled), colorEnabled), 17);

      // Stats bars utilizing standard widgets.ts renderBar with width 17
      const hpBar = renderBar("HP", (ship.hp / 110) * 100, 17, colorEnabled, "green");
      const shBar = renderBar("SHLD", (ship.shield / 70) * 100, 17, colorEnabled, "blue");
      const spBar = renderBar("SPD", (ship.speed / 2.2) * 100, 17, colorEnabled, "amber");

      // Weapon line
      const weaponLine = centerText(rgb(`[${ship.weapon}]`, isSelected ? theme.cyan : theme.muted, colorEnabled), 17);

      const colContent = [
        ...previewLines,
        "",
        nameLine,
        roleLine,
        "",
        hpBar,
        shBar,
        spBar,
        "",
        weaponLine
      ];

      const colBox = box(isSelected ? " ACTIVE " : "", colContent, {
        width: 19,
        height: 16, // Height increased to 16 to fit the 5-row preview range
        borderStyle: isSelected ? "arcade" : "single",
        accent: isSelected ? theme.cyan : theme.border,
        color: colorEnabled,
        paddingX: 0,
        titleAlign: "center"
      });

      columns.push(colBox);
    });

    const columnsBlock = hstack(columns, 1);
    columnsBlock.split("\n").forEach((line) => {
      selectionLines.push(centerText(line, selectionContentWidth));
    });
    selectionLines.push("");
    selectionLines.push(centerText(bold(rgb("◀/▶ or A/D to Select  •  ENTER to Launch Fighter", theme.cyan, colorEnabled), colorEnabled), selectionContentWidth));

    const selectionHeight = 23;
    const selectionContentHeight = selectionHeight - 2;
    const innerTopPadding = Math.max(0, Math.floor((selectionContentHeight - selectionLines.length) / 2));
    const paddedSelectionLines = [...Array.from({ length: innerTopPadding }, () => ""), ...selectionLines];
    const selectionBox = box(" SELECT CHASSIS ", paddedSelectionLines, {
      width: PLAYFIELD_WIDTH,
      height: selectionHeight,
      borderStyle: "arcade",
      accent: theme.cyan,
      color: colorEnabled,
      paddingX: 1
    });

    frameString = selectionBox.split("\n").map(l => marginStr + l).join("\n");
  } else if (screen === "playing") {
    const hudLines = renderArcadeHud(PLAYFIELD_WIDTH, buildDemoHudState(), colorEnabled).split("\n");
    if (statusMessageTicks > 0) {
      hudLines.push(centerText(rgb(statusMessage, theme.amber, colorEnabled), PLAYFIELD_WIDTH));
    }
    while (hudLines.length < GAMEPLAY_HUD_HEIGHT) hudLines.push("");
    const hud = hudLines.join("\n");

    const boardLines = renderBoard();
    const boardBox = box(" RETRO ARCADE INVASION ", boardLines, {
      width: PLAYFIELD_WIDTH,
      height: BOARD_HEIGHT + 2,
      borderStyle: "arcade",
      accent: flashTicks > 0 ? theme.red : theme.cyan,
      color: colorEnabled
    });

    const footerText = dim(rgb("A/D or ◀/▶: Move Starfighter  •  SPACEBAR: Shoot Laser  •  Q: Abort", theme.muted, colorEnabled), colorEnabled);
    const footerLine = fitAnsi(footerText, PLAYFIELD_WIDTH);

    let shakeX = 0;
    let shakeY = 0;
    if (shakeIntensity > 0) {
      shakeX = Math.floor((Math.random() - 0.5) * shakeIntensity * 2);
      shakeY = Math.floor((Math.random() - 0.5) * shakeIntensity * 2);
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
  if (result === "victory") {
    startGame(activeShip, { preserveScore: true, advanceDifficulty: true });
    return;
  }

  startGame(activeShip);
}

// Input parsing dispatcher
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
      screen = "start";
      render();
    }
  } else if (screen === "start") {
    if (keyStr === "a" || keyStr === "\u001b[D" || keyStr === "w" || keyStr === "\u001b[A") {
      selectedShipIndex = (selectedShipIndex - 1 + playerShips.length) % playerShips.length;
      render();
    } else if (keyStr === "d" || keyStr === "\u001b[C" || keyStr === "s" || keyStr === "\u001b[B") {
      selectedShipIndex = (selectedShipIndex + 1) % playerShips.length;
      render();
    } else if (keyStr === "\r" || keyStr === "\n") {
      startGame(playerShips[selectedShipIndex]!);
      render();
    }
  } else if (screen === "playing") {
    if (keyStr === "a" || keyStr === "\u001b[D") {
      movePlayer(-2);
      render();
    } else if (keyStr === "d" || keyStr === "\u001b[C") {
      movePlayer(2);
      render();
    } else if (keyStr === " ") {
      playerShoot();
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
  if (input === "\u001b[D" || input === "\u001b[C" || input === "\u001b[A" || input === "\u001b[B") {
    return false;
  }

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
    } else if (screen === "start") {
      tick++;
      if (tick % 3 === 0) render();
    }
  }, FRAME_INTERVAL);

  render();
}

// Graceful signal catching
process.on("SIGINT", cleanupAndExit);
process.on("SIGTERM", cleanupAndExit);

main();
