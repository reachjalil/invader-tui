import { shipFamily } from "./ships.js";
import type {
  AttachmentPoint,
  ShipCosmeticPart,
  ShipCosmeticSlotId,
  ShipClassId,
  ShipDesign,
  ShipModule,
  ShipModuleCategory,
  ShipPaintScheme,
  ShipStatKey,
  ShipStatModifiers,
  ShipStats,
  ShipVariant,
  ResolvedShipDesign
} from "./types.js";

export type ShipClassConfig = {
  id: ShipClassId;
  displayName: string;
  shortName: string;
  role: string;
  defaultPaintId: string;
  weaponNames: [string, string, string];
  modulePreferences: string[];
};

export type ShipDesignModuleSlotId = "gun" | "wings" | "engine" | "core" | "defense" | "support";

export type ShipDesignModuleSlot = {
  id: ShipDesignModuleSlotId;
  label: string;
  shortLabel: string;
  categories: ShipModuleCategory[];
  role: string;
};

export type ShipCosmeticSlot = {
  id: ShipCosmeticSlotId;
  label: string;
  shortLabel: string;
  defaultPartId: string;
  role: string;
};

export const shipClassConfigs: ShipClassConfig[] = [
  {
    id: "bar",
    displayName: "Bar Fighter",
    shortName: "Bar",
    role: "Balanced beam platform with clean centerline firing lanes.",
    defaultPaintId: "factory-cyan",
    weaponNames: ["Single Laser", "Double Laser", "Quad Lance"],
    modulePreferences: ["pulse-cannon", "vector-wings", "balanced-reactor", "micro-thrusters", "targeting-pod"]
  },
  {
    id: "delta",
    displayName: "Delta Scout",
    shortName: "Delta",
    role: "Fast tactical scout built around aggressive movement and rapid fire.",
    defaultPaintId: "ion-blue",
    weaponNames: ["Pulse Bolt", "Rapid Blaster", "Twin Needler"],
    modulePreferences: ["needle-cannon", "vector-wings", "overdrive-core", "slipstream-drive", "evasion-ai"]
  },
  {
    id: "ring",
    displayName: "Ring Vanguard",
    shortName: "Ring",
    role: "Energy saucer that favors shields, collection range, and plasma control.",
    defaultPaintId: "void-purple",
    weaponNames: ["Core Orb", "Heavy Core", "Singularity Shot"],
    modulePreferences: ["plasma-mortar", "aegis-emitter", "collector-pod", "capacitor-reactor", "phase-bulwark"]
  },
  {
    id: "wedge",
    displayName: "Wedge Titan",
    shortName: "Wedge",
    role: "Armored striker tuned for heavy hulls and spread weapons.",
    defaultPaintId: "hazard-amber",
    weaponNames: ["Piercer", "Triple Spread", "Armor Storm"],
    modulePreferences: ["rail-lance", "ablative-plating", "heavy-ailerons", "fortress-reactor", "repair-pod"]
  }
];

export const shipCallsigns = [
  "Valkyrie",
  "Night Arrow",
  "Ion Saint",
  "Ghost Relay",
  "Solar Knife",
  "Anchor Nine"
] as const;

export const shipPaintSchemes: ShipPaintScheme[] = [
  {
    id: "factory-cyan",
    name: "Factory Cyan",
    tone: "cyan",
    role: "Baseline calibration with no tradeoffs.",
    statModifiers: {}
  },
  {
    id: "ion-blue",
    name: "Ion Blue",
    tone: "blue",
    role: "Shield-tuned finish for precision pilots.",
    statModifiers: {}
  },
  {
    id: "void-purple",
    name: "Void Purple",
    tone: "purple",
    role: "Powerup-sensitive plating with heavier energy handling.",
    statModifiers: {}
  },
  {
    id: "hazard-amber",
    name: "Hazard Amber",
    tone: "amber",
    role: "Reinforced industrial coating for brawling.",
    statModifiers: {}
  },
  {
    id: "verdant-lime",
    name: "Verdant Lime",
    tone: "lime",
    role: "Lightweight alloy that improves star recovery.",
    statModifiers: {}
  },
  {
    id: "white-comet",
    name: "White Comet",
    tone: "white",
    role: "High-visibility test livery with sharper weapons.",
    statModifiers: {}
  },
  {
    id: "redline",
    name: "Redline",
    tone: "red",
    role: "Hot-running finish for high damage, low safety runs.",
    statModifiers: {}
  },
  {
    id: "slate-stealth",
    name: "Slate Stealth",
    tone: "slate",
    role: "Stable matte plating that improves turning under pressure.",
    statModifiers: {}
  }
];

