<p align="center">
  <img src="assets/invader-tui-banner.webp" alt="Invader TUI arcade banner" width="100%" />
</p>

# Invader TUI

**Invader TUI** is a retro arcade terminal project built around typed sprite assets, reusable TUI widgets, and a playable space-invasion demo. It combines a kitchen-sink renderer for validating the visual system with a live terminal game loop that uses the same component layer.

The project is intentionally terminal-native: no browser canvas, no external game engine, no UI framework. Just TypeScript, ANSI rendering, sprite catalogs, and a lot of arcade pressure.

## Highlights

- **Playable terminal demo** with splash screen, Classic/Turbo mode choice, ship builder, waves, bosses, powerups, upgrades, victory, and game-over flows.
- **Reusable TUI components** for boxes, HUDs, counters, bars, diagnostics, borders, and kitchen-sink previews.
- **Typed asset catalogs** for enemy species, player ships, ship designs, modules, paint schemes, sprite variants, roles, stats, and animation frames.
- **Deterministic snapshot renderer** for testing layouts at fixed terminal sizes.
- **Terminal-safe rendering** with alternate-screen mode, mouse escape filtering, viewport fallback, and clean TTY shutdown.

## Quick Start

```sh
pnpm install
pnpm demo
```

The playable demo requires an interactive TTY. If the terminal is too small, the demo shows a compact fallback instead of overflowing into scrollback.

## Commands

```sh
pnpm demo
pnpm start
pnpm snapshot -- --cols 120 --rows 32
pnpm snapshot -- --cols 120 --rows 32 --component ship-builder --focus options
pnpm snapshot -- --cols 120 --rows 32 --component backgrounds --variant nebula --data dynamic --tick 7 --color
pnpm test
pnpm check
```

| Command | Purpose |
| --- | --- |
| `pnpm demo` | Runs the playable arcade demo. |
| `pnpm start` | Runs the interactive kitchen-sink **component browser**. |
| `pnpm snapshot` | Renders one deterministic kitchen-sink browser frame. |
| `pnpm test` | Runs the Vitest suite. |
| `pnpm check` | Runs TypeScript without emitting files. |

### Kitchen-sink component browser

`pnpm start` opens a navigable catalog of every reusable component. It is data-driven
(modeled on the `@prettui/demo` architecture) and split into three layers:

- **Registry** (`src/kitchen/registry.ts`) — each component is a `ComponentDefinition`
  with `id`, `label`, `description`, `category`, `exportName`, and `optionGroups`
  (`Data` = static/dynamic/empty · `Variant` = component-specific · `Size` =
  compact/comfortable/expanded), grouped into navigation sections.
- **Renderer** (`src/kitchen/render.ts`) — composes a left nav, a live preview, and a
  right options/inspector pane using `@prettui/core` primitives.
- **Interaction** (`src/kitchen/state.ts`) — a pure keyboard reducer driving the
  `navigation → preview → options` focus model.

Browser controls: `Tab` cycle focus · `↑↓`/`WS` move (item or option group) · `←→`/`AD`
select component or change the focused option's value · `p` pause · `f` step · `q` quit.
Snapshot flags: `--component <id> --data <static|dynamic|empty> --variant <id> --density <compact|comfortable|expanded> --focus <navigation|preview|options>`.

### Built on @prettui

