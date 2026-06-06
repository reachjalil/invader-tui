<p align="center">
  <img src="assets/invader-tui-banner.webp" alt="Invader TUI arcade banner" width="100%" />
</p>

# Invader TUI

**Invader TUI** is a retro arcade terminal project built around typed sprite assets, reusable TUI widgets, and a playable space-invasion demo. It combines a kitchen-sink renderer for validating the visual system with a live terminal game loop that uses the same component layer.

The project is intentionally terminal-native: no browser canvas, no external game engine, no UI framework. Just TypeScript, ANSI rendering, sprite catalogs, and a lot of arcade pressure.

## Highlights

- **Playable terminal demo** with splash screen, ship selection, waves, bosses, powerups, upgrades, victory, and game-over flows.
- **Reusable TUI components** for boxes, HUDs, counters, bars, diagnostics, borders, and kitchen-sink previews.
- **Typed asset catalogs** for enemy species, player ships, sprite variants, roles, stats, and animation frames.
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
pnpm snapshot -- --cols 100 --rows 30
pnpm snapshot -- --cols 100 --rows 30 --focus ships --bg stars --border arcade --color
pnpm test
pnpm check
```

| Command | Purpose |
| --- | --- |
| `pnpm demo` | Runs the playable arcade demo. |
| `pnpm start` | Runs the animated kitchen-sink preview loop. |
| `pnpm snapshot` | Renders one deterministic kitchen-sink frame. |
| `pnpm test` | Runs the Vitest suite. |
| `pnpm check` | Runs TypeScript without emitting files. |

## Demo Controls

| Screen | Controls |
| --- | --- |
| Splash | `Enter` / `Space` to continue, `Q` to quit |
| Ship select | `A/D` or arrow keys to select, `Enter` to launch |
| Gameplay | `A/D` or arrow keys to move, `Space` to shoot, `Q` to abort |
| Result | `R` to restart, `Q` to quit |

Victory restarts preserve score and advance the campaign loop. Each loop makes enemies tougher, faster, and more dangerous.

## Gameplay Notes

- White stars are collectible upgrade currency.
- Larger colorful stars grant bigger upgrade value.
- Shield pickups temporarily bring the shield online.
- Ship upgrades unlock stronger weapons.
- Boss waves add special enemy patterns and escort pressure.
- The HUD only shows shield state when shield mechanics are active.

## Project Layout

```text
src/
  assets/          Typed enemy and ship sprite catalogs
  render/          Kitchen-sink renderer, widgets, sprite rendering
  sim/             Shared state types and deterministic state builder
  tui/             ANSI and layout primitives
  cli.ts           Kitchen-sink CLI entrypoint
  demo.ts          Playable arcade demo
```

## Renderer Model

The project keeps visual primitives small and composable:

- `src/tui/ansi.ts` handles ANSI color, width, truncation, and alignment.
- `src/tui/layout.ts` owns boxes, borders, stacking, dividers, and frame normalization.
- `src/render/widgets.ts` exposes reusable HUD, bar, counter, diagnostics, and catalog panels.
- `src/render/kitchenSink.ts` composes the component library into a broad visual test surface.
- `src/demo.ts` consumes the same primitives for the playable game.

That split keeps the demo from becoming a one-off rendering fork.

## Snapshot Examples

Render a compact frame:

```sh
pnpm snapshot -- --cols 80 --rows 24
```

Render a larger themed frame:

```sh
pnpm snapshot -- --cols 120 --rows 36 --focus enemies --bg crt --border arcade --color
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