export const shipDesignModuleSlots: ShipDesignModuleSlot[] = [
  {
    id: "gun",
    label: "Gun Type",
    shortLabel: "GUN",
    categories: ["cannon"],
    role: "Primary weapon style and damage profile."
  },
  {
    id: "wings",
    label: "Wing Type",
    shortLabel: "WING",
    categories: ["wing"],
    role: "Handling, spread, and side-frame behavior."
  },
  {
    id: "engine",
    label: "Engine",
    shortLabel: "ENG",
    categories: ["engine"],
    role: "Movement speed and lateral control."
  },
  {
    id: "core",
    label: "Power Core",
    shortLabel: "CORE",
    categories: ["reactor"],
    role: "Reactor output and ship resource balance."
  },
  {
    id: "defense",
    label: "Defense",
    shortLabel: "DEF",
    categories: ["shield", "armor"],
    role: "Shield emitters or armor packages."
  },
  {
    id: "support",
    label: "Support",
    shortLabel: "SUP",
    categories: ["pod", "autopilot"],
    role: "Utility pods and assist computers."
  }
];

export const shipCosmeticSlots: ShipCosmeticSlot[] = [
  {
    id: "nose",
    label: "Nose Tip",
    shortLabel: "NOSE",
    defaultPartId: "nose-needle",
    role: "Forward profile and cockpit tip shape."
  },
  {
    id: "leftWing",
    label: "Left Wing",
    shortLabel: "LEFT",
    defaultPartId: "left-swept",
    role: "Left-side silhouette and asymmetric handling bias."
  },
  {
    id: "rightWing",
    label: "Right Wing",
    shortLabel: "RIGHT",
    defaultPartId: "right-swept",
    role: "Right-side silhouette and asymmetric handling bias."
  },
  {
    id: "tail",
    label: "Tail",
    shortLabel: "TAIL",
    defaultPartId: "tail-v",
    role: "Rear thruster contour and braking feel."
  },
  {
    id: "interior",
    label: "Inside",
    shortLabel: "IN",
    defaultPartId: "inside-glass",
    role: "Center cockpit, reactor eye, or open-hole interior."
  }
];

