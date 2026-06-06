import type { ShipFamily } from "./types.js";

export const shipFamily: ShipFamily = {
  id: "chassis-variants",
  displayName: "Player Fleet",
  role: "Chassis variants and evolutions of the player starfighters.",
  variants: [
    // --- BAR CHASSIS (Cyan) - Long Ships ---
    {
      id: "ship-bar-chassis-l1",
      name: "Bar Chassis L1",
      role: "base light frigate",
      tone: "cyan",
      sprite: { width: 4, height: 2, lines: ["⣴⣿⣦⠀", "⢨⠿⡅⠀"] },
      idle: [
        { width: 4, height: 2, lines: ["⣴⣿⣦⠀", "⢨⠿⡅⠀"] },
        { width: 4, height: 2, lines: ["⣴⣿⣦⠀", "⢨⠿⡅⠀"] }
      ],
      tags: ["light", "base", "bar"],
      attachmentPoints: [
        { id: "left", label: "Left Wing", x: 0, y: 1, accepts: ["wing", "pod"] },
        { id: "core", label: "Core Sector", x: 1, y: 0, accepts: ["cannon", "reactor", "engine"] },
        { id: "right", label: "Right Wing", x: 2, y: 1, accepts: ["wing", "pod"] }
      ],
      stats: {
        hull: 40,
        shield: 20,
        speed: 8,
        turnRate: 7,
        weaponSlots: 1,
        projectileDamage: 10,
        fireRate: 6,
        spread: 1,
        powerUpAffinity: 5,
        specialTrait: "Standard light strike fighter with a narrow center frame."
      }
    },
    {
      id: "ship-bar-chassis-l2",
      name: "Bar Chassis L2",
      role: "heavy long cruiser",
      tone: "cyan",
      sprite: { width: 4, height: 3, lines: ["⣴⣿⣦⠀", "⢿⣤⡿⠀", "⢰⠛⡆⠀"] },
      idle: [
        { width: 4, height: 3, lines: ["⣴⣿⣦⠀", "⢿⣤⡿⠀", "⢰⠛⡆⠀"] },
        { width: 4, height: 3, lines: ["⣴⣿⣦⠀", "⢿⣤⡿⠀", "⢰⠛⡆⠀"] }
      ],
      tags: ["medium", "interceptor", "bar"],
      attachmentPoints: [
        { id: "left", label: "Left Wing", x: 0, y: 1, accepts: ["wing", "pod", "cannon"] },
        { id: "core", label: "Core Sector", x: 1, y: 2, accepts: ["cannon", "reactor", "engine"] },
        { id: "right", label: "Right Wing", x: 2, y: 1, accepts: ["wing", "pod", "cannon"] }
      ],
      stats: {
        hull: 60,
        shield: 40,
        speed: 7,
        turnRate: 6,
        weaponSlots: 2,
        projectileDamage: 15,
        fireRate: 8,
        spread: 2,
        powerUpAffinity: 6,
        specialTrait: "Upgraded interceptor variant with expanded side thruster blocks."
      }
    },
    {
      id: "ship-bar-chassis-l3",
      name: "Bar Chassis L3",
      role: "colossal heavy frigate",
      tone: "cyan",
      sprite: { width: 5, height: 3, lines: ["⣧⠾⠿⠷⣼", "⢿⢟⣛⡻⡿", "⠘⢾⣿⡷⠃"] },
      idle: [
        { width: 5, height: 3, lines: ["⣧⠾⠿⠷⣼", "⢿⢟⣛⡻⡿", "⠘⢾⣿⡷⠃"] },
        { width: 5, height: 3, lines: ["⣧⠾⠿⠷⣼", "⢿⢟⣛⡻⡿", "⠘⢾⣿⡷⠃"] }
      ],
      tags: ["heavy", "assault", "bar"],
      attachmentPoints: [
        { id: "left-heavy", label: "Left Cannons", x: 0, y: 1, accepts: ["cannon", "shield"] },
        { id: "core-left", label: "Reactor A", x: 1, y: 2, accepts: ["reactor", "autopilot"] },
        { id: "core-right", label: "Reactor B", x: 3, y: 2, accepts: ["reactor", "autopilot"] },
        { id: "right-heavy", label: "Right Cannons", x: 4, y: 1, accepts: ["cannon", "shield"] }
      ],
      stats: {
        hull: 90,
        shield: 70,
        speed: 5,
        turnRate: 4,
        weaponSlots: 4,
        projectileDamage: 24,
        fireRate: 10,
        spread: 3,
        powerUpAffinity: 8,
        specialTrait: "Colossal bar flagship with heavy quad-cannon weapon arrays."
      }
    },

    // --- DELTA CHASSIS (Blue) - Arrowheads ---
    {
      id: "ship-delta-chassis-l1",
      name: "Delta Chassis L1",
      role: "light delta-wing scout",
      tone: "blue",
      sprite: { width: 4, height: 2, lines: ["⣠⣾⣷⣄", "⢏⠀⠀⡹"] },
      idle: [
        { width: 4, height: 2, lines: ["⣠⣾⣷⣄", "⢏⠀⠀⡹"] },
        { width: 4, height: 2, lines: ["⣠⣾⣷⣄", "⢏⠀⠀⡹"] }
      ],
      tags: ["light", "scout", "delta"],
      attachmentPoints: [
        { id: "left", label: "Left Wing", x: 0, y: 1, accepts: ["wing", "pod"] },
        { id: "core", label: "Core Sector", x: 1, y: 0, accepts: ["cannon", "reactor", "engine"] },
        { id: "right", label: "Right Wing", x: 3, y: 1, accepts: ["wing", "pod"] }
      ],
      stats: {
        hull: 30,
        shield: 35,
        speed: 9,
        turnRate: 9,
        weaponSlots: 1,
        projectileDamage: 9,
        fireRate: 5,
        spread: 1,
        powerUpAffinity: 6,
        specialTrait: "Aerodynamic delta-wing design optimized for agile reconnaissance."
      }
    },
    {
      id: "ship-delta-chassis-l2",
      name: "Delta Chassis L2",
      role: "shielded tactical interceptor",
      tone: "blue",
      sprite: { width: 4, height: 3, lines: ["⣠⣾⣷⣄", "⡿⠉⠉⢿", "⠱⡄⢠⠎"] },
      idle: [
        { width: 4, height: 3, lines: ["⣠⣾⣷⣄", "⡿⠉⠉⢿", "⠱⡄⢠⠎"] },
        { width: 4, height: 3, lines: ["⣠⣾⣷⣄", "⡿⠉⠉⢿", "⠱⡄⢠⠎"] }
      ],
      tags: ["medium", "tactical", "delta"],
      attachmentPoints: [
        { id: "left", label: "Left Shield Pod", x: 0, y: 1, accepts: ["shield", "pod"] },
        { id: "core", label: "Core Sector", x: 1, y: 0, accepts: ["cannon", "reactor", "engine"] },
        { id: "right", label: "Right Shield Pod", x: 3, y: 1, accepts: ["shield", "pod"] }
      ],
      stats: {
        hull: 50,
        shield: 60,
        speed: 8,
        turnRate: 8,
        weaponSlots: 2,
        projectileDamage: 14,
        fireRate: 7,
        spread: 2,
        powerUpAffinity: 7,
        specialTrait: "Equipped with dual structural support shields along the main wings."
      }
    },
    {
      id: "ship-delta-chassis-l3",
      name: "Delta Chassis L3",
      role: "tactical vanguard dreadnought",
      tone: "blue",
      sprite: { width: 5, height: 3, lines: ["⢀⣴⣿⣦⡀", "⣿⠋⠉⠙⣿", "⠣⣄⠀⣠⠜"] },
      idle: [
        { width: 5, height: 3, lines: ["⢀⣴⣿⣦⡀", "⣿⠋⠉⠙⣿", "⠣⣄⠀⣠⠜"] },
        { width: 5, height: 3, lines: ["⢀⣴⣿⣦⡀", "⣿⠋⠉⠙⣿", "⠣⣄⠀⣠⠜"] }
      ],
      tags: ["heavy", "vanguard", "delta"],
      attachmentPoints: [
        { id: "left-outer", label: "Outer Left Wing", x: 0, y: 2, accepts: ["wing", "cannon"] },
        { id: "core-left", label: "Main Reactor A", x: 1, y: 1, accepts: ["reactor", "engine"] },
        { id: "core-right", label: "Main Reactor B", x: 3, y: 1, accepts: ["reactor", "engine"] },
        { id: "right-outer", label: "Outer Right Wing", x: 4, y: 2, accepts: ["wing", "cannon"] }
      ],
      stats: {
        hull: 80,
        shield: 100,
        speed: 6,
        turnRate: 6,
        weaponSlots: 3,
        projectileDamage: 22,
        fireRate: 8,
        spread: 2,
        powerUpAffinity: 9,
        specialTrait: "Vanguard heavy dreadnought with a dense wedge forcefield array."
      }
    },

    // --- RING CHASSIS (Purple) - Saucer/Ring Class ---
    {
      id: "ship-ring-chassis-l1",
      name: "Ring Chassis L1",
      role: "light energy saucer",
      tone: "purple",
      sprite: { width: 4, height: 2, lines: ["⣴⠋⠙⣦", "⠻⣄⣠⠟"] },
      idle: [
        { width: 4, height: 2, lines: ["⣴⠋⠙⣦", "⠻⣄⣠⠟"] },
        { width: 4, height: 2, lines: ["⣴⠋⠙⣦", "⠻⣄⣠⠟"] }
      ],
      tags: ["light", "saucer", "ring"],
      attachmentPoints: [
        { id: "ring-left", label: "Left Node", x: 0, y: 0, accepts: ["pod", "shield"] },
        { id: "ring-core", label: "Core Node", x: 1, y: 1, accepts: ["reactor", "engine", "cannon"] },
        { id: "ring-right", label: "Right Node", x: 3, y: 0, accepts: ["pod", "shield"] }
      ],
      stats: {
        hull: 35,
        shield: 30,
        speed: 8,
        turnRate: 8,
        weaponSlots: 1,
        projectileDamage: 12,
        fireRate: 4,
        spread: 1,
        powerUpAffinity: 7,
        specialTrait: "Circular hull that distributes structural hits evenly around the reactor."
      }
    },
    {
      id: "ship-ring-chassis-l2",
      name: "Ring Chassis L2",
      role: "stabilized energy cruiser",
      tone: "purple",
      sprite: { width: 4, height: 3, lines: ["⣴⠋⠙⣦", "⣿⠘⠃⣿", "⠻⣄⣠⠟"] },
      idle: [
        { width: 4, height: 3, lines: ["⣴⠋⠙⣦", "⣿⠘⠃⣿", "⠻⣄⣠⠟"] },
        { width: 4, height: 3, lines: ["⣴⠋⠙⣦", "⣿⠘⠃⣿", "⠻⣄⣠⠟"] }
      ],
      tags: ["medium", "cruiser", "ring"],
      attachmentPoints: [
        { id: "wing-left", label: "Left Node", x: 0, y: 0, accepts: ["pod", "shield", "cannon"] },
        { id: "core", label: "Core Node", x: 1, y: 1, accepts: ["reactor", "engine"] },
        { id: "wing-right", label: "Right Node", x: 3, y: 0, accepts: ["pod", "shield", "cannon"] }
      ],
      stats: {
        hull: 55,
        shield: 50,
        speed: 7,
        turnRate: 7,
        weaponSlots: 2,
        projectileDamage: 18,
        fireRate: 6,
        spread: 2,
        powerUpAffinity: 8,
        specialTrait: "Upgraded cruiser with dual focal nodes for energy weapons."
      }
    },
    {
      id: "ship-ring-chassis-l3",
      name: "Ring Chassis L3",
      role: "heavy singularity dreadnought",
      tone: "purple",
      sprite: { width: 5, height: 3, lines: ["⣠⠞⠉⠳⣄", "⣿⠰⣿⠆⣿", "⠙⢦⣀⡴⠋"] },
      idle: [
        { width: 5, height: 3, lines: ["⣠⠞⠉⠳⣄", "⣿⠰⣿⠆⣿", "⠙⢦⣀⡴⠋"] },
        { width: 5, height: 3, lines: ["⣠⠞⠉⠳⣄", "⣿⠰⣿⠆⣿", "⠙⢦⣀⡴⠋"] }
      ],
      tags: ["heavy", "dreadnought", "ring"],
      attachmentPoints: [
        { id: "outer-left", label: "Left Singularity Bank", x: 0, y: 0, accepts: ["cannon", "shield"] },
        { id: "core-left", label: "Main Reactor A", x: 1, y: 1, accepts: ["reactor", "engine"] },
        { id: "core-right", label: "Main Reactor B", x: 3, y: 1, accepts: ["reactor", "engine"] },
        { id: "outer-right", label: "Right Singularity Bank", x: 4, y: 0, accepts: ["cannon", "shield"] }
      ],
      stats: {
        hull: 85,
        shield: 90,
        speed: 5,
        turnRate: 5,
        weaponSlots: 3,
        projectileDamage: 28,
        fireRate: 7,
        spread: 3,
        powerUpAffinity: 10,
        specialTrait: "Advanced circular heavy battleship utilizing a core micro-singularity engine."
      }
    },

    // --- WEDGE CHASSIS (Amber) - Wide Blocks ---
    {
      id: "ship-wedge-chassis-l1",
      name: "Wedge Chassis L1",
      role: "broad wing striker",
      tone: "amber",
      sprite: { width: 4, height: 2, lines: ["⣴⣿⣿⣦", "⠙⡿⢿⠋"] },
      idle: [
        { width: 4, height: 2, lines: ["⣴⣿⣿⣦", "⠙⡿⢿⠋"] },
        { width: 4, height: 2, lines: ["⣴⣿⣿⣦", "⠙⡿⢿⠋"] }
      ],
      tags: ["light", "striker", "wedge"],
      attachmentPoints: [
        { id: "left", label: "Left Wing", x: 0, y: 1, accepts: ["wing", "armor"] },
        { id: "core", label: "Core Sector", x: 1, y: 0, accepts: ["cannon", "reactor", "engine"] },
        { id: "right", label: "Right Wing", x: 3, y: 1, accepts: ["wing", "armor"] }
      ],
      stats: {
        hull: 50,
        shield: 15,
        speed: 7,
        turnRate: 8,
        weaponSlots: 1,
        projectileDamage: 13,
        fireRate: 5,
        spread: 1,
        powerUpAffinity: 4,
        specialTrait: "Durable metal plating increases crash survival and frontal defense."
      }
    },
    {
      id: "ship-wedge-chassis-l2",
      name: "Wedge Chassis L2",
      role: "heavy armor juggernaut",
      tone: "amber",
      sprite: { width: 4, height: 3, lines: ["⣴⣿⣿⣦", "⢿⣿⣿⡿", "⠈⡿⢿⠁"] },
      idle: [
        { width: 4, height: 3, lines: ["⣴⣿⣿⣦", "⢿⣿⣿⡿", "⠈⡿⢿⠁"] },
        { width: 4, height: 3, lines: ["⣴⣿⣿⣦", "⢿⣿⣿⡿", "⠈⡿⢿⠁"] }
      ],
      tags: ["medium", "juggernaut", "wedge"],
      attachmentPoints: [
        { id: "left-plating", label: "Left Armor Plating", x: 0, y: 1, accepts: ["armor", "cannon"] },
        { id: "core", label: "Core Sector", x: 1, y: 0, accepts: ["cannon", "reactor", "engine"] },
        { id: "right-plating", label: "Right Armor Plating", x: 3, y: 1, accepts: ["armor", "cannon"] }
      ],
      stats: {
        hull: 75,
        shield: 30,
        speed: 6,
        turnRate: 7,
        weaponSlots: 2,
        projectileDamage: 20,
        fireRate: 6,
        spread: 2,
        powerUpAffinity: 5,
        specialTrait: "Thickened outer armor plates for high-threat forward operations."
      }
    },
    {
      id: "ship-wedge-chassis-l3",
      name: "Wedge Chassis L3",
      role: "colossal flat dreadnought",
      tone: "amber",
      sprite: { width: 5, height: 3, lines: ["⣠⣾⣿⣷⣄", "⣿⣿⣿⣿⣿", "⠘⢿⠿⡿⠃"] },
      idle: [
        { width: 5, height: 3, lines: ["⣠⣾⣿⣷⣄", "⣿⣿⣿⣿⣿", "⠘⢿⠿⡿⠃"] },
        { width: 5, height: 3, lines: ["⣠⣾⣿⣷⣄", "⣿⣿⣿⣿⣿", "⠘⢿⠿⡿⠃"] }
      ],
      tags: ["heavy", "bastion", "wedge"],
      attachmentPoints: [
        { id: "left-heavy", label: "Left Defense Array", x: 0, y: 1, accepts: ["cannon", "armor"] },
        { id: "core-left", label: "Heavy Core A", x: 1, y: 2, accepts: ["reactor", "engine"] },
        { id: "core-right", label: "Heavy Core B", x: 3, y: 2, accepts: ["reactor", "engine"] },
        { id: "right-heavy", label: "Right Defense Array", x: 4, y: 1, accepts: ["cannon", "armor"] }
      ],
      stats: {
        hull: 110,
        shield: 45,
        speed: 4,
        turnRate: 5,
        weaponSlots: 4,
        projectileDamage: 32,
        fireRate: 8,
        spread: 3,
        powerUpAffinity: 7,
        specialTrait: "Ultimate armored wedge class flagship. Extremely high hull rating."
      }
    }
  ]
};
