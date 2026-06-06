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

export type ShipClassId = "bar" | "delta" | "ring" | "wedge";

export type ShipModuleCategory =
  | "wing"
  | "pod"
  | "cannon"
  | "reactor"
  | "engine"
  | "shield"
  | "armor"
  | "autopilot";

export type ShipStatKey =
  | "hull"
  | "shield"
  | "speed"
  | "turnRate"
  | "weaponSlots"
  | "projectileDamage"
  | "fireRate"
  | "spread"
  | "powerUpAffinity";

export type ShipStatModifiers = Partial<Record<ShipStatKey, number>>;

export type ShipPaintScheme = {
  id: string;
  name: string;
  tone: Tone;
  role: string;
  statModifiers: ShipStatModifiers;
};

export type ShipModule = {
  id: string;
  name: string;
  category: ShipModuleCategory;
  tone: Tone;
  marker: string;
  role: string;
  statModifiers: ShipStatModifiers;
  weaponName?: string;
};

export type ShipCosmeticSlotId = "nose" | "leftWing" | "rightWing" | "tail" | "interior";

export type ShipCosmeticPart = {
  id: string;
  name: string;
  slotId: ShipCosmeticSlotId;
  tone: Tone;
  marker: string;
  role: string;
  statModifiers: ShipStatModifiers;
};

export type ShipDesign = {
  id: string;
  name: string;
  classId: ShipClassId;
  paintId: string;
  modules: Record<string, string>;
  cosmetics?: Record<string, string>;
};

export type ResolvedShipModuleSlot = {
  point: AttachmentPoint;
  module?: ShipModule;
};

export type ResolvedShipDesign = {
  id: string;
  name: string;
  classId: ShipClassId;
  className: string;
  chassis: ShipVariant;
  paint: ShipPaintScheme;
  slots: ResolvedShipModuleSlot[];
  cosmetics: ShipCosmeticPart[];
  stats: ShipStats;
  weaponName: string;
  description: string;
  variant: ShipVariant;
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