export const shipCosmeticParts: ShipCosmeticPart[] = [
  {
    id: "nose-needle",
    name: "Needle Tip",
    slotId: "nose",
    tone: "cyan",
    marker: "^",
    role: "Stock pointed command tip with neutral handling.",
    statModifiers: {}
  },
  {
    id: "nose-fork",
    name: "Fork Tip",
    slotId: "nose",
    tone: "lime",
    marker: "Y",
    role: "Split targeting prongs widen the firing path.",
    statModifiers: { spread: 1, projectileDamage: -1 }
  },
  {
    id: "nose-flat",
    name: "Flat Helm",
    slotId: "nose",
    tone: "slate",
    marker: "=",
    role: "Blunt armor cap that trades speed for hull.",
    statModifiers: { hull: 3, speed: -1 }
  },
  {
    id: "nose-beak",
    name: "Beak Prow",
    slotId: "nose",
    tone: "amber",
    marker: "V",
    role: "Aggressive prow for stronger forward impact.",
    statModifiers: { projectileDamage: 2, turnRate: -1 }
  },
  {
    id: "nose-dome",
    name: "Dome Nose",
    slotId: "nose",
    tone: "blue",
    marker: "A",
    role: "Shielded sensor dome that slows weapon cadence.",
    statModifiers: { shield: 3, fireRate: -1 }
  },
  {
    id: "left-swept",
    name: "Swept Left",
    slotId: "leftWing",
    tone: "cyan",
    marker: "<",
    role: "Stock swept left plane with neutral stats.",
    statModifiers: {}
  },
  {
    id: "left-round",
    name: "Round Left",
    slotId: "leftWing",
    tone: "purple",
    marker: "(",
    role: "Rounded port-side fairing improves turn response.",
    statModifiers: { turnRate: 1, speed: -1 }
  },
  {
    id: "left-blade",
    name: "Blade Left",
    slotId: "leftWing",
    tone: "red",
    marker: "[",
    role: "Sharp port blade adds damage but thins the hull.",
    statModifiers: { projectileDamage: 1, hull: -2 }
  },
  {
    id: "left-flat",
    name: "Flat Left",
    slotId: "leftWing",
    tone: "slate",
    marker: "|",
    role: "Flat armor plate reinforces the left edge.",
    statModifiers: { hull: 4, turnRate: -1 }
  },
  {
    id: "left-fork",
    name: "Fork Left",
    slotId: "leftWing",
    tone: "lime",
    marker: "/",
    role: "Open fork fin lightens the left side.",
    statModifiers: { speed: 1, shield: -2 }
  },
  {
    id: "right-swept",
    name: "Swept Right",
    slotId: "rightWing",
    tone: "cyan",
    marker: ">",
    role: "Stock swept right plane with neutral stats.",
    statModifiers: {}
  },
  {
    id: "right-round",
    name: "Round Right",
    slotId: "rightWing",
    tone: "purple",
    marker: ")",
    role: "Rounded starboard fairing improves turn response.",
    statModifiers: { turnRate: 1, speed: -1 }
  },
  {
    id: "right-blade",
    name: "Blade Right",
    slotId: "rightWing",
    tone: "red",
    marker: "]",
    role: "Sharp starboard blade adds damage but thins the hull.",
    statModifiers: { projectileDamage: 1, hull: -2 }
  },
  {
    id: "right-flat",
    name: "Flat Right",
    slotId: "rightWing",
    tone: "slate",
    marker: "|",
    role: "Flat armor plate reinforces the right edge.",
    statModifiers: { hull: 4, turnRate: -1 }
  },
  {
    id: "right-fork",
    name: "Fork Right",
    slotId: "rightWing",
    tone: "lime",
    marker: "\\",
    role: "Open fork fin lightens the right side.",
    statModifiers: { speed: 1, shield: -2 }
  },
  {
    id: "tail-v",
    name: "V-Tail",
    slotId: "tail",
    tone: "cyan",
    marker: "v",
    role: "Stock V thruster notch with neutral stats.",
    statModifiers: {}
  },
  {
    id: "tail-u",
    name: "U-Tail",
    slotId: "tail",
    tone: "blue",
    marker: "U",
    role: "Curved tail channel improves turning at low speed.",
    statModifiers: { turnRate: 1, speed: -1 }
  },
  {
    id: "tail-round",
    name: "Round Tail",
    slotId: "tail",
    tone: "purple",
    marker: "o",
    role: "Rounded reactor bell adds shielding but slows fire.",
    statModifiers: { shield: 2, fireRate: -1 }
  },
  {
    id: "tail-flat",
    name: "Flat Tail",
    slotId: "tail",
    tone: "slate",
    marker: "_",
    role: "Flat tail armor adds hull at the cost of speed.",
    statModifiers: { hull: 3, speed: -1 }
  },
  {
    id: "tail-split",
    name: "Split Tail",
    slotId: "tail",
    tone: "lime",
    marker: "Y",
    role: "Twin exhaust split gives speed with weaker shields.",
    statModifiers: { speed: 2, shield: -3 }
  },
  {
    id: "inside-glass",
    name: "Glass Core",
    slotId: "interior",
    tone: "cyan",
    marker: "*",
    role: "Stock glass cockpit and balanced reactor view.",
    statModifiers: {}
  },
  {
    id: "inside-solid",
    name: "Solid Core",
    slotId: "interior",
    tone: "amber",
    marker: "#",
    role: "Armored filled interior improves hull but turns slower.",
    statModifiers: { hull: 3, turnRate: -1 }
  },
  {
    id: "inside-hollow",
    name: "Hollow Core",
    slotId: "interior",
    tone: "white",
    marker: "O",
    role: "Visible cockpit hole lightens the frame.",
    statModifiers: { speed: 1, hull: -2 }
  },
  {
    id: "inside-open",
    name: "Open Hole",
    slotId: "interior",
    tone: "purple",
    marker: " ",
    role: "Open center hole improves star flow but weakens shields.",
    statModifiers: { powerUpAffinity: 2, shield: -2 }
  },
  {
    id: "inside-eye",
    name: "Reactor Eye",
    slotId: "interior",
    tone: "red",
    marker: "@",
    role: "Exposed reactor eye boosts fire rate with less shielding.",
    statModifiers: { fireRate: 1, shield: -1 }
  }
];

