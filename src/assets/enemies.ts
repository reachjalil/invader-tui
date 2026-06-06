import type { EnemySpecies } from "./types.js";

const width = 3;
const height = 2;
const wideWidth = 4;

export const enemySpecies: EnemySpecies = {
  id: "swarm-variants",
  displayName: "Swarm Armada",
  lore: "A massive variety of hostile insectoid drone chassis with unified leveling modules.",
  variants: [
    // === REGULAR MINIONS (Level 1) ===
    {
      id: "enemy-mite-grunt-l1",
      name: "Mite Grunt L1",
      role: "base swarm unit",
      tone: "lime",
      sprite: { width, height, lines: ["⣵⣒⣮", "⡝⠛⢫"] },
      idle: [
        { width, height, lines: ["⣵⣒⣮", "⡝⠛⢫"] },
        { width, height, lines: ["⣵⣒⣮", "⢹⠛⡏"] }
      ],
      tags: ["grunt", "base", "mite"],
      attachmentPoints: [
        { id: "left", label: "Left Prong", x: 0, y: 0, accepts: ["leg", "spike"] },
        { id: "core", label: "Core", x: 1, y: 0, accepts: ["eye", "weakpoint"] },
        { id: "right", label: "Right Prong", x: 2, y: 0, accepts: ["leg", "spike"] },
        { id: "underbelly", label: "Underbelly", x: 1, y: 1, accepts: ["leg"] }
      ],
      stats: {
        hp: 24,
        armor: 1,
        speed: 6,
        collisionDamage: 5,
        scoreValue: 100,
        fireRate: 1,
        swarmWeight: 4,
        specialTrait: "Standard scouting bug. Small body frame and quick reflexes.",
        weakness: "Centered weapon hits"
      }
    },
    {
      id: "enemy-tick-drone-l1",
      name: "Tick Drone L1",
      role: "explosing shield disruptor",
      tone: "slate",
      sprite: { width, height, lines: ["⢾⣉⡷", "⠎⠉⠱"] },
      idle: [
        { width, height, lines: ["⢾⣉⡷", "⠎⠉⠱"] },
        { width, height, lines: ["⢾⣉⡷", "⠜⠉⠣"] }
      ],
      tags: ["drone", "explosive", "tick"],
      attachmentPoints: [
        { id: "core", label: "Detonator Core", x: 1, y: 0, accepts: ["mutation"] },
        { id: "legs", label: "Runner Legs", x: 1, y: 1, accepts: ["leg"] }
      ],
      stats: {
        hp: 18,
        armor: 0,
        speed: 9,
        collisionDamage: 15,
        scoreValue: 120,
        fireRate: 0,
        swarmWeight: 3,
        specialTrait: "Detonates shield-disrupting EMP pulses on crash.",
        weakness: "Low health rating"
      }
    },
    {
      id: "enemy-spore-pod-l1",
      name: "Spore Pod L1",
      role: "floating toxic mine",
      tone: "white",
      sprite: { width, height, lines: ["⣴⠛⣦", "⠈⠛⠁"] },
      idle: [
        { width, height, lines: ["⣴⠛⣦", "⠈⠛⠁"] },
        { width, height, lines: ["⣴⠿⣦", "⠘⠛⠃"] }
      ],
      tags: ["mine", "biological", "spore"],
      attachmentPoints: [
        { id: "core", label: "Spore Sack", x: 1, y: 0, accepts: ["weakpoint"] }
      ],
      stats: {
        hp: 30,
        armor: 2,
        speed: 3,
        collisionDamage: 8,
        scoreValue: 80,
        fireRate: 1,
        swarmWeight: 2,
        specialTrait: "Slowly drifts in space, releasing corrosive spore particles.",
        weakness: "Slow speed"
      }
    },

    // === SECOND TO COMMAND COMMANDERS (Level 2) ===
    {
      id: "enemy-mite-hunter-l2",
      name: "Mite Hunter L2",
      role: "specialist targeting unit",
      tone: "cyan",
      sprite: { width, height, lines: ["⡞⣭⢳", "⡝⠛⢫"] },
      idle: [
        { width, height, lines: ["⡞⣭⢳", "⡝⠛⢫"] },
        { width, height, lines: ["⡞⣭⢳", "⡹⠛⢏"] }
      ],
      tags: ["hunter", "elite", "mite"],
      attachmentPoints: [
        { id: "left-wing", label: "Left Saber", x: 0, y: 0, accepts: ["spike", "armor"] },
        { id: "sensor", label: "Sensor Pod", x: 1, y: 0, accepts: ["sensor", "weakpoint"] },
        { id: "right-wing", label: "Right Saber", x: 2, y: 0, accepts: ["spike", "armor"] },
        { id: "thruster", label: "Bio-Engine", x: 1, y: 1, accepts: ["runner", "splitter"] }
      ],
      stats: {
        hp: 48,
        armor: 3,
        speed: 8,
        collisionDamage: 12,
        scoreValue: 250,
        fireRate: 2,
        swarmWeight: 6,
        specialTrait: "Target-seeking optics. Hardened carapace with twin tail runners.",
        weakness: "Vulnerable side wings"
      }
    },
    {
      id: "enemy-stinger-elite-l2",
      name: "Stinger Elite L2",
      role: "fast energy striker",
      tone: "red",
      sprite: { width, height, lines: ["⣵⣒⣮", "⢙⠿⡋"] },
      idle: [
        { width, height, lines: ["⣵⣒⣮", "⢙⠿⡋"] },
        { width, height, lines: ["⣵⣒⣮", "⠙⣿⠋"] }
      ],
      tags: ["striker", "commander", "stinger"],
      attachmentPoints: [
        { id: "stinger", label: "Heavy Tail Stinger", x: 1, y: 1, accepts: ["stinger"] },
        { id: "left-claw", label: "Left Claw", x: 0, y: 0, accepts: ["spike"] },
        { id: "right-claw", label: "Right Claw", x: 2, y: 0, accepts: ["spike"] }
      ],
      stats: {
        hp: 42,
        armor: 2,
        speed: 9,
        collisionDamage: 14,
        scoreValue: 280,
        fireRate: 2,
        swarmWeight: 5,
        specialTrait: "Fires localized energy plasma sting charges.",
        weakness: "Low armor defenses"
      }
    },
    {
      id: "enemy-warden-sentinel-l2",
      name: "Warden L2",
      role: "defense coordinator",
      tone: "purple",
      sprite: { width, height, lines: ["⣞⣿⣳", "⡝⠛⢫"] },
      idle: [
        { width, height, lines: ["⣞⣿⣳", "⡝⠛⢫"] },
        { width, height, lines: ["⣞⣿⣳", "⡹⠛⢏"] }
      ],
      tags: ["warden", "defense", "sentinel"],
      attachmentPoints: [
        { id: "shield-gen", label: "Deflector Core", x: 1, y: 0, accepts: ["mutation"] },
        { id: "left-guard", label: "Left Guard", x: 0, y: 1, accepts: ["armor"] },
        { id: "right-guard", label: "Right Guard", x: 2, y: 1, accepts: ["armor"] }
      ],
      stats: {
        hp: 55,
        armor: 4,
        speed: 5,
        collisionDamage: 10,
        scoreValue: 300,
        fireRate: 1,
        swarmWeight: 7,
        specialTrait: "Projects structural forcefields around nearby minions.",
        weakness: "Core system overheat"
      }
    },

    // === ELITE BOSSES (Level 3) ===
    {
      id: "enemy-mite-monarch-l3",
      name: "Mite Monarch L3",
      role: "heavy flagship boss",
      tone: "amber",
      sprite: { width: wideWidth, height, lines: ["⣾⣻⣟⣷", "⡝⡟⢻⢫"] },
      idle: [
        { width: wideWidth, height, lines: ["⣾⣻⣟⣷", "⡝⡟⢻⢫"] },
        { width: wideWidth, height, lines: ["⣾⣻⣟⣷", "⡹⠻⠟⢏"] }
      ],
      tags: ["boss", "monarch", "mite"],
      attachmentPoints: [
        { id: "left-heavy", label: "Heavy Arm", x: 0, y: 0, accepts: ["armor", "stinger"] },
        { id: "core-left", label: "Core Sector A", x: 1, y: 0, accepts: ["eye", "mutation"] },
        { id: "core-right", label: "Core Sector B", x: 2, y: 0, accepts: ["eye", "mutation"] },
        { id: "right-heavy", label: "Heavy Arm", x: 3, y: 0, accepts: ["armor", "stinger"] },
        { id: "under-shield", label: "Belly Shield", x: 1, y: 1, accepts: ["armor"] }
      ],
      stats: {
        hp: 120,
        armor: 6,
        speed: 4,
        collisionDamage: 25,
        scoreValue: 800,
        fireRate: 3,
        swarmWeight: 12,
        specialTrait: "Massive biological dreadnought. Heavy plating shrugs off light attacks.",
        weakness: "Exposed core underbelly"
      }
    },
    {
      id: "enemy-behemoth-titan-l3",
      name: "Behemoth Titan L3",
      role: "armored battering ram",
      tone: "red",
      sprite: { width: wideWidth, height, lines: ["⣿⣛⣛⣿", "⡝⡟⢻⢫"] },
      idle: [
        { width: wideWidth, height, lines: ["⣿⣛⣛⣿", "⡝⡟⢻⢫"] },
        { width: wideWidth, height, lines: ["⣿⣛⣛⣿", "⡹⠻⠟⢏"] }
      ],
      tags: ["boss", "titan", "behemoth"],
      attachmentPoints: [
        { id: "left-tusk", label: "Left Tusk", x: 0, y: 0, accepts: ["spike"] },
        { id: "core-left", label: "Heavy Core A", x: 1, y: 0, accepts: ["armor"] },
        { id: "core-right", label: "Heavy Core B", x: 2, y: 0, accepts: ["armor"] },
        { id: "right-tusk", label: "Right Tusk", x: 3, y: 0, accepts: ["spike"] }
      ],
      stats: {
        hp: 150,
        armor: 8,
        speed: 3,
        collisionDamage: 40,
        scoreValue: 900,
        fireRate: 1,
        swarmWeight: 15,
        specialTrait: "Unstoppable biological battering ram with maximum armor plating.",
        weakness: "Slow maneuvering speed"
      }
    },
    {
      id: "enemy-leviathan-core-l3",
      name: "Leviathan Core L3",
      role: "orbital artillery boss",
      tone: "purple",
      sprite: { width: wideWidth, height, lines: ["⡞⣭⣭⢳", "⢙⠖⠲⡋"] },
      idle: [
        { width: wideWidth, height, lines: ["⡞⣭⣭⢳", "⢙⠖⠲⡋"] },
        { width: wideWidth, height, lines: ["⡞⣭⣭⢳", "⠙⡖⢲⠋"] }
      ],
      tags: ["boss", "core", "leviathan"],
      attachmentPoints: [
        { id: "left-generator", label: "Left Collector", x: 0, y: 0, accepts: ["reactor"] },
        { id: "beam-emitter", label: "Fusion Emitter", x: 1, y: 1, accepts: ["cannon"] },
        { id: "right-generator", label: "Right Collector", x: 3, y: 0, accepts: ["reactor"] }
      ],
      stats: {
        hp: 100,
        armor: 4,
        speed: 5,
        collisionDamage: 20,
        scoreValue: 1000,
        fireRate: 4,
        swarmWeight: 14,
        specialTrait: "Fires high-intensity fusion lasers that lock onto player ships.",
        weakness: "Vulnerable generator pods"
      }
    }
  ]
};