invader-tui builds on the published [`@prettui/*`](https://www.npmjs.com/org/prettui)
packages instead of duplicating primitives: `src/tui/ansi.ts` and `src/tui/layout.ts`
re-export `@prettui/core` (theme, `rgb`, `fitAnsi`, `splitRatioWidths`, `hstack`,
`bars`, …), keeping only invader-tui's richer multi-style `box` on top.

## Demo Controls

| Screen | Controls |
| --- | --- |
| Splash | `Enter` / `Space` to continue, `Q` to quit |
| Mode select | `A/D` or arrow keys to choose Classic/Turbo, `Enter` / `Space` to continue |
| Ship select | `Space` or `Tab` to customize the highlighted ship, `A/D` or left/right to choose ship, `Enter` to launch as-is, `R` to reset the highlighted ship |
| Ship customize | `W/S` or up/down to choose Color, Nose, Left, Right, Tail, Inside, Gun, Wing, Engine, Core, Defense, Support, or Name; `A/D` or left/right changes the selected row, `Space` returns to selection, `Enter` launches, `N` cycles presets, `R` restores stock |
| Gameplay | `A/D` or left/right arrows to strafe, `W/S` or up/down to thrust within the lower flight band, `Space` to fire (hold for autofire), `Q` to abort |
| Turbo gameplay | Adds `W` toward the gate, `S` away from the gate, `Shift+A/D` or Shift+left/right to rotate through four headings, `E` for engine thrust, `X` for the charged special weapon, a route mini-map, soft camera follow near screen edges, roaming v2 enemies, loot caches, and slow rotating side asteroids |
| Result | `R` to restart, `Q` to quit |

Victory restarts preserve score and advance the campaign loop. Each loop makes enemies tougher, faster, and more dangerous.

## Gameplay Notes

- White stars are collectible upgrade currency.
- Larger colorful stars grant bigger upgrade value.
- Shield pickups temporarily bring the shield online.
- Ship customization keeps the animated ship selection first in Classic and Turbo; launch stock ships as-is or enter the builder for shape, paint, weapon, wing, engine, core, defense, support, and callsign changes.
- Shape parts and modules change hull, shield, speed, turn rate, damage, fire rate, spread, and star affinity before launch, with the builder showing deltas against the stock chassis.
- Ship upgrades preserve the current design while moving the selected chassis through stronger level variants.
- Classic mode is an 8-wave campaign: escalating formations with fly-in entrances and Galaga-style divers, a vanguard mini-boss at wave 4, veteran formations after it, and a full boss at wave 8.
- Classic flight uses momentum physics: the ship's speed stat sets top velocity and turn rate sets acceleration; diving enemies can ram the hull, and a brief blink of invulnerability follows every hit.
- Chained kills build a combo multiplier (up to x5) that resets when you take damage; wave clears pay an accuracy-scaled bonus and repair the hull.
- The star affinity stat doubles as a tractor field, pulling pickups toward the ship and boosting their value; the spread stat adds angled shots to every volley.
- Turbo mode is a v2 adventure run: the arena fills the terminal, the ship rotates through four clear headings (`GATE`, `EAST`, `AWAY`, `WEST`), the route mini-map shows gate distance and east/west drift, `W` moves toward the gate, `S` can fall back away from it, `E` burns the engine along the current heading, the viewport follows near edges so the world scrolls around the ship, loot caches can be collected for upgrades and route recovery, reaching the final gate opens the boss fight, smarter enemies lead/intercept your heading, large slow gray asteroids rotate in from the sides, occasional threats arrive from behind, low-motion arcade rumble stays in the background, and a smaller charged Nova-style secondary weapon clears pressure.
- Boss waves add special enemy patterns and escort pressure.
- The HUD only shows shield state when shield mechanics are active.

## Project Layout

```text
src/
  assets/          Typed enemy, ship, design, module, and paint catalogs
  kitchen/         Kitchen-sink browser: registry, render, state, types
  render/          Widgets, sprite rendering, dashboard kitchen-sink surface
  sim/             Shared state types and deterministic state builder
  tui/             ANSI and layout shims over @prettui/core
  cli.ts           Kitchen-sink browser CLI entrypoint
  demo.ts          Playable arcade demo
```

## Renderer Model

The project keeps visual primitives small and composable, layered on `@prettui/core`:

- `src/tui/ansi.ts` re-exports `@prettui/core/ansi` (color, width, truncation, alignment).
- `src/tui/layout.ts` re-exports `@prettui/core/layout` and adds invader-tui's multi-style `box`.
- `src/render/widgets.ts` exposes reusable HUD, bar, counter, diagnostics, and catalog panels.
- `src/kitchen/*` turns those widgets into a data-driven, navigable component catalog.
- `src/render/kitchenSink.ts` composes the widgets into the dashboard "overview" surface.
- `src/demo.ts` consumes the same primitives for the playable game.

That split keeps the demo from becoming a one-off rendering fork.

## Snapshot Examples

Render the browser at a compact size:

```sh
pnpm snapshot -- --cols 80 --rows 24
```

Inspect a specific component with options applied:

```sh
pnpm snapshot -- --cols 130 --rows 36 --component borders --variant cyberpunk --color
```

Preview the ship builder entry:

```sh
pnpm snapshot -- --cols 130 --rows 36 --component ship-builder --focus options
```

## Development

Run the core validation before committing:

```sh
pnpm check
pnpm test
```

The tests cover asset catalog validity, width safety, kitchen-sink rendering, and compact HUD behavior.

## License

MIT. See [LICENSE](LICENSE).

## Status

This is an active local project. The current focus is turning the visual system and demo into a fuller terminal arcade experience while keeping the renderer reusable and testable.