export const shipModules: ShipModule[] = [
  {
    id: "pulse-cannon",
    name: "Pulse Cannon",
    category: "cannon",
    tone: "cyan",
    marker: "^",
    role: "Reliable centerline laser upgrade.",
    statModifiers: { projectileDamage: 4, fireRate: 1 },
    weaponName: "Pulse Laser"
  },
  {
    id: "needle-cannon",
    name: "Needle Cannon",
    category: "cannon",
    tone: "blue",
    marker: "|",
    role: "Fast low-mass gun for scouts.",
    statModifiers: { fireRate: 2, projectileDamage: 1, speed: 1 },
    weaponName: "Needle Burst"
  },
  {
    id: "rail-lance",
    name: "Rail Lance",
    category: "cannon",
    tone: "amber",
    marker: "!",
    role: "Heavy kinetic barrel with slower cycling.",
    statModifiers: { projectileDamage: 8, fireRate: -1, speed: -1 },
    weaponName: "Rail Lance"
  },
  {
    id: "plasma-mortar",
    name: "Plasma Mortar",
    category: "cannon",
    tone: "purple",
    marker: "*",
    role: "Wide energy burst for multi-lane pressure.",
    statModifiers: { projectileDamage: 5, spread: 1, fireRate: -1 },
    weaponName: "Plasma Mortar"
  },
  {
    id: "vector-wings",
    name: "Vector Wings",
    category: "wing",
    tone: "blue",
    marker: "/",
    role: "Control surfaces that make lateral dodging sharper.",
    statModifiers: { speed: 1, turnRate: 2, hull: -3 }
  },
  {
    id: "heavy-ailerons",
    name: "Heavy Ailerons",
    category: "wing",
    tone: "amber",
    marker: "<",
    role: "Wide fins that stabilize spread weapons.",
    statModifiers: { hull: 7, spread: 1, turnRate: -1 }
  },
  {
    id: "heat-vanes",
    name: "Heat Vanes",
    category: "wing",
    tone: "red",
    marker: "~",
    role: "External cooling that lets guns cycle harder.",
    statModifiers: { fireRate: 2, shield: -4 }
  },
  {
    id: "targeting-pod",
    name: "Targeting Pod",
    category: "pod",
    tone: "lime",
    marker: "+",
    role: "Compact sighting package for cleaner shots.",
    statModifiers: { projectileDamage: 2, powerUpAffinity: 1 }
  },
  {
    id: "collector-pod",
    name: "Collector Pod",
    category: "pod",
    tone: "white",
    marker: "$",
    role: "Magnetized star recovery capsule.",
    statModifiers: { powerUpAffinity: 3, speed: -1 }
  },
  {
    id: "repair-pod",
    name: "Repair Pod",
    category: "pod",
    tone: "green",
    marker: "+",
    role: "Field repair bay with extra hull reserve.",
    statModifiers: { hull: 12, fireRate: -1 }
  },
  {
    id: "balanced-reactor",
    name: "Balanced Reactor",
    category: "reactor",
    tone: "cyan",
    marker: "o",
    role: "Steady output with broad compatibility.",
    statModifiers: { hull: 4, shield: 4, fireRate: 1 }
  },
  {
    id: "overdrive-core",
    name: "Overdrive Core",
    category: "reactor",
    tone: "red",
    marker: "x",
    role: "Unstable power plant for fast attack builds.",
    statModifiers: { speed: 2, fireRate: 2, shield: -8 }
  },
  {
    id: "capacitor-reactor",
    name: "Capacitor Reactor",
    category: "reactor",
    tone: "purple",
    marker: "O",
    role: "Energy buffer for shield-heavy ships.",
    statModifiers: { shield: 14, projectileDamage: 2, speed: -1 }
  },
  {
    id: "fortress-reactor",
    name: "Fortress Reactor",
    category: "reactor",
    tone: "amber",
    marker: "#",
    role: "Dense reactor casing for armored frames.",
    statModifiers: { hull: 16, shield: 6, speed: -2 }
  },
  {
    id: "micro-thrusters",
    name: "Micro Thrusters",
    category: "engine",
    tone: "cyan",
    marker: "v",
    role: "Small rear thrusters with no handling penalty.",
    statModifiers: { speed: 1, turnRate: 1 }
  },
  {
    id: "slipstream-drive",
    name: "Slipstream Drive",
    category: "engine",
    tone: "blue",
    marker: ">",
    role: "High acceleration engine for narrow escapes.",
    statModifiers: { speed: 3, hull: -6, fireRate: 1 }
  },
  {
    id: "brake-stabilizer",
    name: "Brake Stabilizer",
    category: "engine",
    tone: "slate",
    marker: "=",
    role: "Controlled movement and stable firing.",
    statModifiers: { turnRate: 3, projectileDamage: 1, speed: -1 }
  },
  {
    id: "aegis-emitter",
    name: "Aegis Emitter",
    category: "shield",
    tone: "blue",
    marker: ")",
    role: "Compact shield projector for exposed hardpoints.",
    statModifiers: { shield: 18, speed: -1 }
  },
  {
    id: "phase-bulwark",
    name: "Phase Bulwark",
    category: "shield",
    tone: "purple",
    marker: "]",
    role: "Energy wall tuned for boss volleys.",
    statModifiers: { shield: 26, fireRate: -1, turnRate: -1 }
  },
  {
    id: "ablative-plating",
    name: "Ablative Plating",
    category: "armor",
    tone: "amber",
    marker: "[",
    role: "Cheap layered armor for collision survival.",
    statModifiers: { hull: 18, speed: -1 }
  },
  {
    id: "reactive-armor",
    name: "Reactive Armor",
    category: "armor",
    tone: "red",
    marker: "{",
    role: "Explosive armor that boosts heavy weapon impact.",
    statModifiers: { hull: 12, projectileDamage: 4, turnRate: -1 }
  },
  {
    id: "evasion-ai",
    name: "Evasion AI",
    category: "autopilot",
    tone: "lime",
    marker: "?",
    role: "Assist computer for quick lateral correction.",
    statModifiers: { turnRate: 3, speed: 1, powerUpAffinity: 1 }
  },
  {
    id: "gunner-ai",
    name: "Gunner AI",
    category: "autopilot",
    tone: "white",
    marker: "!",
    role: "Firing assistant that favors weapon cadence.",
    statModifiers: { fireRate: 2, projectileDamage: 2, shield: -4 }
  }
];

