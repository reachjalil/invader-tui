export type Tone = "green" | "red" | "amber" | "cyan" | "blue" | "purple" | "slate" | "lime" | "white";

export type SpriteFrame = {
  width: number;
  height: number;
  lines: string[];
};

export type AttachmentPoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  accepts: string[];
};

export type GameAssetVariant = {
  id: string;
  name: string;
  role: string;
  tone: Tone;
  sprite: SpriteFrame;
  tags: string[];
  attachmentPoints: AttachmentPoint[];
};

export type StatBlock = {
  hp?: number;
  hull?: number;
  shield?: number;
  armor?: number;
  speed: number;
  fireRate?: number;
  weaponSlots?: number;
  projectileDamage?: number;
  scoreValue?: number;
  specialTrait: string;
  weakness?: string;
};

export type EnemyStats = StatBlock & {
  hp: number;
  armor: number;
  collisionDamage: number;
  scoreValue: number;
  fireRate: number;
  swarmWeight: number;
  weakness: string;
};

export type ShipStats = StatBlock & {
  hull: number;
  shield: number;
  turnRate: number;
  weaponSlots: number;
  projectileDamage: number;
  fireRate: number;
  spread: number;
  powerUpAffinity: number;
};

export type EnemyVariant = GameAssetVariant & {
  stats: EnemyStats;
  idle?: [SpriteFrame, SpriteFrame];
};

export type ShipVariant = GameAssetVariant & {
  stats: ShipStats;
  idle?: [SpriteFrame, SpriteFrame];
};

export type EnemySpecies = {
  id: string;
  displayName: string;
  lore: string;
  variants: EnemyVariant[];
};

export type ShipFamily = {
  id: string;
  displayName: string;
  role: string;
  variants: ShipVariant[];
};