export const shipDesignPresets: ShipDesign[] = [
  {
    id: "design-razorback",
    name: "Razorback",
    classId: "delta",
    paintId: "redline",
    modules: {
      gun: "needle-cannon",
      wings: "vector-wings",
      core: "overdrive-core",
      engine: "slipstream-drive"
    },
    cosmetics: {
      nose: "nose-beak",
      leftWing: "left-fork",
      rightWing: "right-fork",
      tail: "tail-split",
      interior: "inside-eye"
    }
  },
  {
    id: "design-aegis-loop",
    name: "Aegis Loop",
    classId: "ring",
    paintId: "void-purple",
    modules: {
      gun: "plasma-mortar",
      core: "capacitor-reactor",
      defense: "aegis-emitter",
      support: "collector-pod"
    },
    cosmetics: {
      nose: "nose-dome",
      leftWing: "left-round",
      rightWing: "right-round",
      tail: "tail-round",
      interior: "inside-open"
    }
  },
  {
    id: "design-bastion",
    name: "Bastion",
    classId: "wedge",
    paintId: "hazard-amber",
    modules: {
      gun: "rail-lance",
      wings: "heavy-ailerons",
      core: "fortress-reactor",
      defense: "ablative-plating"
    },
    cosmetics: {
      nose: "nose-flat",
      leftWing: "left-flat",
      rightWing: "right-flat",
      tail: "tail-flat",
      interior: "inside-solid"
    }
  }
];

const statKeys: ShipStatKey[] = [
  "hull",
  "shield",
  "speed",
  "turnRate",
  "weaponSlots",
  "projectileDamage",
  "fireRate",
  "spread",
  "powerUpAffinity"
];

const statMinimums: Record<ShipStatKey, number> = {
  hull: 1,
  shield: 0,
  speed: 1,
  turnRate: 1,
  weaponSlots: 1,
  projectileDamage: 1,
  fireRate: 1,
  spread: 1,
  powerUpAffinity: 0
};

const statMaximums: Record<ShipStatKey, number> = {
  hull: 180,
  shield: 160,
  speed: 13,
  turnRate: 13,
  weaponSlots: 6,
  projectileDamage: 52,
  fireRate: 13,
  spread: 6,
  powerUpAffinity: 14
};

export function getShipClassConfig(classId: ShipClassId): ShipClassConfig {
  return shipClassConfigs.find((config) => config.id === classId) ?? shipClassConfigs[0]!;
}

export function getShipVariantForClass(classId: ShipClassId, level = 1): ShipVariant {
  const safeLevel = Math.max(1, Math.min(3, Math.floor(level)));
  return shipFamily.variants.find((variant) => variant.id === `ship-${classId}-chassis-l${safeLevel}`)
    ?? shipFamily.variants.find((variant) => variant.id === `ship-${classId}-chassis-l1`)
    ?? shipFamily.variants[0]!;
}

export function getShipPaintScheme(paintId: string, classId?: ShipClassId): ShipPaintScheme {
  const fallback = classId ? getShipClassConfig(classId).defaultPaintId : shipPaintSchemes[0]!.id;
  return shipPaintSchemes.find((paint) => paint.id === paintId)
    ?? shipPaintSchemes.find((paint) => paint.id === fallback)
    ?? shipPaintSchemes[0]!;
}

export function getShipModule(moduleId: string | undefined): ShipModule | undefined {
  if (!moduleId) return undefined;
  return shipModules.find((module) => module.id === moduleId);
}

export function getCompatibleModulesForSlot(point: AttachmentPoint): ShipModule[] {
  const accepts = new Set(point.accepts as ShipModuleCategory[]);
  return shipModules.filter((module) => accepts.has(module.category));
}

export function getShipDesignModuleSlot(slotId: string): ShipDesignModuleSlot | undefined {
  return shipDesignModuleSlots.find((slot) => slot.id === slotId);
}

export function getModulesForDesignSlot(slotId: ShipDesignModuleSlotId): ShipModule[] {
  const slot = getShipDesignModuleSlot(slotId);
  if (!slot) return [];
  return shipModules.filter((module) => slot.categories.includes(module.category));
}

export function getSelectedDesignModule(design: ShipDesign, slotId: ShipDesignModuleSlotId): ShipModule | undefined {
  const slot = getShipDesignModuleSlot(slotId);
  const module = getShipModule(design.modules[slotId]);
  if (!slot || !module) return undefined;
  return slot.categories.includes(module.category) ? module : undefined;
}

export function getShipCosmeticSlot(slotId: string): ShipCosmeticSlot | undefined {
  return shipCosmeticSlots.find((slot) => slot.id === slotId);
}

export function getShipCosmeticPart(partId: string | undefined): ShipCosmeticPart | undefined {
  if (!partId) return undefined;
  return shipCosmeticParts.find((part) => part.id === partId);
}

export function getCosmeticPartsForSlot(slotId: ShipCosmeticSlotId): ShipCosmeticPart[] {
  return shipCosmeticParts.filter((part) => part.slotId === slotId);
}

export function getSelectedCosmeticPart(design: ShipDesign, slotId: ShipCosmeticSlotId): ShipCosmeticPart {
  const slot = getShipCosmeticSlot(slotId);
  const selected = getShipCosmeticPart(design.cosmetics?.[slotId]);
  if (selected?.slotId === slotId) return selected;

  const defaultPart = getShipCosmeticPart(slot?.defaultPartId);
  if (defaultPart?.slotId === slotId) return defaultPart;

  return getCosmeticPartsForSlot(slotId)[0]!;
}

function getSelectedCosmeticPartsForDesign(design: ShipDesign): ShipCosmeticPart[] {
  return shipCosmeticSlots.map((slot) => getSelectedCosmeticPart(design, slot.id));
}

function normalizeCosmetics(design: ShipDesign): Record<string, string> {
  const cosmetics: Record<string, string> = {};
  for (const slot of shipCosmeticSlots) {
    cosmetics[slot.id] = getSelectedCosmeticPart(design, slot.id).id;
  }
  return cosmetics;
}

export function acceptsModule(point: AttachmentPoint, module: ShipModule | undefined): boolean {
  if (!module) return false;
  return point.accepts.includes(module.category);
}

function applyModifiers(stats: ShipStats, modifiers: ShipStatModifiers): ShipStats {
  const next = { ...stats };
  for (const key of statKeys) {
    next[key] += modifiers[key] ?? 0;
    next[key] = Math.max(statMinimums[key], Math.min(statMaximums[key], Math.round(next[key])));
  }
  return next;
}

function pickDefaultModule(point: AttachmentPoint, preferences: string[]): ShipModule | undefined {
  for (const moduleId of preferences) {
    const module = getShipModule(moduleId);
    if (acceptsModule(point, module)) return module;
  }
  return getCompatibleModulesForSlot(point)[0];
}

export function buildDefaultShipDesign(
  classId: ShipClassId,
  overrides: Partial<Pick<ShipDesign, "id" | "name" | "paintId" | "modules" | "cosmetics">> = {}
): ShipDesign {
  const config = getShipClassConfig(classId);

  return {
    id: overrides.id ?? `design-${classId}-custom`,
    name: overrides.name ?? shipCallsigns[0]!,
    classId,
    paintId: overrides.paintId ?? config.defaultPaintId,
    modules: { ...(overrides.modules ?? {}) },
    ...(overrides.cosmetics ? { cosmetics: { ...overrides.cosmetics } } : {})
  };
}

function isModuleAllowedForDesignEntry(key: string, module: ShipModule, chassis: ShipVariant): boolean {
  const designSlot = getShipDesignModuleSlot(key);
  if (designSlot) return designSlot.categories.includes(module.category);

  const point = chassis.attachmentPoints.find((candidate) => candidate.id === key);
  if (point) return acceptsModule(point, module);

  return chassis.attachmentPoints.some((candidate) => acceptsModule(candidate, module));
}

function getSelectedModulesForDesign(design: ShipDesign, chassis: ShipVariant): ShipModule[] {
  const selected: ShipModule[] = [];
  const seenIds = new Set<string>();

  for (const [key, moduleId] of Object.entries(design.modules)) {
    const module = getShipModule(moduleId);
    if (!module || seenIds.has(module.id)) continue;
    if (!isModuleAllowedForDesignEntry(key, module, chassis)) continue;
    selected.push(module);
    seenIds.add(module.id);
  }

  return selected;
}

function resolveModuleForPoint(
  point: AttachmentPoint,
  design: ShipDesign,
  usedModuleSourceSlots: Set<string>
): { module?: ShipModule; sourceSlotId?: string } {
  const directModule = getShipModule(design.modules[point.id]);
  if (directModule && acceptsModule(point, directModule)) {
    return { module: directModule, sourceSlotId: point.id };
  }

  for (const [sourceSlotId, moduleId] of Object.entries(design.modules)) {
    if (usedModuleSourceSlots.has(sourceSlotId)) continue;
    const module = getShipModule(moduleId);
    if (module && acceptsModule(point, module)) {
      return { module, sourceSlotId };
    }
  }

  return {};
}

export function normalizeShipDesign(design: ShipDesign, level = 1): ShipDesign {
  const chassis = getShipVariantForClass(design.classId, level);
  const usedSourceSlots = new Set<string>();
  const modules: Record<string, string> = {};

  for (const designSlot of shipDesignModuleSlots) {
    const module = getSelectedDesignModule(design, designSlot.id);
    if (!module) continue;
    for (const point of chassis.attachmentPoints) {
      if (!acceptsModule(point, module)) continue;
      modules[point.id] = module.id;
      usedSourceSlots.add(designSlot.id);
    }
  }

  for (const point of chassis.attachmentPoints) {
    if (modules[point.id]) continue;
    const resolved = resolveModuleForPoint(point, design, usedSourceSlots);
    if (resolved.module) {
      modules[point.id] = resolved.module.id;
      if (resolved.sourceSlotId) usedSourceSlots.add(resolved.sourceSlotId);
    }
  }

  return {
    ...design,
    paintId: getShipPaintScheme(design.paintId, design.classId).id,
    modules,
    cosmetics: normalizeCosmetics(design)
  };
}

export function getShipDesignWeaponName(design: ShipDesign, level = 1): string {
  const config = getShipClassConfig(design.classId);
  const chassis = getShipVariantForClass(design.classId, level);
  const cannon = getSelectedModulesForDesign(design, chassis).find((module) => module.weaponName);

  return cannon?.weaponName ?? config.weaponNames[Math.max(0, Math.min(2, Math.floor(level) - 1))] ?? config.weaponNames[0];
}

function overlayModuleMarkers(frame: ShipVariant["sprite"], slots: { point: AttachmentPoint; module?: ShipModule }[]): ShipVariant["sprite"] {
  const lines = frame.lines.map((line) => Array.from(line));
  const put = (x: number, y: number, marker: string) => {
    const row = lines[y];
    if (!row || x < 0 || x >= row.length) return;
    row[x] = marker;
  };

  for (const slot of slots) {
    if (!slot.module) continue;
    const { x, y } = slot.point;
    put(x, y, slot.module.marker);

    if (slot.module.category === "wing") {
      put(x > frame.width / 2 ? x - 1 : x + 1, y, slot.module.marker);
    } else if (slot.module.category === "cannon") {
      put(x, Math.max(0, y - 1), slot.module.marker);
    } else if (slot.module.category === "engine") {
      put(x, Math.min(frame.height - 1, y + 1), slot.module.marker);
    } else if (slot.module.category === "reactor") {
      put(Math.max(0, x - 1), y, slot.module.marker);
      put(Math.min(frame.width - 1, x + 1), y, slot.module.marker);
    } else if (slot.module.category === "shield" || slot.module.category === "armor") {
      put(0, y, slot.module.marker);
      put(frame.width - 1, y, slot.module.marker);
    }
  }

  return {
    ...frame,
    lines: lines.map((line) => line.join(""))
  };
}

function getCosmeticCoordinates(frame: ShipVariant["sprite"], slotId: ShipCosmeticSlotId): { x: number; y: number } {
  const centerX = Math.floor(frame.width / 2);
  const centerY = Math.max(0, Math.floor(frame.height / 2));
  const wingY = Math.max(0, Math.min(frame.height - 1, frame.height >= 4 ? frame.height - 2 : centerY));

  if (slotId === "nose") return { x: centerX, y: 0 };
  if (slotId === "leftWing") return { x: 0, y: wingY };
  if (slotId === "rightWing") return { x: frame.width - 1, y: wingY };
  if (slotId === "tail") return { x: centerX, y: frame.height - 1 };
  if (slotId === "interior" && frame.height <= 2) {
    return { x: Math.max(0, centerX - 1), y: centerY };
  }
  return { x: centerX, y: centerY };
}

function overlayCosmeticParts(frame: ShipVariant["sprite"], cosmetics: ShipCosmeticPart[]): ShipVariant["sprite"] {
  const lines = frame.lines.map((line) => Array.from(line));
  const put = (x: number, y: number, marker: string) => {
    const row = lines[y];
    if (!row || x < 0 || x >= row.length) return;
    row[x] = marker;
  };

  for (const part of cosmetics) {
    const { x, y } = getCosmeticCoordinates(frame, part.slotId);
    put(x, y, part.marker);

    if (part.slotId === "nose") {
      if (part.id === "nose-fork") {
        put(x - 1, y + 1, "/");
        put(x + 1, y + 1, "\\");
      } else if (part.id === "nose-flat") {
        put(x - 1, y, "=");
        put(x + 1, y, "=");
      } else if (part.id === "nose-beak") {
        put(x, y + 1, "!");
      } else if (part.id === "nose-dome") {
        put(x, y + 1, "O");
      }
    } else if (part.slotId === "leftWing") {
      if (part.id === "left-round") {
        put(x + 1, y, "o");
      } else if (part.id === "left-blade") {
        put(x + 1, y, "<");
      } else if (part.id === "left-flat") {
        put(x + 1, y, "|");
      } else if (part.id === "left-fork") {
        put(x + 1, y - 1, "/");
        put(x + 1, y + 1, "\\");
      } else {
        put(x + 1, y, "<");
      }
    } else if (part.slotId === "rightWing") {
      if (part.id === "right-round") {
        put(x - 1, y, "o");
      } else if (part.id === "right-blade") {
        put(x - 1, y, ">");
      } else if (part.id === "right-flat") {
        put(x - 1, y, "|");
      } else if (part.id === "right-fork") {
        put(x - 1, y - 1, "\\");
        put(x - 1, y + 1, "/");
      } else {
        put(x - 1, y, ">");
      }
    } else if (part.slotId === "tail") {
      if (part.id === "tail-u") {
        put(x - 1, y, "\\");
        put(x + 1, y, "/");
      } else if (part.id === "tail-round") {
        put(x - 1, y, "(");
        put(x + 1, y, ")");
      } else if (part.id === "tail-flat") {
        put(x - 1, y, "_");
        put(x + 1, y, "_");
      } else if (part.id === "tail-split") {
        put(x - 1, y, "v");
        put(x + 1, y, "v");
      }
    } else if (part.slotId === "interior") {
      if (part.id === "inside-open") {
        put(x - 1, y, ".");
        put(x + 1, y, ".");
      } else if (part.id === "inside-eye") {
        put(x - 1, y, "<");
        put(x + 1, y, ">");
      }
    }
  }

  return {
    ...frame,
    lines: lines.map((line) => line.join(""))
  };
}

export function resolveShipDesign(design: ShipDesign, level = 1): ResolvedShipDesign {
  const normalized = normalizeShipDesign(design, level);
  const classConfig = getShipClassConfig(normalized.classId);
  const chassis = getShipVariantForClass(normalized.classId, level);
  const paint = getShipPaintScheme(normalized.paintId, normalized.classId);
  let stats = applyModifiers(chassis.stats, paint.statModifiers);
  const cosmetics = getSelectedCosmeticPartsForDesign(normalized);
  for (const part of cosmetics) {
    stats = applyModifiers(stats, part.statModifiers);
  }
  const selectedModules = getSelectedModulesForDesign(design, chassis);
  for (const module of selectedModules) {
    stats = applyModifiers(stats, module.statModifiers);
  }
  const slots = chassis.attachmentPoints.map((point) => {
    const module = getShipModule(normalized.modules[point.id]);
    if (module) return { point, module };
    return { point };
  });
  const moduleNames = selectedModules.map((module) => module.name);
  const weaponName = getShipDesignWeaponName(normalized, level);
  const shipName = `${normalized.name} ${classConfig.shortName}`;
  const description = moduleNames.length > 0
    ? `${paint.name} ${classConfig.shortName} design with ${moduleNames.slice(0, 3).join(", ")}.`
    : `${paint.name} ${classConfig.shortName} design with open hardpoints.`;
  const sprite = overlayCosmeticParts(overlayModuleMarkers(chassis.sprite, slots), cosmetics);
  const idle = chassis.idle
    ? [
        overlayCosmeticParts(overlayModuleMarkers(chassis.idle[0], slots), cosmetics),
        overlayCosmeticParts(overlayModuleMarkers(chassis.idle[1], slots), cosmetics)
      ] as [ShipVariant["sprite"], ShipVariant["sprite"]]
    : undefined;
  const resolvedStats = {
    ...stats,
    specialTrait: `${chassis.stats.specialTrait} Custom design: ${description}`
  };

  return {
    id: normalized.id,
    name: shipName,
    classId: normalized.classId,
    className: classConfig.displayName,
    chassis,
    paint,
    slots,
    cosmetics,
    stats: resolvedStats,
    weaponName,
    description,
    variant: {
      ...chassis,
      id: `${chassis.id}:${normalized.id}:${paint.id}`,
      name: shipName,
      role: classConfig.role,
      tone: paint.tone,
      sprite,
      ...(idle ? { idle } : {}),
      tags: [...new Set([...chassis.tags, "custom", paint.id])],
      attachmentPoints: chassis.attachmentPoints,
      stats: resolvedStats
    }
  };
}
